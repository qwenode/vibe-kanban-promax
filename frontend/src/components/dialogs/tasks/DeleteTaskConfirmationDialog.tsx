import { useState } from 'react';
import { Banner, Modal, Space, Typography } from '@douyinfe/semi-ui';
import { tasksApi } from '@/lib/api';
import type { TaskWithAttemptStatus } from 'shared/types';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { defineModal } from '@/lib/modals';

export interface DeleteTaskConfirmationDialogProps {
  task: TaskWithAttemptStatus;
  projectId: string;
}

const DeleteTaskConfirmationDialogImpl =
  NiceModal.create<DeleteTaskConfirmationDialogProps>(({ task }) => {
    const modal = useModal();
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleConfirmDelete = async () => {
      setIsDeleting(true);
      setError(null);

      try {
        await tasksApi.delete(task.id);
        modal.resolve();
        modal.hide();
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to delete task';
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
        title="Delete Task"
        okText={isDeleting ? 'Deleting...' : 'Delete Task'}
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
            Are you sure you want to delete{' '}
            <Typography.Text strong>"{task.title}"</Typography.Text>?
          </Typography.Text>
          <Banner type="danger" fullMode={false}>
            <strong>Warning:</strong> This action will permanently delete the
            task and cannot be undone.
          </Banner>
          {error && <Banner type="danger" fullMode={false} description={error} />}
        </Space>
      </Modal>
    );
  });

export const DeleteTaskConfirmationDialog = defineModal<
  DeleteTaskConfirmationDialogProps,
  void
>(DeleteTaskConfirmationDialogImpl);
