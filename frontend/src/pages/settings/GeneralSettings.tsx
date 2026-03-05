import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cloneDeep, merge, isEqual } from 'lodash';
import { Banner, Button, Card, Input, Select, Spin, Toast, Typography } from '@douyinfe/semi-ui';
import TextArea from '@douyinfe/semi-ui/lib/es/input/textarea';
import Checkbox from '@douyinfe/semi-ui/lib/es/checkbox';
import { FolderOpen, Volume2 } from 'lucide-react';
import {
  DEFAULT_COMMIT_REMINDER_PROMPT,
  DEFAULT_PR_DESCRIPTION_PROMPT,
  EditorType,
  SoundFile,
  ThemeMode,
  UiLanguage,
} from 'shared/types';
import { getLanguageOptions } from '@/i18n/languages';

import { toPrettyCase } from '@/utils/string';
import { useEditorAvailability } from '@/hooks/useEditorAvailability';
import { EditorAvailabilityIndicator } from '@/components/EditorAvailabilityIndicator';
import { useTheme } from '@/components/ThemeProvider';
import { useUserSystem } from '@/components/ConfigProvider';
import { TagManager } from '@/components/TagManager';
import { FolderPickerDialog } from '@/components/dialogs/shared/FolderPickerDialog';

export function GeneralSettings() {
  const { t } = useTranslation(['settings', 'common']);

  // Get language options with proper display names
  const languageOptions = getLanguageOptions(
    t('language.browserDefault', {
      ns: 'common',
      defaultValue: 'Browser Default',
    })
  );
  const {
    config,
    loading,
    updateAndSaveConfig, // Use this on Save
  } = useUserSystem();

  // Draft state management
  const [draft, setDraft] = useState(() => (config ? cloneDeep(config) : null));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [branchPrefixError, setBranchPrefixError] = useState<string | null>(
    null
  );
  const { setTheme } = useTheme();

  // Check editor availability when draft editor changes
  const editorAvailability = useEditorAvailability(draft?.editor.editor_type);

  const validateBranchPrefix = useCallback(
    (prefix: string): string | null => {
      if (!prefix) return null; // empty allowed
      if (prefix.includes('/'))
        return t('settings.general.git.branchPrefix.errors.slash');
      if (prefix.startsWith('.'))
        return t('settings.general.git.branchPrefix.errors.startsWithDot');
      if (prefix.endsWith('.') || prefix.endsWith('.lock'))
        return t('settings.general.git.branchPrefix.errors.endsWithDot');
      if (prefix.includes('..') || prefix.includes('@{'))
        return t('settings.general.git.branchPrefix.errors.invalidSequence');
      if (/[ \t~^:?*[\\]/.test(prefix))
        return t('settings.general.git.branchPrefix.errors.invalidChars');
      // Control chars check
      for (let i = 0; i < prefix.length; i++) {
        const code = prefix.charCodeAt(i);
        if (code < 0x20 || code === 0x7f)
          return t('settings.general.git.branchPrefix.errors.controlChars');
      }
      return null;
    },
    [t]
  );

  // When config loads or changes externally, update draft only if not dirty
  useEffect(() => {
    if (!config) return;
    if (!dirty) {
      setDraft(cloneDeep(config));
    }
  }, [config, dirty]);

  // Check for unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    if (!draft || !config) return false;
    return !isEqual(draft, config);
  }, [draft, config]);

  // Generic draft update helper
  const updateDraft = useCallback(
    (patch: Partial<typeof config>) => {
      setDraft((prev: typeof config) => {
        if (!prev) return prev;
        const next = merge({}, prev, patch);
        // Mark dirty if changed
        if (!isEqual(next, config)) {
          setDirty(true);
        }
        return next;
      });
    },
    [config]
  );

  // Optional: warn on tab close/navigation with unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);

  const playSound = async (soundFile: SoundFile) => {
    const audio = new Audio(`/api/sounds/${soundFile}`);
    try {
      await audio.play();
    } catch (err) {
      console.error('Failed to play sound:', err);
    }
  };

  const handleSave = async () => {
    if (!draft) return;

    setSaving(true);
    setError(null);

    try {
      await updateAndSaveConfig(draft); // Atomically apply + persist
      setTheme(draft.theme);
      setDirty(false);
      Toast.success(t('settings.general.save.success'));
    } catch (err) {
      const message = t('settings.general.save.error');
      setError(message);
      Toast.error(message);
      console.error('Error saving config:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (!config) return;
    setDraft(cloneDeep(config));
    setDirty(false);
  };

  const handleBrowseWorkspaceDir = async () => {
    const result = await FolderPickerDialog.show({
      value: draft?.workspace_dir ?? '',
      title: t('settings.general.git.workspaceDir.dialogTitle'),
      description: t('settings.general.git.workspaceDir.dialogDescription'),
    });
    if (result) {
      updateDraft({ workspace_dir: result });
    }
  };

  const resetDisclaimer = async () => {
    if (!config) return;
    updateAndSaveConfig({ disclaimer_acknowledged: false });
  };

  const resetOnboarding = async () => {
    if (!config) return;
    updateAndSaveConfig({ onboarding_acknowledged: false });
  };

  if (loading) {
    return (
      <div className="py-8 flex items-center gap-2">
        <Spin />
        <Typography.Text type="tertiary">
          {t('settings.general.loading')}
        </Typography.Text>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="py-8">
        <Banner
          type="danger"
          fullMode={false}
          description={t('settings.general.loadError')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!!error && <Banner type="danger" fullMode={false} description={error} />}

      <Card
        title={t('settings.general.appearance.title')}
        headerExtraContent={
          <Typography.Text type="tertiary">
            {t('settings.general.appearance.description')}
          </Typography.Text>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Typography.Text strong>
              {t('settings.general.appearance.theme.label')}
            </Typography.Text>
            <Select
              value={draft?.theme}
              placeholder={t('settings.general.appearance.theme.placeholder')}
              optionList={Object.values(ThemeMode).map((theme) => ({
                value: theme,
                label: toPrettyCase(theme),
              }))}
              onChange={(value) => updateDraft({ theme: String(value) as ThemeMode })}
            />
            <Typography.Text type="tertiary">
              {t('settings.general.appearance.theme.helper')}
            </Typography.Text>
          </div>

          <div className="space-y-2">
            <Typography.Text strong>
              {t('settings.general.appearance.language.label')}
            </Typography.Text>
            <Select
              value={draft?.language}
              placeholder={t('settings.general.appearance.language.placeholder')}
              optionList={languageOptions.map((opt) => ({
                value: opt.value,
                label: opt.label,
              }))}
              onChange={(value) =>
                updateDraft({ language: String(value) as UiLanguage })
              }
            />
            <Typography.Text type="tertiary">
              {t('settings.general.appearance.language.helper')}
            </Typography.Text>
          </div>
        </div>
      </Card>

      <Card
        title={t('settings.general.editor.title')}
        headerExtraContent={
          <Typography.Text type="tertiary">
            {t('settings.general.editor.description')}
          </Typography.Text>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Typography.Text strong>
              {t('settings.general.editor.type.label')}
            </Typography.Text>
            <Select
              value={draft?.editor.editor_type}
              placeholder={t('settings.general.editor.type.placeholder')}
              optionList={Object.values(EditorType).map((editor) => ({
                value: editor,
                label: toPrettyCase(editor),
              }))}
              onChange={(value) =>
                updateDraft({
                  editor: {
                    ...draft!.editor,
                    editor_type: String(value) as EditorType,
                  },
                })
              }
            />

            {/* Editor availability status indicator */}
            {draft?.editor.editor_type !== EditorType.CUSTOM && (
              <EditorAvailabilityIndicator availability={editorAvailability} />
            )}

            <Typography.Text type="tertiary">
              {t('settings.general.editor.type.helper')}
            </Typography.Text>
          </div>

          {draft?.editor.editor_type === EditorType.CUSTOM && (
            <div className="space-y-2">
              <Typography.Text strong>
                {t('settings.general.editor.customCommand.label')}
              </Typography.Text>
              <Input
                placeholder={t(
                  'settings.general.editor.customCommand.placeholder'
                )}
                value={draft?.editor.custom_command || ''}
                onChange={(value) =>
                  updateDraft({
                    editor: {
                      ...draft!.editor,
                      custom_command: String(value) || null,
                    },
                  })
                }
              />
              <Typography.Text type="tertiary">
                {t('settings.general.editor.customCommand.helper')}
              </Typography.Text>
            </div>
          )}

          {(draft?.editor.editor_type === EditorType.VS_CODE ||
            draft?.editor.editor_type === EditorType.VS_CODE_INSIDERS ||
            draft?.editor.editor_type === EditorType.CURSOR ||
            draft?.editor.editor_type === EditorType.WINDSURF ||
            draft?.editor.editor_type === EditorType.GOOGLE_ANTIGRAVITY ||
            draft?.editor.editor_type === EditorType.ZED) && (
            <>
              <div className="space-y-2">
                <Typography.Text strong>
                  {t('settings.general.editor.remoteSsh.host.label')}
                </Typography.Text>
                <Input
                  placeholder={t(
                    'settings.general.editor.remoteSsh.host.placeholder'
                  )}
                  value={draft?.editor.remote_ssh_host || ''}
                  onChange={(value) =>
                    updateDraft({
                      editor: {
                        ...draft!.editor,
                        remote_ssh_host: String(value) || null,
                      },
                    })
                  }
                />
                <Typography.Text type="tertiary">
                  {t('settings.general.editor.remoteSsh.host.helper')}
                </Typography.Text>
              </div>

              {draft?.editor.remote_ssh_host && (
                <div className="space-y-2">
                  <Typography.Text strong>
                    {t('settings.general.editor.remoteSsh.user.label')}
                  </Typography.Text>
                  <Input
                    placeholder={t(
                      'settings.general.editor.remoteSsh.user.placeholder'
                    )}
                    value={draft?.editor.remote_ssh_user || ''}
                    onChange={(value) =>
                      updateDraft({
                        editor: {
                          ...draft!.editor,
                          remote_ssh_user: String(value) || null,
                        },
                      })
                    }
                  />
                  <Typography.Text type="tertiary">
                    {t('settings.general.editor.remoteSsh.user.helper')}
                  </Typography.Text>
                </div>
              )}
            </>
          )}
        </div>
      </Card>

      <Card
        title={t('settings.general.git.title')}
        headerExtraContent={
          <Typography.Text type="tertiary">
            {t('settings.general.git.description')}
          </Typography.Text>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Typography.Text strong>
              {t('settings.general.git.branchPrefix.label')}
            </Typography.Text>
            <Input
              type="text"
              placeholder={t('settings.general.git.branchPrefix.placeholder')}
              value={draft?.git_branch_prefix ?? ''}
              validateStatus={branchPrefixError ? 'error' : 'default'}
              onChange={(value) => {
                const nextValue = String(value).trim();
                updateDraft({ git_branch_prefix: nextValue });
                setBranchPrefixError(validateBranchPrefix(nextValue));
              }}
            />
            {!!branchPrefixError && (
              <Typography.Text type="danger">{branchPrefixError}</Typography.Text>
            )}
            <Typography.Text type="tertiary">
              {t('settings.general.git.branchPrefix.helper')}{' '}
              {draft?.git_branch_prefix ? (
                <>
                  {t('settings.general.git.branchPrefix.preview')}{' '}
                  <Typography.Text code type="tertiary">
                    {t('settings.general.git.branchPrefix.previewWithPrefix', {
                      prefix: draft.git_branch_prefix,
                    })}
                  </Typography.Text>
                </>
              ) : (
                <>
                  {t('settings.general.git.branchPrefix.preview')}{' '}
                  <Typography.Text code type="tertiary">
                    {t('settings.general.git.branchPrefix.previewNoPrefix')}
                  </Typography.Text>
                </>
              )}
            </Typography.Text>
          </div>

          <div className="space-y-2">
            <Typography.Text strong>
              {t('settings.general.git.workspaceDir.label')}
            </Typography.Text>
            <div className="flex space-x-2">
              <Input
                type="text"
                placeholder={t('settings.general.git.workspaceDir.placeholder')}
                value={draft?.workspace_dir ?? ''}
                onChange={(value) =>
                  updateDraft({ workspace_dir: String(value) || null })
                }
              />
              <Button
                htmlType="button"
                theme="outline"
                onClick={handleBrowseWorkspaceDir}
                icon={<FolderOpen size={16} />}
              >
                {t('settings.general.git.workspaceDir.browse')}
              </Button>
            </div>
            <Typography.Text type="tertiary">
              {t('settings.general.git.workspaceDir.helper')}
            </Typography.Text>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="commit-reminder-enabled"
                checked={draft?.commit_reminder_enabled ?? true}
                onChange={(e) =>
                  updateDraft({ commit_reminder_enabled: Boolean(e.target.checked) })
                }
              />
              <div className="space-y-0.5">
                <Typography.Text strong>
                  {t('settings.general.git.commitPrompt.enableLabel')}
                </Typography.Text>
                <Typography.Text type="tertiary">
                  {t('settings.general.git.commitPrompt.enableHelper')}
                </Typography.Text>
              </div>
            </div>
            {draft?.commit_reminder_enabled && (
              <>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="use-custom-commit-prompt"
                    checked={draft?.commit_reminder_prompt != null}
                    onChange={(e) => {
                      if (e.target.checked) {
                        updateDraft({
                          commit_reminder_prompt:
                            DEFAULT_COMMIT_REMINDER_PROMPT,
                        });
                      } else {
                        updateDraft({ commit_reminder_prompt: null });
                      }
                    }}
                  />
                  <Typography.Text strong>
                    {t('settings.general.git.commitPrompt.useCustom')}
                  </Typography.Text>
                </div>
                <TextArea
                  id="commit-reminder-prompt"
                  value={
                    draft?.commit_reminder_prompt ??
                    DEFAULT_COMMIT_REMINDER_PROMPT
                  }
                  disabled={draft?.commit_reminder_prompt == null}
                  autosize={{ maxRows: 12 }}
                  onChange={(value) =>
                    updateDraft({ commit_reminder_prompt: String(value) })
                  }
                />
                <Typography.Text type="tertiary">
                  {t('settings.general.git.commitPrompt.helper')}
                </Typography.Text>
              </>
            )}
          </div>
        </div>
      </Card>

      <Card
        title={t('settings.general.pullRequests.title')}
        headerExtraContent={
          <Typography.Text type="tertiary">
            {t('settings.general.pullRequests.description')}
          </Typography.Text>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="pr-auto-description"
              checked={draft?.pr_auto_description_enabled ?? false}
              onChange={(e) =>
                updateDraft({
                  pr_auto_description_enabled: Boolean(e.target.checked),
                })
              }
            />
            <div className="space-y-0.5">
              <Typography.Text strong>
                {t('settings.general.pullRequests.autoDescription.label')}
              </Typography.Text>
              <Typography.Text type="tertiary">
                {t('settings.general.pullRequests.autoDescription.helper')}
              </Typography.Text>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="use-custom-prompt"
              checked={draft?.pr_auto_description_prompt != null}
              onChange={(e) => {
                if (e.target.checked) {
                  updateDraft({
                    pr_auto_description_prompt: DEFAULT_PR_DESCRIPTION_PROMPT,
                  });
                } else {
                  updateDraft({ pr_auto_description_prompt: null });
                }
              }}
            />
            <Typography.Text strong>
              {t('settings.general.pullRequests.customPrompt.useCustom')}
            </Typography.Text>
          </div>
          <div className="space-y-2">
            <TextArea
              id="pr-custom-prompt"
              value={
                draft?.pr_auto_description_prompt ??
                DEFAULT_PR_DESCRIPTION_PROMPT
              }
              disabled={draft?.pr_auto_description_prompt == null}
              autosize={{ maxRows: 12 }}
              onChange={(value) =>
                updateDraft({ pr_auto_description_prompt: String(value) })
              }
            />
            <Typography.Text type="tertiary">
              {t('settings.general.pullRequests.customPrompt.helper')}
            </Typography.Text>
          </div>
        </div>
      </Card>

      <Card
        title={t('settings.general.notifications.title')}
        headerExtraContent={
          <Typography.Text type="tertiary">
            {t('settings.general.notifications.description')}
          </Typography.Text>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="sound-enabled"
              checked={draft?.notifications.sound_enabled}
              onChange={(e) =>
                updateDraft({
                  notifications: {
                    ...draft!.notifications,
                    sound_enabled: Boolean(e.target.checked),
                  },
                })
              }
            />
            <div className="space-y-0.5">
              <Typography.Text strong>
                {t('settings.general.notifications.sound.label')}
              </Typography.Text>
              <Typography.Text type="tertiary">
                {t('settings.general.notifications.sound.helper')}
              </Typography.Text>
            </div>
          </div>
          {draft?.notifications.sound_enabled && (
            <div className="ml-6 space-y-2">
              <Typography.Text strong>
                {t('settings.general.notifications.sound.fileLabel')}
              </Typography.Text>
              <div className="flex gap-2">
                <Select
                  value={draft.notifications.sound_file}
                  placeholder={t(
                    'settings.general.notifications.sound.filePlaceholder'
                  )}
                  optionList={Object.values(SoundFile).map((soundFile) => ({
                    value: soundFile,
                    label: toPrettyCase(soundFile),
                  }))}
                  onChange={(value) =>
                    updateDraft({
                      notifications: {
                        ...draft.notifications,
                        sound_file: String(value) as SoundFile,
                      },
                    })
                  }
                />
                <Button
                  theme="outline"
                  onClick={() => playSound(draft.notifications.sound_file)}
                  icon={<Volume2 size={16} />}
                >
                  {t('settings.general.notifications.sound.play', {
                    defaultValue: 'Play',
                  })}
                </Button>
              </div>
              <Typography.Text type="tertiary">
                {t('settings.general.notifications.sound.fileHelper')}
              </Typography.Text>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="push-notifications"
              checked={draft?.notifications.push_enabled}
              onChange={(e) =>
                updateDraft({
                  notifications: {
                    ...draft!.notifications,
                    push_enabled: Boolean(e.target.checked),
                  },
                })
              }
            />
            <div className="space-y-0.5">
              <Typography.Text strong>
                {t('settings.general.notifications.push.label')}
              </Typography.Text>
              <Typography.Text type="tertiary">
                {t('settings.general.notifications.push.helper')}
              </Typography.Text>
            </div>
          </div>
        </div>
      </Card>

      <Card
        title={t('settings.general.taskTemplates.title')}
        headerExtraContent={
          <Typography.Text type="tertiary">
            {t('settings.general.taskTemplates.description')}
          </Typography.Text>
        }
      >
        <div>
          <TagManager />
        </div>
      </Card>

      <Card
        title={t('settings.general.safety.title')}
        headerExtraContent={
          <Typography.Text type="tertiary">
            {t('settings.general.safety.description')}
          </Typography.Text>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Typography.Text strong>
                {t('settings.general.safety.disclaimer.title')}
              </Typography.Text>
              <Typography.Text type="tertiary">
                {t('settings.general.safety.disclaimer.description')}
              </Typography.Text>
            </div>
            <Button theme="outline" onClick={resetDisclaimer}>
              {t('settings.general.safety.disclaimer.button')}
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Typography.Text strong>
                {t('settings.general.safety.onboarding.title')}
              </Typography.Text>
              <Typography.Text type="tertiary">
                {t('settings.general.safety.onboarding.description')}
              </Typography.Text>
            </div>
            <Button theme="outline" onClick={resetOnboarding}>
              {t('settings.general.safety.onboarding.button')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Sticky Save Button */}
      <div className="sticky bottom-0 z-10">
        <Card bordered>
          <div className="flex items-center justify-between">
            {hasUnsavedChanges ? (
              <Typography.Text type="tertiary">
                {t('settings.general.save.unsavedChanges')}
              </Typography.Text>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button
                theme="outline"
                onClick={handleDiscard}
                disabled={!hasUnsavedChanges || saving}
              >
                {t('settings.general.save.discard')}
              </Button>
              <Button
                type="primary"
                onClick={handleSave}
                disabled={!hasUnsavedChanges || saving || !!branchPrefixError}
                loading={saving}
              >
                {t('settings.general.save.button')}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
