import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Banner, Button, Modal, Typography } from '@douyinfe/semi-ui';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { defineModal } from '@/lib/modals';

export interface DeleteConfigurationDialogProps {
  configName: string;
  executorType: string;
}

export type DeleteConfigurationResult = 'deleted' | 'canceled';

const DeleteConfigurationDialogImpl =
  NiceModal.create<DeleteConfigurationDialogProps>(
    ({ configName, executorType }) => {
      const { t } = useTranslation(['settings', 'common']);
      const modal = useModal();
      const [isDeleting, setIsDeleting] = useState(false);
      const [error, setError] = useState<string | null>(null);

      const handleDelete = async () => {
        setIsDeleting(true);
        setError(null);

        try {
          // Resolve with 'deleted' to let parent handle the deletion
          modal.resolve('deleted' as DeleteConfigurationResult);
          modal.hide();
        } catch {
          setError('Failed to delete configuration. Please try again.');
        } finally {
          setIsDeleting(false);
        }
      };

      const handleCancel = () => {
        modal.resolve('canceled' as DeleteConfigurationResult);
        modal.hide();
      };

      return (
        <Modal visible={modal.visible} onCancel={handleCancel} footer={null} width={448}>
          <div className="space-y-4">
            <div className="space-y-1">
              <Typography.Title heading={5}>
                {t('settings:settings.agents.deleteConfigDialog.title')}
              </Typography.Title>
              <Typography.Text type="tertiary">
                {t('settings:settings.agents.deleteConfigDialog.description', {
                  configName,
                  executorType,
                })}
              </Typography.Text>
            </div>

            {error && (
              <Banner type="danger" fullMode={false} description={error} />
            )}

            <div className="flex items-center justify-end gap-2">
              <Button
                theme="outline"
                onClick={handleCancel}
                disabled={isDeleting}
              >
                {t('common:buttons.cancel')}
              </Button>
              <Button
                type="danger"
                onClick={handleDelete}
                disabled={isDeleting}
                loading={isDeleting}
              >
                {t('common:buttons.delete')}
              </Button>
            </div>
          </div>
        </Modal>
      );
    }
  );

export const DeleteConfigurationDialog = defineModal<
  DeleteConfigurationDialogProps,
  DeleteConfigurationResult
>(DeleteConfigurationDialogImpl);
