import { useTranslation } from 'react-i18next';
import { ExternalLink, GitPullRequest } from 'lucide-react';
import { Banner, Modal, Spin, Typography } from '@douyinfe/semi-ui';
import GitOperations from '@/components/tasks/Toolbar/GitOperations';
import { useTaskAttemptWithSession } from '@/hooks/useTaskAttempt';
import { useBranchStatus, useAttemptExecution } from '@/hooks';
import { useAttemptRepo } from '@/hooks/useAttemptRepo';
import { ExecutionProcessesProvider } from '@/contexts/ExecutionProcessesContext';
import {
  GitOperationsProvider,
  useGitOperationsError,
} from '@/contexts/GitOperationsContext';
import type { Merge, TaskWithAttemptStatus } from 'shared/types';
import type { WorkspaceWithSession } from '@/types/attempt';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { defineModal } from '@/lib/modals';

export interface GitActionsDialogProps {
  attemptId: string;
  task?: TaskWithAttemptStatus;
}

interface GitActionsDialogContentProps {
  attempt: WorkspaceWithSession;
  task: TaskWithAttemptStatus;
}

function GitActionsDialogContent({
  attempt,
  task,
}: GitActionsDialogContentProps) {
  const { t } = useTranslation('tasks');
  const { data: branchStatus, error: branchStatusError } = useBranchStatus(
    attempt.id
  );
  const { isAttemptRunning } = useAttemptExecution(attempt.id);
  const { error: gitError } = useGitOperationsError();
  const { repos, selectedRepoId } = useAttemptRepo(attempt.id);

  const getSelectedRepoStatus = () => {
    const repoId = selectedRepoId ?? repos[0]?.id;
    return branchStatus?.find((r) => r.repo_id === repoId);
  };

  const mergedPR = getSelectedRepoStatus()?.merges?.find(
    (m: Merge) => m.type === 'pr' && m.pr_info?.status === 'merged'
  );

  return (
    <div className="space-y-4">
      {mergedPR && mergedPR.type === 'pr' && (
        <div className="flex items-center gap-2">
          <Typography.Text type="tertiary">
            {t('git.actions.prMerged', {
              number: mergedPR.pr_info.number || '',
            })}
          </Typography.Text>
          {mergedPR.pr_info.url && (
            <a
              href={mergedPR.pr_info.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              <GitPullRequest className="h-3.5 w-3.5" />
              {t('git.pr.number', {
                number: Number(mergedPR.pr_info.number),
              })}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      )}
      {gitError && (
        <Banner type="danger" fullMode={false} description={gitError} />
      )}
      <GitOperations
        selectedAttempt={attempt}
        task={task}
        branchStatus={branchStatus ?? null}
        branchStatusError={branchStatusError}
        isAttemptRunning={isAttemptRunning}
        selectedBranch={getSelectedRepoStatus()?.target_branch_name ?? null}
        layout="vertical"
      />
    </div>
  );
}

const GitActionsDialogImpl = NiceModal.create<GitActionsDialogProps>(
  ({ attemptId, task }) => {
    const modal = useModal();
    const { t } = useTranslation('tasks');

    const { data: attempt } = useTaskAttemptWithSession(attemptId);

    const isLoading = !attempt || !task;

    return (
      <Modal
        visible={modal.visible}
        onCancel={() => modal.hide()}
        footer={null}
        width={672}
      >
        <Typography.Title heading={5}>{t('git.actions.title')}</Typography.Title>

        {isLoading ? (
          <div className="py-8 flex justify-center">
            <Spin />
          </div>
        ) : (
          <GitOperationsProvider attemptId={attempt.id}>
            <ExecutionProcessesProvider
              key={attempt.id}
              attemptId={attempt.id}
              sessionId={attempt.session?.id}
            >
              <GitActionsDialogContent attempt={attempt} task={task} />
            </ExecutionProcessesProvider>
          </GitOperationsProvider>
        )}
      </Modal>
    );
  }
);

export const GitActionsDialog = defineModal<GitActionsDialogProps, void>(
  GitActionsDialogImpl
);
