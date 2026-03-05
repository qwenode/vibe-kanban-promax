import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Banner, Button, Card, Input, Modal, Spin, Typography } from '@douyinfe/semi-ui';
import {
  ArrowLeft,
  Folder,
  FolderGit,
  FolderPlus,
  Search,
} from 'lucide-react';
import { fileSystemApi, repoApi } from '@/lib/api';
import { DirectoryEntry, Repo } from 'shared/types';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { defineModal } from '@/lib/modals';
import { FolderPickerDialog } from './FolderPickerDialog';

export interface RepoPickerDialogProps {
  value?: string;
  title?: string;
  description?: string;
}

type Stage = 'options' | 'existing' | 'new';

const RepoPickerDialogImpl = NiceModal.create<RepoPickerDialogProps>(
  ({
    title = 'Select Repository',
    description = 'Choose or create a git repository',
  }) => {
    const { t } = useTranslation('projects');
    const modal = useModal();
    const [stage, setStage] = useState<Stage>('options');
    const [error, setError] = useState('');
    const [isWorking, setIsWorking] = useState(false);

    // Stage: existing
    const [allRepos, setAllRepos] = useState<DirectoryEntry[]>([]);
    const [reposLoading, setReposLoading] = useState(false);
    const [showMoreRepos, setShowMoreRepos] = useState(false);
    const [loadingDuration, setLoadingDuration] = useState(0);
    const [hasSearched, setHasSearched] = useState(false);

    // Stage: new
    const [repoName, setRepoName] = useState('');
    const [parentPath, setParentPath] = useState('');

    useEffect(() => {
      if (modal.visible) {
        setStage('options');
        setError('');
        setAllRepos([]);
        setShowMoreRepos(false);
        setRepoName('');
        setParentPath('');
        setLoadingDuration(0);
        setHasSearched(false);
      }
    }, [modal.visible]);

    const loadRecentRepos = useCallback(async () => {
      setReposLoading(true);
      setError('');
      setLoadingDuration(0);
      try {
        const repos = await fileSystemApi.listGitRepos();
        setAllRepos(repos);
      } catch (err) {
        setError('Failed to load repositories');
        console.error('Failed to load repos:', err);
      } finally {
        setReposLoading(false);
        setHasSearched(true);
      }
    }, []);

    useEffect(() => {
      if (
        stage === 'existing' &&
        allRepos.length === 0 &&
        !reposLoading &&
        !hasSearched
      ) {
        loadRecentRepos();
      }
    }, [stage, allRepos.length, reposLoading, hasSearched, loadRecentRepos]);

    // Track loading duration to show timeout message
    useEffect(() => {
      if (!reposLoading) {
        return;
      }

      const interval = setInterval(() => {
        setLoadingDuration((prev) => prev + 1);
      }, 1000);

      return () => clearInterval(interval);
    }, [reposLoading]);

    const registerAndReturn = async (path: string) => {
      setIsWorking(true);
      setError('');
      try {
        const repo = await repoApi.register({ path });
        modal.resolve(repo);
        modal.hide();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to register repository'
        );
      } finally {
        setIsWorking(false);
      }
    };

    const handleSelectRepo = (repo: DirectoryEntry) => {
      registerAndReturn(repo.path);
    };

    const handleBrowseForRepo = async () => {
      setError('');
      const selectedPath = await FolderPickerDialog.show({
        title: 'Select Git Repository',
        description: 'Choose an existing git repository',
      });
      if (selectedPath) {
        registerAndReturn(selectedPath);
      }
    };

    const handleCreateRepo = async () => {
      if (!repoName.trim()) {
        setError('Repository name is required');
        return;
      }

      setIsWorking(true);
      setError('');
      try {
        const repo = await repoApi.init({
          parent_path: parentPath.trim() || '.',
          folder_name: repoName.trim(),
        });
        modal.resolve(repo);
        modal.hide();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to create repository'
        );
      } finally {
        setIsWorking(false);
      }
    };

    const handleCancel = () => {
      modal.resolve(null);
      modal.hide();
    };

    const goBack = () => {
      setStage('options');
      setError('');
    };

    return (
      <div className="fixed inset-0 z-[10000] pointer-events-none [&>*]:pointer-events-auto">
        <Modal
          visible={modal.visible}
          onCancel={() => {
            if (!isWorking) handleCancel();
          }}
          footer={null}
          width={500}
        >
          <div className="space-y-1 pb-2">
            <Typography.Title heading={5}>{title}</Typography.Title>
            <Typography.Text type="tertiary">{description}</Typography.Text>
          </div>

            <div className="space-y-4">
              {/* Stage: Options */}
              {stage === 'options' && (
                <>
                  <Card
                    bordered
                    shadows="hover"
                    title={
                      <div className="flex items-center gap-2">
                        <FolderGit size={18} />
                        <Typography.Text strong>From Git Repository</Typography.Text>
                      </div>
                    }
                    headerExtraContent={
                      <Button theme="borderless" onClick={() => setStage('existing')}>
                        {t('repoSearch.choose', { defaultValue: 'Choose' })}
                      </Button>
                    }
                  >
                    <Typography.Text type="tertiary">
                      Select an existing repository from your system
                    </Typography.Text>
                  </Card>

                  <Card
                    bordered
                    shadows="hover"
                    title={
                      <div className="flex items-center gap-2">
                        <FolderPlus size={18} />
                        <Typography.Text strong>
                          Create New Repository
                        </Typography.Text>
                      </div>
                    }
                    headerExtraContent={
                      <Button theme="borderless" onClick={() => setStage('new')}>
                        {t('repoSearch.create', { defaultValue: 'Create' })}
                      </Button>
                    }
                  >
                    <Typography.Text type="tertiary">
                      Initialize a new git repository
                    </Typography.Text>
                  </Card>
                </>
              )}

              {/* Stage: Existing */}
              {stage === 'existing' && (
                <>
                  <Button
                    theme="borderless"
                    icon={<ArrowLeft size={14} />}
                    onClick={goBack}
                    disabled={isWorking}
                  >
                    Back to options
                  </Button>

                  {reposLoading && (
                    <Card bordered>
                      <div className="flex items-center gap-3">
                        <Spin />
                        <Typography.Text type="tertiary">
                          {loadingDuration < 2
                            ? t('repoSearch.searching')
                            : t('repoSearch.stillSearching', {
                                seconds: loadingDuration,
                              })}
                        </Typography.Text>
                      </div>
                      {loadingDuration >= 3 && (
                        <Typography.Text type="tertiary">
                          {t('repoSearch.takingLonger')}
                        </Typography.Text>
                      )}
                    </Card>
                  )}

                  {!reposLoading && allRepos.length > 0 && (
                    <div className="space-y-2">
                      {allRepos
                        .slice(0, showMoreRepos ? allRepos.length : 3)
                        .map((repo) => (
                          <Button
                            key={repo.path}
                            onClick={() => !isWorking && handleSelectRepo(repo)}
                            theme="borderless"
                            className="w-full"
                            noHorizontalPadding
                            disabled={isWorking}
                          >
                            <Card
                              bordered
                              shadows="hover"
                              title={
                                <div className="flex items-center gap-2 min-w-0">
                                  <FolderGit size={18} />
                                  <Typography.Text strong ellipsis>
                                    {repo.name}
                                  </Typography.Text>
                                </div>
                              }
                            >
                              <Typography.Text type="tertiary" ellipsis>
                                {repo.path}
                              </Typography.Text>
                            </Card>
                          </Button>
                        ))}

                      {!showMoreRepos && allRepos.length > 3 && (
                        <Button
                          theme="borderless"
                          onClick={() => setShowMoreRepos(true)}
                        >
                          Show {allRepos.length - 3} more repositories
                        </Button>
                      )}
                      {showMoreRepos && allRepos.length > 3 && (
                        <Button
                          theme="borderless"
                          onClick={() => setShowMoreRepos(false)}
                        >
                          Show less
                        </Button>
                      )}
                    </div>
                  )}

                  {/* No repos found state */}
                  {!reposLoading &&
                    hasSearched &&
                    allRepos.length === 0 &&
                    !error && (
                      <Card bordered>
                        <div className="flex items-start gap-3">
                          <Folder size={18} />
                          <div className="min-w-0">
                            <Typography.Text type="tertiary">
                              {t('repoSearch.noReposFound')}
                            </Typography.Text>
                            <Typography.Text type="tertiary">
                              {t('repoSearch.browseHint')}
                            </Typography.Text>
                          </div>
                        </div>
                      </Card>
                    )}

                  <Card
                    bordered
                    shadows="hover"
                    title={
                      <div className="flex items-center gap-2">
                        <Search size={18} />
                        <Typography.Text strong>Browse for repository</Typography.Text>
                      </div>
                    }
                    headerExtraContent={
                      <Button
                        theme="borderless"
                        onClick={() => !isWorking && handleBrowseForRepo()}
                      >
                        Browse
                      </Button>
                    }
                  >
                    <Typography.Text type="tertiary">
                      Browse and select any repository on your system
                    </Typography.Text>
                  </Card>
                </>
              )}

              {/* Stage: New */}
              {stage === 'new' && (
                <>
                  <Button
                    theme="borderless"
                    icon={<ArrowLeft size={14} />}
                    onClick={goBack}
                    disabled={isWorking}
                  >
                    Back to options
                  </Button>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Typography.Text strong>Repository Name *</Typography.Text>
                      <Input
                        value={repoName}
                        onChange={(value) => setRepoName(String(value))}
                        placeholder="my-project"
                        disabled={isWorking}
                      />
                      <Typography.Text type="tertiary">
                        This will be the folder name for your new repository
                      </Typography.Text>
                    </div>

                    <div className="space-y-2">
                      <Typography.Text strong>Parent Directory</Typography.Text>
                      <div className="flex space-x-2">
                        <Input
                          value={parentPath}
                          onChange={(value) => setParentPath(String(value))}
                          placeholder="Current Directory"
                          disabled={isWorking}
                        />
                        <Button
                          theme="outline"
                          htmlType="button"
                          disabled={isWorking}
                          icon={<Folder size={16} />}
                          onClick={async () => {
                            const selectedPath = await FolderPickerDialog.show({
                              title: 'Select Parent Directory',
                              description:
                                'Choose where to create the new repository',
                              value: parentPath,
                            });
                            if (selectedPath) {
                              setParentPath(selectedPath);
                            }
                          }}
                        />
                      </div>
                      <Typography.Text type="tertiary">
                        Leave empty to use your current working directory
                      </Typography.Text>
                    </div>

                    <Button
                      onClick={handleCreateRepo}
                      disabled={isWorking || !repoName.trim()}
                      loading={isWorking}
                      type="primary"
                      block
                    >
                      {isWorking ? 'Creating...' : 'Create Repository'}
                    </Button>
                  </div>
                </>
              )}

              {error && (
                <Banner
                  type="danger"
                  fullMode={false}
                  description={error}
                />
              )}

              {isWorking && stage === 'existing' && (
                <div className="flex items-center justify-center gap-2">
                  <Spin />
                  <Typography.Text type="tertiary">
                    Registering repository...
                  </Typography.Text>
                </div>
              )}
            </div>
        </Modal>
      </div>
    );
  }
);

export const RepoPickerDialog = defineModal<RepoPickerDialogProps, Repo | null>(
  RepoPickerDialogImpl
);
