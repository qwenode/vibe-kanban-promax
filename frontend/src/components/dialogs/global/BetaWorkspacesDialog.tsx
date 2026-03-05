import { Button, Modal, Typography } from '@douyinfe/semi-ui';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { defineModal, type NoProps } from '@/lib/modals';
import { useTranslation } from 'react-i18next';

const BetaWorkspacesDialogImpl = NiceModal.create<NoProps>(() => {
  const modal = useModal();
  const { t } = useTranslation('common');

  const handleJoinBeta = () => {
    modal.resolve(true);
  };

  const handleMaybeLater = () => {
    modal.resolve(false);
  };

  return (
    <Modal
      visible={modal.visible}
      closable={false}
      maskClosable={false}
      closeOnEsc={false}
      footer={null}
      width={640}
    >
      <div className="space-y-4">
        <img
          src="/beta-workspaces-preview.png"
          alt={t('betaWorkspaces.title')}
          className="w-full rounded-lg border"
        />
        <div>
          <Typography.Title heading={4}>
            {t('betaWorkspaces.title')}
          </Typography.Title>
        </div>
        <div className="text-muted-foreground space-y-4">
          <p>{t('betaWorkspaces.intro')}</p>
          <p>{t('betaWorkspaces.newUiDescription')}</p>
          <ul className="list-disc list-inside space-y-1">
            <li>{t('betaWorkspaces.newFeatures.multiRepo')}</li>
            <li>{t('betaWorkspaces.newFeatures.multiAgent')}</li>
            <li>{t('betaWorkspaces.newFeatures.commandBar')}</li>
          </ul>
          <p>{t('betaWorkspaces.oldUiDescription')}</p>
          <ul className="list-disc list-inside space-y-1">
            <li>{t('betaWorkspaces.oldFeatures.kanban')}</li>
            <li>{t('betaWorkspaces.oldFeatures.settings')}</li>
            <li>{t('betaWorkspaces.oldFeatures.projects')}</li>
          </ul>
          <p>{t('betaWorkspaces.transition')}</p>
          <p>{t('betaWorkspaces.optOutNote')}</p>
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button theme="outline" onClick={handleMaybeLater}>
            {t('betaWorkspaces.maybeLater')}
          </Button>
          <Button onClick={handleJoinBeta}>
            {t('betaWorkspaces.joinBeta')}
          </Button>
        </div>
      </div>
    </Modal>
  );
});

export const BetaWorkspacesDialog = defineModal<void, boolean>(
  BetaWorkspacesDialogImpl
);
