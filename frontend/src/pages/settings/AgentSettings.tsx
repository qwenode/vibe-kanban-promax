import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cloneDeep, isEqual } from 'lodash';
import { Banner, Button, Card, Select, Spin, Toast, Typography } from '@douyinfe/semi-ui';
import Checkbox from '@douyinfe/semi-ui/lib/es/checkbox';
import { JSONEditor } from '@/components/ui/json-editor';

import { ExecutorConfigForm } from '@/components/ExecutorConfigForm';
import { useProfiles } from '@/hooks/useProfiles';
import { useUserSystem } from '@/components/ConfigProvider';
import { CreateConfigurationDialog } from '@/components/dialogs/settings/CreateConfigurationDialog';
import { DeleteConfigurationDialog } from '@/components/dialogs/settings/DeleteConfigurationDialog';
import { useAgentAvailability } from '@/hooks/useAgentAvailability';
import { AgentAvailabilityIndicator } from '@/components/AgentAvailabilityIndicator';
import type {
  BaseCodingAgent,
  ExecutorConfigs,
  ExecutorProfileId,
} from 'shared/types';

type ExecutorsMap = Record<string, Record<string, Record<string, unknown>>>;

export function AgentSettings() {
  const { t } = useTranslation(['settings', 'common']);
  // Use profiles hook for server state
  const {
    profilesContent: serverProfilesContent,
    profilesPath,
    isLoading: profilesLoading,
    isSaving: profilesSaving,
    error: profilesError,
    save: saveProfiles,
  } = useProfiles();

  const { config, updateAndSaveConfig, profiles, reloadSystem } =
    useUserSystem();

  // Local editor state (draft that may differ from server)
  const [localProfilesContent, setLocalProfilesContent] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);

  // Form-based editor state
  const [useFormEditor, setUseFormEditor] = useState(true);
  const [selectedExecutorType, setSelectedExecutorType] =
    useState<BaseCodingAgent>('CLAUDE_CODE' as BaseCodingAgent);
  const [selectedConfiguration, setSelectedConfiguration] =
    useState<string>('DEFAULT');
  const [localParsedProfiles, setLocalParsedProfiles] =
    useState<ExecutorConfigs | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Default executor profile state
  const [executorDraft, setExecutorDraft] = useState<ExecutorProfileId | null>(
    () => (config?.executor_profile ? cloneDeep(config.executor_profile) : null)
  );
  const [executorSaving, setExecutorSaving] = useState(false);
  const [executorError, setExecutorError] = useState<string | null>(null);

  // Check agent availability when draft executor changes
  const agentAvailability = useAgentAvailability(executorDraft?.executor);

  // Sync server state to local state when not dirty
  useEffect(() => {
    if (!isDirty && serverProfilesContent) {
      setLocalProfilesContent(serverProfilesContent);
      // Parse JSON inside effect to avoid object dependency
      try {
        const parsed = JSON.parse(serverProfilesContent);
        setLocalParsedProfiles(parsed);
      } catch (err) {
        console.error('Failed to parse profiles JSON:', err);
        setLocalParsedProfiles(null);
      }
    }
  }, [serverProfilesContent, isDirty]);

  // Check if executor draft differs from saved config
  const executorDirty =
    executorDraft && config?.executor_profile
      ? !isEqual(executorDraft, config.executor_profile)
      : false;

  // Sync executor draft when config changes (only if not dirty)
  useEffect(() => {
    if (config?.executor_profile) {
      setExecutorDraft((currentDraft) => {
        // Only update if draft matches the old config (not dirty)
        if (!currentDraft || isEqual(currentDraft, config.executor_profile)) {
          return cloneDeep(config.executor_profile);
        }
        return currentDraft;
      });
    }
  }, [config?.executor_profile]);

  // Update executor draft
  const updateExecutorDraft = (newProfile: ExecutorProfileId) => {
    setExecutorDraft(newProfile);
  };

  // Save executor profile
  const handleSaveExecutorProfile = async () => {
    if (!executorDraft || !config) return;

    setExecutorSaving(true);
    setExecutorError(null);

    try {
      await updateAndSaveConfig({ executor_profile: executorDraft });
      Toast.success(t('settings.general.save.success'));
      reloadSystem();
    } catch (err) {
      const message = t('settings.general.save.error');
      setExecutorError(message);
      Toast.error(message);
      console.error('Error saving executor profile:', err);
    } finally {
      setExecutorSaving(false);
    }
  };

  // Sync raw profiles with parsed profiles
  const syncRawProfiles = (profiles: unknown) => {
    setLocalProfilesContent(JSON.stringify(profiles, null, 2));
  };

  // Mark profiles as dirty
  const markDirty = (nextProfiles: unknown) => {
    setLocalParsedProfiles(nextProfiles as ExecutorConfigs);
    syncRawProfiles(nextProfiles);
    setIsDirty(true);
  };

  // Open create dialog
  const openCreateDialog = async () => {
    try {
      const result = await CreateConfigurationDialog.show({
        executorType: selectedExecutorType,
        existingConfigs: Object.keys(
          localParsedProfiles?.executors?.[selectedExecutorType] || {}
        ),
      });

      if (result.action === 'created' && result.configName) {
        createConfiguration(
          selectedExecutorType,
          result.configName,
          result.cloneFrom
        );
      }
    } catch (error) {
      // User cancelled - do nothing
    }
  };

  // Create new configuration
  const createConfiguration = (
    executorType: string,
    configName: string,
    baseConfig?: string | null
  ) => {
    if (!localParsedProfiles || !localParsedProfiles.executors) return;

    const executorsMap =
      localParsedProfiles.executors as unknown as ExecutorsMap;
    const base =
      baseConfig && executorsMap[executorType]?.[baseConfig]?.[executorType]
        ? executorsMap[executorType][baseConfig][executorType]
        : {};

    const updatedProfiles = {
      ...localParsedProfiles,
      executors: {
        ...localParsedProfiles.executors,
        [executorType]: {
          ...executorsMap[executorType],
          [configName]: {
            [executorType]: base,
          },
        },
      },
    };

    markDirty(updatedProfiles);
    setSelectedConfiguration(configName);
  };

  // Open delete dialog
  const openDeleteDialog = async (configName: string) => {
    try {
      const result = await DeleteConfigurationDialog.show({
        configName,
        executorType: selectedExecutorType,
      });

      if (result === 'deleted') {
        await handleDeleteConfiguration(configName);
      }
    } catch (error) {
      // User cancelled - do nothing
    }
  };

  // Handle delete configuration
  const handleDeleteConfiguration = async (configToDelete: string) => {
    if (!localParsedProfiles) {
      return;
    }

    // Clear any previous errors
    setSaveError(null);

    try {
      // Validate that the configuration exists
      if (
        !localParsedProfiles.executors[selectedExecutorType]?.[configToDelete]
      ) {
        return;
      }

      // Check if this is the last configuration
      const currentConfigs = Object.keys(
        localParsedProfiles.executors[selectedExecutorType] || {}
      );
      if (currentConfigs.length <= 1) {
        return;
      }

      // Remove the configuration from the executor
      const remainingConfigs = {
        ...localParsedProfiles.executors[selectedExecutorType],
      };
      delete remainingConfigs[configToDelete];

      const updatedProfiles = {
        ...localParsedProfiles,
        executors: {
          ...localParsedProfiles.executors,
          [selectedExecutorType]: remainingConfigs,
        },
      };

      const executorsMap = updatedProfiles.executors as unknown as ExecutorsMap;
      // If no configurations left, create a blank DEFAULT (should not happen due to check above)
      if (Object.keys(remainingConfigs).length === 0) {
        executorsMap[selectedExecutorType] = {
          DEFAULT: { [selectedExecutorType]: {} },
        };
      }

      try {
        // Save using hook
        await saveProfiles(JSON.stringify(updatedProfiles, null, 2));

        // Update local state and reset dirty flag
        setLocalParsedProfiles(updatedProfiles);
        setLocalProfilesContent(JSON.stringify(updatedProfiles, null, 2));
        setIsDirty(false);

        // Select the next available configuration
        const nextConfigs = Object.keys(
          executorsMap[selectedExecutorType] || {}
        );
        const nextSelected = nextConfigs[0] || 'DEFAULT';
        setSelectedConfiguration(nextSelected);

        Toast.success(t('settings.agents.save.success'));

        // Refresh global system so deleted configs are removed elsewhere
        reloadSystem();
      } catch (saveError: unknown) {
        console.error('Failed to save deletion to backend:', saveError);
        setSaveError(t('settings.agents.errors.deleteFailed'));
      }
    } catch (error) {
      console.error('Error deleting configuration:', error);
    }
  };

  const handleProfilesChange = (value: string) => {
    setLocalProfilesContent(value);
    setIsDirty(true);

    // Validate JSON on change
    if (value.trim()) {
      try {
        const parsed = JSON.parse(value);
        setLocalParsedProfiles(parsed);
      } catch (err) {
        // Invalid JSON, keep local content but clear parsed
        setLocalParsedProfiles(null);
      }
    }
  };

  const handleSaveProfiles = async () => {
    // Clear any previous errors
    setSaveError(null);

    try {
      const contentToSave =
        useFormEditor && localParsedProfiles
          ? JSON.stringify(localParsedProfiles, null, 2)
          : localProfilesContent;

      await saveProfiles(contentToSave);
      setIsDirty(false);
      Toast.success(t('settings.agents.save.success'));

      // Update the local content if using form editor
      if (useFormEditor && localParsedProfiles) {
        setLocalProfilesContent(contentToSave);
      }

      // Refresh global system so new profiles are available elsewhere
      reloadSystem();
    } catch (err: unknown) {
      console.error('Failed to save profiles:', err);
      setSaveError(t('settings.agents.errors.saveFailed'));
      Toast.error(t('settings.agents.errors.saveFailed'));
    }
  };

  const handleExecutorConfigChange = (
    executorType: string,
    configuration: string,
    formData: unknown
  ) => {
    if (!localParsedProfiles || !localParsedProfiles.executors) return;

    const executorsMap =
      localParsedProfiles.executors as unknown as ExecutorsMap;
    // Update the parsed profiles with the new config
    const updatedProfiles = {
      ...localParsedProfiles,
      executors: {
        ...localParsedProfiles.executors,
        [executorType]: {
          ...executorsMap[executorType],
          [configuration]: {
            [executorType]: formData,
          },
        },
      },
    };

    markDirty(updatedProfiles);
  };

  const handleExecutorConfigSave = async (formData: unknown) => {
    if (!localParsedProfiles || !localParsedProfiles.executors) return;

    // Clear any previous errors
    setSaveError(null);

    // Update the parsed profiles with the saved config
    const updatedProfiles = {
      ...localParsedProfiles,
      executors: {
        ...localParsedProfiles.executors,
        [selectedExecutorType]: {
          ...localParsedProfiles.executors[selectedExecutorType],
          [selectedConfiguration]: {
            [selectedExecutorType]: formData,
          },
        },
      },
    };

    // Update state
    setLocalParsedProfiles(updatedProfiles);

    // Save the updated profiles directly
    try {
      const contentToSave = JSON.stringify(updatedProfiles, null, 2);

      await saveProfiles(contentToSave);
      setIsDirty(false);
      Toast.success(t('settings.agents.save.success'));

      // Update the local content as well
      setLocalProfilesContent(contentToSave);

      // Refresh global system so new profiles are available elsewhere
      reloadSystem();
    } catch (err: unknown) {
      console.error('Failed to save profiles:', err);
      setSaveError(t('settings.agents.errors.saveConfigFailed'));
      Toast.error(t('settings.agents.errors.saveConfigFailed'));
    }
  };

  if (profilesLoading) {
    return (
      <div className="py-8 flex items-center gap-2">
        <Spin />
        <Typography.Text type="tertiary">
          {t('settings.agents.loading')}
        </Typography.Text>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!!profilesError && (
        <Banner
          type="danger"
          fullMode={false}
          description={
            profilesError instanceof Error
              ? profilesError.message
              : String(profilesError)
          }
        />
      )}

      {saveError && (
        <Banner type="danger" fullMode={false} description={saveError} />
      )}

      {executorError && (
        <Banner type="danger" fullMode={false} description={executorError} />
      )}

      <Card
        title={t('settings.general.taskExecution.title')}
        headerExtraContent={
          <Typography.Text type="tertiary">
            {t('settings.general.taskExecution.description')}
          </Typography.Text>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Typography.Text strong>
              {t('settings.general.taskExecution.executor.label')}
            </Typography.Text>
            <div className="grid grid-cols-2 gap-2">
              <Select
                value={executorDraft?.executor ?? ''}
                placeholder={t('settings.general.taskExecution.executor.placeholder')}
                optionList={Object.keys(profiles || {})
                  .sort((a, b) => a.localeCompare(b))
                  .map((profileKey) => ({
                    value: profileKey,
                    label: profileKey,
                  }))}
                onChange={(value) => {
                  const executorKey = String(value);
                  const variants = profiles?.[executorKey];
                  const keepCurrentVariant =
                    variants &&
                    executorDraft?.variant &&
                    variants[executorDraft.variant];

                  const newProfile: ExecutorProfileId = {
                    executor: executorKey as BaseCodingAgent,
                    variant: keepCurrentVariant ? executorDraft!.variant : null,
                  };
                  updateExecutorDraft(newProfile);
                }}
                disabled={!profiles}
              />

              {/* Show variant selector if selected profile has variants */}
              {(() => {
                const currentProfileVariant = executorDraft;
                const selectedProfile =
                  profiles?.[currentProfileVariant?.executor || ''];
                const hasVariants =
                  selectedProfile && Object.keys(selectedProfile).length > 0;

                if (hasVariants) {
                  return (
                    <Select
                      value={currentProfileVariant?.variant ?? ''}
                      placeholder={t('settings.general.taskExecution.defaultLabel')}
                      optionList={Object.keys(selectedProfile).map((variantLabel) => ({
                        value: variantLabel,
                        label: variantLabel,
                      }))}
                      onChange={(value) => {
                        const newProfile: ExecutorProfileId = {
                          executor: currentProfileVariant!.executor,
                          variant: String(value),
                        };
                        updateExecutorDraft(newProfile);
                      }}
                    />
                  );
                } else if (selectedProfile) {
                  // Show disabled button when profile exists but has no variants
                  return (
                    <Select
                      disabled
                      placeholder={t('settings.general.taskExecution.defaultLabel')}
                    />
                  );
                }
                return null;
              })()}
            </div>
            <AgentAvailabilityIndicator availability={agentAvailability} />
            <Typography.Text type="tertiary">
              {t('settings.general.taskExecution.executor.helper')}
            </Typography.Text>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleSaveExecutorProfile}
              disabled={!executorDirty || executorSaving}
              loading={executorSaving}
              type="primary"
            >
              {t('common:buttons.save')}
            </Button>
          </div>
        </div>
      </Card>

      <Card
        title={t('settings.agents.title')}
        headerExtraContent={
          <Typography.Text type="tertiary">
            {t('settings.agents.description')}
          </Typography.Text>
        }
      >
        <div className="space-y-4">
          {/* Editor type toggle */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="use-form-editor"
              checked={!useFormEditor}
              onChange={(e) => setUseFormEditor(!e.target.checked)}
              disabled={profilesLoading || !localParsedProfiles}
            />
            <Typography.Text>{t('settings.agents.editor.formLabel')}</Typography.Text>
          </div>

          {useFormEditor &&
          localParsedProfiles &&
          localParsedProfiles.executors ? (
            // Form-based editor
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Typography.Text strong>
                    {t('settings.agents.editor.agentLabel')}
                  </Typography.Text>
                  <Select
                    value={selectedExecutorType}
                    placeholder={t('settings.agents.editor.agentPlaceholder')}
                    optionList={Object.keys(localParsedProfiles.executors).map((type) => ({
                      value: type,
                      label: type,
                    }))}
                    onChange={(value) => {
                      setSelectedExecutorType(String(value) as BaseCodingAgent);
                      // Reset configuration selection when executor type changes
                      setSelectedConfiguration('DEFAULT');
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Typography.Text strong>
                    {t('settings.agents.editor.configLabel')}
                  </Typography.Text>
                  <div className="flex gap-2">
                    <Select
                      value={selectedConfiguration}
                      placeholder={t('settings.agents.editor.configPlaceholder')}
                      optionList={[
                        ...Object.keys(
                          localParsedProfiles.executors[selectedExecutorType] || {}
                        ).map((configuration) => ({
                          value: configuration,
                          label: configuration,
                        })),
                        {
                          value: '__create__',
                          label: t('settings.agents.editor.createNew'),
                        },
                      ]}
                      onChange={(value) => {
                        const v = String(value);
                        if (v === '__create__') {
                          openCreateDialog();
                        } else {
                          setSelectedConfiguration(v);
                        }
                      }}
                      disabled={
                        !localParsedProfiles.executors[selectedExecutorType]
                      }
                    />
                    <Button
                      type="danger"
                      onClick={() => openDeleteDialog(selectedConfiguration)}
                      disabled={
                        profilesSaving ||
                        !localParsedProfiles.executors[selectedExecutorType] ||
                        Object.keys(
                          localParsedProfiles.executors[selectedExecutorType] ||
                            {}
                        ).length <= 1
                      }
                      title={
                        Object.keys(
                          localParsedProfiles.executors[selectedExecutorType] ||
                            {}
                        ).length <= 1
                          ? t('settings.agents.editor.deleteTitle')
                          : t('settings.agents.editor.deleteButton', {
                              name: selectedConfiguration,
                            })
                      }
                    >
                      {t('settings.agents.editor.deleteText')}
                    </Button>
                  </div>
                </div>
              </div>

              {(() => {
                const executorsMap =
                  localParsedProfiles.executors as unknown as ExecutorsMap;
                return (
                  !!executorsMap[selectedExecutorType]?.[
                    selectedConfiguration
                  ]?.[selectedExecutorType] && (
                    <ExecutorConfigForm
                      key={`${selectedExecutorType}-${selectedConfiguration}`}
                      executor={selectedExecutorType}
                      value={
                        (executorsMap[selectedExecutorType][
                          selectedConfiguration
                        ][selectedExecutorType] as Record<string, unknown>) ||
                        {}
                      }
                      onChange={(formData) =>
                        handleExecutorConfigChange(
                          selectedExecutorType,
                          selectedConfiguration,
                          formData
                        )
                      }
                      onSave={handleExecutorConfigSave}
                      disabled={profilesSaving}
                      isSaving={profilesSaving}
                      isDirty={isDirty}
                    />
                  )
                );
              })()}
            </div>
          ) : (
            // Raw JSON editor
            <div className="space-y-4">
              <div className="space-y-2">
                <Typography.Text strong>
                  {t('settings.agents.editor.jsonLabel')}
                </Typography.Text>
                <JSONEditor
                  id="profiles-editor"
                  placeholder={t('settings.agents.editor.jsonPlaceholder')}
                  value={
                    profilesLoading
                      ? t('settings.agents.editor.jsonLoading')
                      : localProfilesContent
                  }
                  onChange={handleProfilesChange}
                  disabled={profilesLoading}
                  minHeight={300}
                />
              </div>

              {!profilesError && profilesPath && (
                <div className="space-y-2">
                  <Typography.Text type="tertiary">
                    <Typography.Text strong>
                      {t('settings.agents.editor.pathLabel')}
                    </Typography.Text>{' '}
                    <Typography.Text code type="tertiary">
                      {profilesPath}
                    </Typography.Text>
                  </Typography.Text>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {!useFormEditor && (
        <div className="sticky bottom-0 z-10">
          <div className="flex justify-end">
            <Button
              onClick={handleSaveProfiles}
              disabled={!isDirty || profilesSaving || !!profilesError}
              loading={profilesSaving}
              type="primary"
            >
              {t('settings.agents.save.button')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
