import type { TaskWithAttemptStatus } from 'shared/types';
import type { WorkspaceWithSession } from '@/types/attempt';
import TaskAttemptPanel from '@/components/panels/TaskAttemptPanel';
import { Empty, Radio, Typography } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import { DiffsPanel } from '@/components/panels/DiffsPanel';
import { useBranchStatus } from '@/hooks/useBranchStatus';
import { useAttemptExecution } from '@/hooks/useAttemptExecution';
import GitOperations from '@/components/tasks/Toolbar/GitOperations';

type AttemptViewMode = 'diffs' | null;

interface TaskLogStreamPanelProps {
  selectedTask: TaskWithAttemptStatus | null;
  attempt: WorkspaceWithSession | undefined;
  mode: AttemptViewMode;
  onModeChange: (mode: AttemptViewMode) => void;
}

export function TaskLogStreamPanel({
  selectedTask,
  attempt,
  mode,
  onModeChange,
}: TaskLogStreamPanelProps) {
  const { t } = useTranslation('tasks');
  const { data: branchStatus, error: branchStatusError } = useBranchStatus(
    attempt?.id
  );
  const { isAttemptRunning } = useAttemptExecution(attempt?.id);

  if (!selectedTask) {
    return (
      <section className="h-full min-h-0 bg-background">
        <div className="flex h-full items-center justify-center text-center">
          <Empty
            title="未选择任务"
            description="从列表中选择一个任务查看详情"
          />
        </div>
      </section>
    );
  }

  return (
    <section className="h-full min-h-0 bg-background">
      <div className="flex h-12 items-center gap-2 border-b px-3">
        <Radio.Group
          type="button"
          buttonSize="middle"
          value={mode ?? 'logs'}
          onChange={(e) => {
            const v = e.target.value as 'logs' | 'diffs';
            onModeChange(v === 'diffs' ? 'diffs' : null);
          }}
          aria-label="Attempt view"
        >
          <Radio value="logs">
            {t('logs.label', { defaultValue: 'Logs' })}
          </Radio>
          <Radio value="diffs" disabled={!attempt}>
            {t('attemptHeaderActions.diffs', { defaultValue: 'Diffs' })}
          </Radio>
        </Radio.Group>

        <Typography.Text
          strong
          ellipsis={{ showTooltip: true }}
          className="flex-1 min-w-0"
        >
          {selectedTask.title}
        </Typography.Text>
      </div>

      {attempt && (
        <GitOperations
          selectedAttempt={attempt}
          task={selectedTask}
          branchStatus={branchStatus ?? null}
          branchStatusError={branchStatusError}
          isAttemptRunning={isAttemptRunning}
          selectedBranch={branchStatus?.[0]?.target_branch_name ?? null}
        />
      )}

      <div className="h-[calc(100%-3rem)] min-h-0">
        {mode === 'diffs' ? (
          <DiffsPanel
            key={attempt?.id}
            selectedAttempt={attempt ?? null}
          />
        ) : (
          <TaskAttemptPanel attempt={attempt} task={selectedTask}>
            {({ logs, followUp }) => (
              <div className="h-full min-h-0 flex flex-col">
                <div className="flex-1 min-h-0 flex flex-col">{logs}</div>
                <div className="min-h-0 max-h-[50%] border-t overflow-hidden">
                  <div className="mx-auto w-full max-w-[50rem] h-full min-h-0">
                    {followUp}
                  </div>
                </div>
              </div>
            )}
          </TaskAttemptPanel>
        )}
      </div>
    </section>
  );
}
