import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { isEqual } from 'lodash';
import {
  Banner,
  Button,
  Card,
  Input,
  Select,
  Spin,
  Table,
  Toast,
  Typography,
} from '@douyinfe/semi-ui';
import { Plus, Trash2 } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useProjectMutations } from '@/hooks/useProjectMutations';
import { RepoPickerDialog } from '@/components/dialogs/shared/RepoPickerDialog';
import { projectsApi } from '@/lib/api';
import { repoBranchKeys } from '@/hooks/useRepoBranches';
import type { Project, Repo, UpdateProject } from 'shared/types';
import { Modal } from '@douyinfe/semi-ui';

interface ProjectFormState {
  name: string;
}

function projectToFormState(project: Project): ProjectFormState {
  return {
    name: project.name,
  };
}

export function ProjectSettings() {
  const navigate = useNavigate();
  const projectIdParam = useRouterState({
    select: (s) => ((s.location.search as { projectId?: string } | undefined)?.projectId ?? ''),
  });
  const { t } = useTranslation(['settings', 'common']);
  const queryClient = useQueryClient();

  // Fetch all projects
  const {
    projects,
    isLoading: projectsLoading,
    error: projectsError,
  } = useProjects();

  // Selected project state
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    projectIdParam || ''
  );
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Form state
  const [draft, setDraft] = useState<ProjectFormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Repositories state
  const [repositories, setRepositories] = useState<Repo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [repoError, setRepoError] = useState<string | null>(null);
  const [addingRepo, setAddingRepo] = useState(false);
  const [deletingRepoId, setDeletingRepoId] = useState<string | null>(null);

  // Check for unsaved changes (project name)
  const hasUnsavedChanges = useMemo(() => {
    if (!draft || !selectedProject) return false;
    return !isEqual(draft, projectToFormState(selectedProject));
  }, [draft, selectedProject]);

  const setProjectIdSearchParam = useCallback(
    (id: string) => {
      navigate({
        search: ((prev: unknown) => {
          const next = { ...(prev as Record<string, unknown>) } as Record<
            string,
            unknown
          >;
          if (id) {
            next.projectId = id;
          } else {
            delete next.projectId;
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
        content: t('settings.projects.save.confirmSwitch'),
        hasCancel: true,
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });
  }, [hasUnsavedChanges, t]);

  // Handle project selection from dropdown
  const handleProjectSelect = useCallback(
    async (id: string) => {
      // No-op if same project
      if (id === selectedProjectId) return;

      // Confirm if there are unsaved changes
      const confirmed = await confirmSwitchIfDirty();
      if (!confirmed) return;

      // Clear local state before switching
      if (hasUnsavedChanges) {
        setDraft(null);
        setSelectedProject(null);
        setError(null);
      }

      // Update state and URL
      setSelectedProjectId(id);
      if (id) {
        setProjectIdSearchParam(id);
      } else {
        setProjectIdSearchParam('');
      }
    },
    [
      confirmSwitchIfDirty,
      hasUnsavedChanges,
      selectedProjectId,
      setProjectIdSearchParam,
    ]
  );

  // Sync selectedProjectId when URL changes (with unsaved changes prompt)
  useEffect(() => {
    if (projectIdParam === selectedProjectId) return;

    let cancelled = false;
    (async () => {
      if (cancelled) return;

      const confirmed = await confirmSwitchIfDirty();
      if (!confirmed) {
        // Revert URL to previous value
        if (selectedProjectId) {
          setProjectIdSearchParam(selectedProjectId);
        } else {
          setProjectIdSearchParam('');
        }
        return;
      }

      if (hasUnsavedChanges) {
        setDraft(null);
        setSelectedProject(null);
        setError(null);
      }

      setSelectedProjectId(projectIdParam);
    })();

    return () => {
      cancelled = true;
    };
  }, [
    projectIdParam,
    selectedProjectId,
    confirmSwitchIfDirty,
    setProjectIdSearchParam,
    hasUnsavedChanges,
  ]);

  // Populate draft from server data
  useEffect(() => {
    if (!projects) return;

    const nextProject = selectedProjectId
      ? projects.find((p) => p.id === selectedProjectId)
      : null;

    setSelectedProject((prev) =>
      prev?.id === nextProject?.id ? prev : (nextProject ?? null)
    );

    if (!nextProject) {
      if (!hasUnsavedChanges) setDraft(null);
      return;
    }

    if (hasUnsavedChanges) return;

    setDraft(projectToFormState(nextProject));
  }, [projects, selectedProjectId, hasUnsavedChanges]);

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

  // Fetch repositories when project changes
  useEffect(() => {
    if (!selectedProjectId) {
      setRepositories([]);
      return;
    }

    setLoadingRepos(true);
    setRepoError(null);
    projectsApi
      .getRepositories(selectedProjectId)
      .then(setRepositories)
      .catch((err) => {
        setRepoError(
          err instanceof Error ? err.message : 'Failed to load repositories'
        );
        setRepositories([]);
      })
      .finally(() => setLoadingRepos(false));
  }, [selectedProjectId]);

  const handleAddRepository = async () => {
    if (!selectedProjectId) return;

    const repo = await RepoPickerDialog.show({
      title: 'Select Git Repository',
      description: 'Choose a git repository to add to this project',
    });

    if (!repo) return;

    if (repositories.some((r) => r.id === repo.id)) {
      return;
    }

    setAddingRepo(true);
    setRepoError(null);
    try {
      const newRepo = await projectsApi.addRepository(selectedProjectId, {
        display_name: repo.display_name,
        git_repo_path: repo.path,
      });
      setRepositories((prev) => [...prev, newRepo]);
      Toast.success(t('settings.projects.repos.added', { defaultValue: 'Repository added' }));
      queryClient.invalidateQueries({
        queryKey: ['projectRepositories', selectedProjectId],
      });
      queryClient.invalidateQueries({
        queryKey: ['repos'],
      });
      queryClient.invalidateQueries({
        queryKey: repoBranchKeys.byRepo(newRepo.id),
      });
    } catch (err) {
      setRepoError(
        err instanceof Error ? err.message : 'Failed to add repository'
      );
      Toast.error(
        err instanceof Error ? err.message : 'Failed to add repository'
      );
    } finally {
      setAddingRepo(false);
    }
  };

  const handleDeleteRepository = async (repoId: string) => {
    if (!selectedProjectId) return;

    setDeletingRepoId(repoId);
    setRepoError(null);
    try {
      await projectsApi.deleteRepository(selectedProjectId, repoId);
      setRepositories((prev) => prev.filter((r) => r.id !== repoId));
      Toast.success(
        t('settings.projects.repos.deleted', { defaultValue: 'Repository removed' })
      );
      queryClient.invalidateQueries({
        queryKey: ['projectRepositories', selectedProjectId],
      });
      queryClient.invalidateQueries({
        queryKey: ['repos'],
      });
      queryClient.invalidateQueries({
        queryKey: repoBranchKeys.byRepo(repoId),
      });
    } catch (err) {
      setRepoError(
        err instanceof Error ? err.message : 'Failed to delete repository'
      );
      Toast.error(
        err instanceof Error ? err.message : 'Failed to delete repository'
      );
    } finally {
      setDeletingRepoId(null);
    }
  };

  const { updateProject } = useProjectMutations({
    onUpdateSuccess: (updatedProject: Project) => {
      // Update local state with fresh data from server
      setSelectedProject(updatedProject);
      setDraft(projectToFormState(updatedProject));
      Toast.success(t('settings.projects.save.success'));
      setSaving(false);
    },
    onUpdateError: (err) => {
      setError(
        err instanceof Error ? err.message : 'Failed to save project settings'
      );
      setSaving(false);
      Toast.error(
        err instanceof Error ? err.message : 'Failed to save project settings'
      );
    },
  });

  const handleSave = async () => {
    if (!draft || !selectedProject) return;

    setSaving(true);
    setError(null);

    try {
      const updateData: UpdateProject = {
        name: draft.name.trim(),
      };

      updateProject.mutate({
        projectId: selectedProject.id,
        data: updateData,
      });
    } catch (err) {
      setError(t('settings.projects.save.error'));
      console.error('Error saving project settings:', err);
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (!selectedProject) return;
    setDraft(projectToFormState(selectedProject));
  };

  const updateDraft = (updates: Partial<ProjectFormState>) => {
    setDraft((prev) => {
      if (!prev) return prev;
      return { ...prev, ...updates };
    });
  };

  if (projectsLoading) {
    return (
      <div className="py-8 flex items-center gap-2">
        <Spin />
        <Typography.Text type="tertiary">
          {t('settings.projects.loading')}
        </Typography.Text>
      </div>
    );
  }

  if (projectsError) {
    return (
      <div className="py-8">
        <Banner
          type="danger"
          fullMode={false}
          description={
            projectsError instanceof Error
              ? projectsError.message
              : t('settings.projects.loadError')
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!!error && <Banner type="danger" fullMode={false} description={error} />}

      <Card
        title={t('settings.projects.title')}
        headerExtraContent={
          <Typography.Text type="tertiary">
            {t('settings.projects.description')}
          </Typography.Text>
        }
      >
        <div className="space-y-2">
          <Typography.Text strong>
            {t('settings.projects.selector.label')}
          </Typography.Text>
          <Select
            value={selectedProjectId}
            placeholder={t('settings.projects.selector.placeholder')}
            optionList={
              projects && projects.length > 0
                ? projects.map((p) => ({ value: p.id, label: p.name }))
                : [
                    {
                      value: 'no-projects',
                      label: t('settings.projects.selector.noProjects'),
                      disabled: true,
                    },
                  ]
            }
            onChange={(value) => handleProjectSelect(String(value))}
          />
          <Typography.Text type="tertiary">
            {t('settings.projects.selector.helper')}
          </Typography.Text>
        </div>
      </Card>

      {selectedProject && draft && (
        <>
          <Card
            title={t('settings.projects.general.title')}
            headerExtraContent={
              <Typography.Text type="tertiary">
                {t('settings.projects.general.description')}
              </Typography.Text>
            }
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Typography.Text strong>
                  {t('settings.projects.general.name.label')}
                </Typography.Text>
                <Input
                  value={draft.name}
                  placeholder={t('settings.projects.general.name.placeholder')}
                  onChange={(value) => updateDraft({ name: String(value) })}
                />
                <Typography.Text type="tertiary">
                  {t('settings.projects.general.name.helper')}
                </Typography.Text>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                {hasUnsavedChanges ? (
                  <Typography.Text type="tertiary">
                    {t('settings.projects.save.unsavedChanges')}
                  </Typography.Text>
                ) : (
                  <span />
                )}
                <div className="flex gap-2">
                  <Button
                    theme="outline"
                    onClick={handleDiscard}
                    disabled={saving || !hasUnsavedChanges}
                  >
                    {t('settings.projects.save.discard')}
                  </Button>
                  <Button
                    type="primary"
                    onClick={handleSave}
                    disabled={saving || !hasUnsavedChanges}
                    loading={saving}
                  >
                    {saving
                      ? t('settings.projects.save.saving')
                      : t('settings.projects.save.button')}
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Repositories Section */}
          <Card
            title={t('settings.projects.repos.title', { defaultValue: 'Repositories' })}
            headerExtraContent={
              <Typography.Text type="tertiary">
                {t('settings.projects.repos.description', {
                  defaultValue: 'Manage the git repositories in this project',
                })}
              </Typography.Text>
            }
          >
            <div className="space-y-4">
              {!!repoError && (
                <Banner type="danger" fullMode={false} description={repoError} />
              )}

              {loadingRepos ? (
                <div className="flex items-center gap-2 py-2">
                  <Spin />
                  <Typography.Text type="tertiary">
                    {t('settings.projects.repos.loading', {
                      defaultValue: 'Loading repositories...',
                    })}
                  </Typography.Text>
                </div>
              ) : (
                <>
                  <Table
                    size="middle"
                    rowKey="id"
                    dataSource={repositories}
                    columns={[
                      {
                        title: t('settings.projects.repos.columns.name', {
                          defaultValue: 'Name',
                        }),
                        dataIndex: 'display_name',
                        render: (text: unknown) => (
                          <Typography.Text strong>{String(text ?? '')}</Typography.Text>
                        ),
                      },
                      {
                        title: t('settings.projects.repos.columns.path', {
                          defaultValue: 'Path',
                        }),
                        dataIndex: 'path',
                        render: (text: unknown) => (
                          <Typography.Text type="tertiary">
                            {String(text ?? '')}
                          </Typography.Text>
                        ),
                      },
                      {
                        title: t('settings.projects.repos.columns.actions', {
                          defaultValue: 'Actions',
                        }),
                        dataIndex: 'id',
                        width: 90,
                        align: 'center',
                        render: (id: unknown) => (
                          <Button
                            theme="borderless"
                            type="danger"
                            icon={<Trash2 size={16} />}
                            loading={deletingRepoId === String(id)}
                            disabled={deletingRepoId != null && deletingRepoId !== String(id)}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRepository(String(id));
                            }}
                          />
                        ),
                      },
                    ]}
                    onRow={(record) => ({
                      onClick: () =>
                        record
                          ? navigate({
                              to: '/settings/repos' as never,
                              search: ({ repoId: record.id } as unknown) as never,
                            } as never)
                          : undefined,
                    })}
                    empty={
                      <Typography.Text type="tertiary">
                        {t('settings.projects.repos.empty', {
                          defaultValue: 'No repositories configured',
                        })}
                      </Typography.Text>
                    }
                  />

                  <Button
                    theme="outline"
                    icon={<Plus size={16} />}
                    onClick={handleAddRepository}
                    loading={addingRepo}
                  >
                    {t('settings.projects.repos.add', { defaultValue: 'Add Repository' })}
                  </Button>
                </>
              )}
            </div>
          </Card>

          {/* Sticky Save Button for Project Name */}
          {hasUnsavedChanges && (
            <div className="sticky bottom-0 z-10 py-4 backdrop-blur-sm bg-[var(--semi-color-bg-1)] border-t border-[var(--semi-color-border)]">
              <div className="flex items-center justify-between">
                <Typography.Text type="tertiary">
                  {t('settings.projects.save.unsavedChanges')}
                </Typography.Text>
                <div className="flex gap-2">
                  <Button
                    theme="outline"
                    onClick={handleDiscard}
                    disabled={saving}
                  >
                    {t('settings.projects.save.discard')}
                  </Button>
                  <Button
                    type="primary"
                    onClick={handleSave}
                    disabled={saving}
                    loading={saving}
                  >
                    {t('settings.projects.save.button')}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
