import { useState } from 'react';
import { Banner, Modal, Space, Typography } from '@douyinfe/semi-ui';
import { tasksApi } from '@/lib/api';
import type { TaskWithAttemptStatus } from 'shared/types';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { defineModal } from '@/lib/modals';

export interface ClearDoneTasksConfirmationDialogProps {
  tasks: TaskWithAttemptStatus[];
}

const ClearDoneTasksConfirmationDialogImpl =
  NiceModal.create<ClearDoneTasksConfirmationDialogProps>(({ tasks }) => {
    const modal = useModal();
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const taskCount = tasks.length;
    const taskLabel = taskCount === 1 ? 'task' : 'tasks';

    const handleConfirmDelete = async () => {
      if (taskCount === 0) {
        modal.resolve();
        modal.hide();
        return;
      }

      setIsDeleting(true);
      setError(null);

      try {
        for (const task of tasks) {
          await tasksApi.delete(task.id);
        }

        modal.resolve();
        modal.hide();
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : `Failed to delete ${taskLabel} from Done`;
        setError(errorMessage);
      } finally {
        setIsDeleting(false);
      }
    };

    const handleCancelDelete = () => {
      modal.reject();
      modal.hide();
    };

    return (
      <Modal
        visible={modal.visible}
        title="Clear Done Tasks"
        okText={isDeleting ? 'Deleting...' : 'Clear Done'}
        cancelText="Cancel"
        onOk={handleConfirmDelete}
        onCancel={handleCancelDelete}
        closeOnEsc
        maskClosable
        okButtonProps={{ type: 'danger', disabled: isDeleting, loading: isDeleting }}
        cancelButtonProps={{ theme: 'outline', disabled: isDeleting, autoFocus: true }}
      >
        <Space vertical spacing={12} align="start" style={{ width: '100%' }}>
          <Typography.Text type="tertiary">
            Are you sure you want to delete all{' '}
            <Typography.Text strong>{taskCount}</Typography.Text> {taskLabel}{' '}
            in the <Typography.Text strong>"Done"</Typography.Text> column?
          </Typography.Text>
          <Banner type="danger" fullMode={false}>
            <strong>Warning:</strong> This action will permanently delete these
            tasks and cannot be undone.
          </Banner>
          {error && <Banner type="danger" fullMode={false} description={error} />}
        </Space>
      </Modal>
    );
  });

export const ClearDoneTasksConfirmationDialog = defineModal<
  ClearDoneTasksConfirmationDialogProps,
  void
>(ClearDoneTasksConfirmationDialogImpl);
