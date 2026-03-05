import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { defineModal } from '@/lib/modals';
import { useTranslation } from 'react-i18next';
import { Banner, Button, Modal, Table, Typography } from '@douyinfe/semi-ui';
import { PlusIcon } from 'lucide-react';
import { openTaskForm } from '@/lib/openTaskForm';
import { useTaskRelationships } from '@/hooks/useTaskRelationships';
import type { Task } from 'shared/types';
import type { Workspace } from 'shared/types';

export interface ViewRelatedTasksDialogProps {
  attemptId: string;
  projectId: string;
  attempt: Workspace | null;
  onNavigateToTask?: (taskId: string) => void;
}

const ViewRelatedTasksDialogImpl =
  NiceModal.create<ViewRelatedTasksDialogProps>(
    ({ attemptId, projectId, attempt, onNavigateToTask }) => {
      const modal = useModal();
      const { t } = useTranslation('tasks');
      const {
        data: relationships,
        isLoading,
        isError,
        refetch,
      } = useTaskRelationships(attemptId);

      // Combine parent and children into a single list of related tasks
      const relatedTasks: Task[] = [];
      if (relationships?.parent_task) {
        relatedTasks.push(relationships.parent_task);
      }
      if (relationships?.children) {
        relatedTasks.push(...relationships.children);
      }

      const taskColumns = [
        {
          title: t('viewRelatedTasksDialog.columns.title'),
          dataIndex: 'title',
          render: (_: unknown, task: Task) => (
            <div className="truncate" title={task.title}>
              {task.title || '—'}
            </div>
          ),
        },
        {
          title: t('viewRelatedTasksDialog.columns.description'),
          dataIndex: 'description',
          render: (_: unknown, task: Task) => (
            <div
              className="line-clamp-1 text-muted-foreground"
              title={task.description || ''}
            >
              {task.description?.trim() ? task.description : '—'}
            </div>
          ),
        },
      ];

      const handleOpenChange = (open: boolean) => {
        if (!open) {
          modal.hide();
        }
      };

      const handleClickTask = (taskId: string) => {
        onNavigateToTask?.(taskId);
        modal.hide();
      };

      const handleCreateSubtask = async () => {
        if (!projectId || !attempt) return;

        // Close immediately - user intent is to create a subtask
        modal.hide();

        try {
          // Yield one microtask for smooth modal transition
          await Promise.resolve();

          await openTaskForm({
            mode: 'subtask',
            projectId,
            parentTaskAttemptId: attempt.id,
            initialBaseBranch: attempt.branch,
          });
        } catch {
          // User cancelled or error occurred
        }
      };

      return (
        <Modal
          visible={modal.visible}
          onCancel={() => handleOpenChange(false)}
          footer={null}
          width={960}
          bodyStyle={{ padding: 0 }}
          closeOnEsc
          maskClosable
        >
          <div
            className="p-0 min-w-0"
            onKeyDownCapture={(e) => {
              if (e.key === 'Escape') {
                e.stopPropagation();
                modal.hide();
              }
            }}
          >
            <div className="px-4 py-3 border-b">
              <Typography.Title heading={5}>
                {t('viewRelatedTasksDialog.title')}
              </Typography.Title>
            </div>

            <div className="p-4 max-h-[70vh] overflow-auto">
              {isError && (
                <div className="py-8 text-center space-y-3">
                  <Banner
                    type="danger"
                    fullMode={false}
                    description={t('viewRelatedTasksDialog.error')}
                  />
                  <Button theme="outline" onClick={() => refetch()}>
                    {t('common:buttons.retry')}
                  </Button>
                </div>
              )}

              {!isError && (
                <Table
                  dataSource={relatedTasks}
                  columns={taskColumns}
                  rowKey="id"
                  pagination={false}
                  loading={isLoading}
                  empty={t('viewRelatedTasksDialog.empty')}
                  onRow={(task) => ({
                    onClick: () => {
                      if (task) handleClickTask(task.id);
                    },
                  })}
                  title={() =>
                    <div className="w-full flex text-left">
                      <span className="flex-1">
                        {t('viewRelatedTasksDialog.tasksCount', {
                          count: relatedTasks.length,
                        })}
                      </span>
                      <span>
                        <Button
                          theme="borderless"
                          onClick={handleCreateSubtask}
                          disabled={!projectId || !attempt}
                          icon={<PlusIcon size={16} />}
                        >
                        </Button>
                      </span>
                    </div>
                  }
                />
              )}
            </div>
          </div>
        </Modal>
      );
    }
  );

export const ViewRelatedTasksDialog = defineModal<
  ViewRelatedTasksDialogProps,
  void
>(ViewRelatedTasksDialogImpl);
