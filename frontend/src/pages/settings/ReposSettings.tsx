import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { isEqual } from 'lodash';
import { Banner, Button, Card, Select, Spin, Toast, Typography } from '@douyinfe/semi-ui';
import TextArea from '@douyinfe/semi-ui/lib/es/input/textarea';
import { Input } from '@douyinfe/semi-ui';
import Checkbox from '@douyinfe/semi-ui/lib/es/checkbox';
import { useScriptPlaceholders } from '@/hooks/useScriptPlaceholders';
import { MultiFileSearchTextarea } from '@/components/ui/multi-file-search-textarea';
import { repoApi } from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Repo, UpdateRepo } from 'shared/types';
import { Modal } from '@douyinfe/semi-ui';

interface RepoScriptsFormState {
  display_name: string;
  setup_script: string;
  parallel_setup_script: boolean;
  cleanup_script: string;
  copy_files: string;
  dev_server_script: string;
}

function repoToFormState(repo: Repo): RepoScriptsFormState {
  return {
    display_name: repo.display_name,
    setup_script: repo.setup_script ?? '',
    parallel_setup_script: repo.parallel_setup_script,
    cleanup_script: repo.cleanup_script ?? '',
    copy_files: repo.copy_files ?? '',
    dev_server_script: repo.dev_server_script ?? '',
  };
}

export function ReposSettings() {
  const navigate = useNavigate();
  const repoIdParam = useRouterState({
    select: (s) => ((s.location.search as { repoId?: string } | undefined)?.repoId ?? ''),
  });
  const { t } = useTranslation(['settings', 'common']);
  const queryClient = useQueryClient();

  // Fetch all repos
  const {
    data: repos,
    isLoading: reposLoading,
    error: reposError,
  } = useQuery({
    queryKey: ['repos'],
    queryFn: () => repoApi.list(),
  });

  // Selected repo state
  const [selectedRepoId, setSelectedRepoId] = useState<string>(repoIdParam);
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null);

  // Form state
  const [draft, setDraft] = useState<RepoScriptsFormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get OS-appropriate script placeholders
  const placeholders = useScriptPlaceholders();

  // Check for unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    if (!draft || !selectedRepo) return false;
    return !isEqual(draft, repoToFormState(selectedRepo));
  }, [draft, selectedRepo]);

  const setRepoIdSearchParam = useCallback(
    (id: string) => {
      navigate({
        search: ((prev: unknown) => {
          const next = { ...(prev as Record<string, unknown>) } as Record<
            string,
            unknown
          >;
          if (id) {
            next.repoId = id;
          } else {
            delete next.repoId;
          }
          return next;
        }) as never,
        replace: true,
      } as never);
    },
    [navigate]
  );

  const confirmSwitchIfDirty = useCallback(async () => {
    if (!hasUnsavedChanges) return true;
    return await new Promise<boolean>((resolve) => {
      Modal.confirm({
        title: t('common:labels.unsavedChanges', {
          defaultValue: 'Unsaved changes',
        }),
        content: t('settings.repos.save.confirmSwitch'),
        hasCancel: true,
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });
  }, [hasUnsavedChanges, t]);

  // Handle repo selection from dropdown
  const handleRepoSelect = useCallback(
    async (id: string) => {
      if (id === selectedRepoId) return;

      const confirmed = await confirmSwitchIfDirty();
      if (!confirmed) return;
      if (hasUnsavedChanges) {
        setDraft(null);
        setSelectedRepo(null);
        setError(null);
      }

      setSelectedRepoId(id);
      if (id) {
        setRepoIdSearchParam(id);
      } else {
        setRepoIdSearchParam('');
      }
    },
    [confirmSwitchIfDirty, hasUnsavedChanges, selectedRepoId, setRepoIdSearchParam]
  );

  // Sync selectedRepoId when URL changes
  useEffect(() => {
    if (repoIdParam === selectedRepoId) return;

    let cancelled = false;
    (async () => {
      if (cancelled) return;

      const confirmed = await confirmSwitchIfDirty();
      if (!confirmed) {
        if (selectedRepoId) {
          setRepoIdSearchParam(selectedRepoId);
        } else {
          setRepoIdSearchParam('');
        }
        return;
      }

      if (hasUnsavedChanges) {
        setDraft(null);
        setSelectedRepo(null);
        setError(null);
      }

      setSelectedRepoId(repoIdParam);
    })();

    return () => {
      cancelled = true;
    };
  }, [
    repoIdParam,
    selectedRepoId,
    confirmSwitchIfDirty,
    setRepoIdSearchParam,
    hasUnsavedChanges,
  ]);

  // Populate draft from server data
  useEffect(() => {
    if (!repos) return;

    const nextRepo = selectedRepoId
      ? repos.find((r) => r.id === selectedRepoId)
      : null;

    setSelectedRepo((prev) =>
      prev?.id === nextRepo?.id ? prev : (nextRepo ?? null)
    );

    if (!nextRepo) {
      if (!hasUnsavedChanges) setDraft(null);
      return;
    }

    if (hasUnsavedChanges) return;

    setDraft(repoToFormState(nextRepo));
  }, [repos, selectedRepoId, hasUnsavedChanges]);

  // Warn on tab close/navigation with unsaved changes
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

  const handleSave = async () => {
    if (!draft || !selectedRepo) return;

    setSaving(true);
    setError(null);

    try {
      const updateData: UpdateRepo = {
        display_name: draft.display_name.trim() || null,
        setup_script: draft.setup_script.trim() || null,
        cleanup_script: draft.cleanup_script.trim() || null,
        copy_files: draft.copy_files.trim() || null,
        parallel_setup_script: draft.parallel_setup_script,
        dev_server_script: draft.dev_server_script.trim() || null,
      };

      const updatedRepo = await repoApi.update(selectedRepo.id, updateData);
      setSelectedRepo(updatedRepo);
      setDraft(repoToFormState(updatedRepo));
      queryClient.setQueryData(['repos'], (old: Repo[] | undefined) =>
        old?.map((r) => (r.id === updatedRepo.id ? updatedRepo : r))
      );
      Toast.success(t('settings.repos.save.success'));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t('settings.repos.save.error');
      setError(message);
      Toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (!selectedRepo) return;
    setDraft(repoToFormState(selectedRepo));
  };

  const updateDraft = (updates: Partial<RepoScriptsFormState>) => {
    setDraft((prev) => {
      if (!prev) return prev;
      return { ...prev, ...updates };
    });
  };

  if (reposLoading) {
    return (
      <div className="py-8 flex items-center gap-2">
        <Spin />
        <Typography.Text type="tertiary">
          {t('settings.repos.loading')}
        </Typography.Text>
      </div>
    );
  }

  if (reposError) {
    return (
      <div className="py-8">
        <Banner
          type="danger"
          fullMode={false}
          description={
            reposError instanceof Error
              ? reposError.message
              : t('settings.repos.loadError')
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!!error && (
        <Banner type="danger" fullMode={false} description={error} />
      )}

      <Card
        title={t('settings.repos.title')}
        headerExtraContent={
          <Typography.Text type="tertiary">
            {t('settings.repos.description')}
          </Typography.Text>
        }
      >
        <div className="space-y-2">
          <Typography.Text strong>
            {t('settings.repos.selector.label')}
          </Typography.Text>
          <Select
            value={selectedRepoId}
            placeholder={t('settings.repos.selector.placeholder')}
            optionList={
              repos && repos.length > 0
                ? repos.map((r) => ({ value: r.id, label: r.display_name }))
                : [
                    {
                      value: 'no-repos',
                      label: t('settings.repos.selector.noRepos'),
                      disabled: true,
                    },
                  ]
            }
            onChange={(value) => handleRepoSelect(String(value))}
          />
          <Typography.Text type="tertiary">
            {t('settings.repos.selector.helper')}
          </Typography.Text>
        </div>
      </Card>

      {selectedRepo && draft && (
        <>
          <Card
            title={t('settings.repos.general.title')}
            headerExtraContent={
              <Typography.Text type="tertiary">
                {t('settings.repos.general.description')}
              </Typography.Text>
            }
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Typography.Text strong>
                  {t('settings.repos.general.displayName.label')}
                </Typography.Text>
                <Input
                  value={draft.display_name}
                  placeholder={t('settings.repos.general.displayName.placeholder')}
                  onChange={(value) => updateDraft({ display_name: String(value) })}
                />
                <Typography.Text type="tertiary">
                  {t('settings.repos.general.displayName.helper')}
                </Typography.Text>
              </div>

              <div className="space-y-2">
                <Typography.Text strong>
                  {t('settings.repos.general.path.label')}
                </Typography.Text>
                <Typography.Text code type="tertiary">
                  {selectedRepo.path}
                </Typography.Text>
              </div>
            </div>
          </Card>

          <Card
            title={t('settings.repos.scripts.title')}
            headerExtraContent={
              <Typography.Text type="tertiary">
                {t('settings.repos.scripts.description')}
              </Typography.Text>
            }
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Typography.Text strong>
                  {t('settings.repos.scripts.devServer.label')}
                </Typography.Text>
                <TextArea
                  value={draft.dev_server_script}
                  autosize={{ maxRows: 12 }}
                  placeholder={placeholders.dev}
                  onChange={(value) =>
                    updateDraft({ dev_server_script: String(value) })
                  }
                />
                <Typography.Text type="tertiary">
                  {t('settings.repos.scripts.devServer.helper')}
                </Typography.Text>
              </div>

              <div className="space-y-2">
                <Typography.Text strong>
                  {t('settings.repos.scripts.setup.label')}
                </Typography.Text>
                <TextArea
                  value={draft.setup_script}
                  autosize={{ maxRows: 12 }}
                  placeholder={placeholders.setup}
                  onChange={(value) =>
                    updateDraft({ setup_script: String(value) })
                  }
                />
                <Typography.Text type="tertiary">
                  {t('settings.repos.scripts.setup.helper')}
                </Typography.Text>

                <Checkbox
                  checked={draft.parallel_setup_script}
                  disabled={!draft.setup_script.trim()}
                  onChange={(e) =>
                    updateDraft({
                      parallel_setup_script: Boolean(e.target.checked),
                    })
                  }
                >
                  {t('settings.repos.scripts.setup.parallelLabel')}
                </Checkbox>
                <Typography.Text type="tertiary">
                  {t('settings.repos.scripts.setup.parallelHelper')}
                </Typography.Text>
              </div>

              <div className="space-y-2">
                <Typography.Text strong>
                  {t('settings.repos.scripts.cleanup.label')}
                </Typography.Text>
                <TextArea
                  value={draft.cleanup_script}
                  autosize={{ maxRows: 12 }}
                  placeholder={placeholders.cleanup}
                  onChange={(value) =>
                    updateDraft({ cleanup_script: String(value) })
                  }
                />
                <Typography.Text type="tertiary">
                  {t('settings.repos.scripts.cleanup.helper')}
                </Typography.Text>
              </div>

              <div className="space-y-2">
                <Typography.Text strong>
                  {t('settings.repos.scripts.copyFiles.label')}
                </Typography.Text>
                <MultiFileSearchTextarea
                  value={draft.copy_files}
                  onChange={(value) => updateDraft({ copy_files: value })}
                  placeholder={t('settings.repos.scripts.copyFiles.placeholder')}
                  maxRows={6}
                  repoId={selectedRepo.id}
                />
                <Typography.Text type="tertiary">
                  {t('settings.repos.scripts.copyFiles.helper')}
                </Typography.Text>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                {hasUnsavedChanges ? (
                  <Typography.Text type="tertiary">
                    {t('settings.repos.save.unsavedChanges')}
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
                    {t('settings.repos.save.discard')}
                  </Button>
                  <Button
                    type="primary"
                    onClick={handleSave}
                    disabled={!hasUnsavedChanges || saving}
                    loading={saving}
                  >
                    {t('settings.repos.save.button')}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
