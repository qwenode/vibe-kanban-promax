import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { defineModal } from '@/lib/modals';
import { useTranslation } from 'react-i18next';
import { Modal, Typography } from '@douyinfe/semi-ui';
import ProcessesTab from '@/components/tasks/TaskDetails/ProcessesTab';
import { ProcessSelectionProvider } from '@/contexts/ProcessSelectionContext';

export interface ViewProcessesDialogProps {
  sessionId: string | undefined;
  initialProcessId?: string | null;
}

const ViewProcessesDialogImpl = NiceModal.create<ViewProcessesDialogProps>(
  ({ sessionId, initialProcessId }) => {
    const { t } = useTranslation('tasks');
    const modal = useModal();

    return (
      <Modal
        visible={modal.visible}
        onCancel={() => modal.hide()}
        footer={null}
        width={1024}
        bodyStyle={{ padding: 0 }}
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
              {t('viewProcessesDialog.title')}
            </Typography.Title>
          </div>
          <div className="h-[75vh] flex flex-col min-h-0 min-w-0">
            <ProcessSelectionProvider initialProcessId={initialProcessId}>
              <ProcessesTab sessionId={sessionId} />
            </ProcessSelectionProvider>
          </div>
        </div>
      </Modal>
    );
  }
);

export const ViewProcessesDialog = defineModal<ViewProcessesDialogProps, void>(
  ViewProcessesDialogImpl
);
