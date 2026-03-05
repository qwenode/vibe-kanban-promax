import { Button, Modal, Typography } from '@douyinfe/semi-ui';
import { AlertTriangle } from 'lucide-react';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { defineModal, type NoProps } from '@/lib/modals';

const DisclaimerDialogImpl = NiceModal.create<NoProps>(() => {
  const modal = useModal();

  const handleAccept = () => {
    modal.resolve('accepted');
  };

  return (
    <Modal
      visible={modal.visible}
      closable={false}
      closeOnEsc={false}
      maskClosable={false}
      footer={null}
      width={600}
    >
      <div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <Typography.Title heading={4} className="!mb-0">
              Safety Notice
            </Typography.Title>
          </div>
          <div className="text-left space-y-4 pt-4 text-[var(--semi-color-text-2)]">
            <p>
              Vibe Kanban runs AI coding agents with{' '}
              <code>--dangerously-skip-permissions</code> / <code>--yolo</code>{' '}
              by default, giving them unrestricted access to execute code and
              run commands on your system.
            </p>
            <p>
              <strong>Important:</strong> Always review what agents are doing
              and ensure you have backups of important work. This software is
              experimental - use it responsibly.
            </p>
            <p>
              Learn more at{' '}
              <a
                href="https://www.vibekanban.com/docs/getting-started#safety-notice"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 underline hover:no-underline"
              >
                https://www.vibekanban.com/docs/getting-started#safety-notice
              </a>
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 mt-4">
          <Button onClick={handleAccept}>
            I Understand, Continue
          </Button>
        </div>
      </div>
    </Modal>
  );
});

export const DisclaimerDialog = defineModal<void, 'accepted' | void>(
  DisclaimerDialogImpl
);
