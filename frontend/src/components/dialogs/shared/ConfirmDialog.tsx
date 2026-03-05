import { Modal, Typography } from '@douyinfe/semi-ui';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import {
  IconAlertTriangle,
  IconHelpCircle,
  IconInfoCircle,
  IconTickCircle,
} from '@douyinfe/semi-icons';
import { defineModal, type ConfirmResult } from '@/lib/modals';

export interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive' | 'info' | 'success';
  icon?: boolean;
}

const ConfirmDialogImpl = NiceModal.create<ConfirmDialogProps>((props) => {
  const modal = useModal();
  const {
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'default',
    icon = true,
  } = props;

  const handleConfirm = () => {
    modal.resolve('confirmed' as ConfirmResult);
    modal.hide();
  };

  const handleCancel = () => {
    modal.resolve('canceled' as ConfirmResult);
    modal.hide();
  };

  const getIcon = () => {
    if (!icon) return null;

    switch (variant) {
      case 'destructive':
        return <IconAlertTriangle style={{ color: 'var(--semi-color-danger)' }} />;
      case 'info':
        return <IconInfoCircle style={{ color: 'var(--semi-color-info)' }} />;
      case 'success':
        return <IconTickCircle style={{ color: 'var(--semi-color-success)' }} />;
      default:
        return <IconHelpCircle style={{ color: 'var(--semi-color-text-2)' }} />;
    }
  };

  const confirmType = variant === 'destructive' ? 'danger' : 'primary';

  return (
    <Modal
      visible={modal.visible}
      title={
        <div className="flex items-center gap-2">
          {getIcon()}
          <Typography.Text strong>{title}</Typography.Text>
        </div>
      }
      okText={confirmText}
      cancelText={cancelText}
      okButtonProps={{ type: confirmType, theme: 'solid' }}
      cancelButtonProps={{ theme: 'outline' }}
      onOk={handleConfirm}
      onCancel={handleCancel}
      closable
      closeOnEsc
      maskClosable
    >
      <Typography.Text type="tertiary">{message}</Typography.Text>
    </Modal>
  );
});

export const ConfirmDialog = defineModal<ConfirmDialogProps, ConfirmResult>(
  ConfirmDialogImpl
);
