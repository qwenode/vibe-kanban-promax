import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { AlertTriangle } from 'lucide-react';
import { defineModal } from '@/lib/modals';
import { useForcePush } from '@/hooks/useForcePush';
import { useState } from 'react';
import { Banner, Button, Modal, Typography } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';

export interface ForcePushDialogProps {
  attemptId: string;
  repoId: string;
  branchName?: string;
}

const ForcePushDialogImpl = NiceModal.create<ForcePushDialogProps>((props) => {
  const modal = useModal();
  const { attemptId, repoId, branchName } = props;
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation(['tasks', 'common']);
  const branchLabel = branchName ? ` "${branchName}"` : '';

  const forcePush = useForcePush(
    attemptId,
    () => {
      // Success - close dialog
      modal.resolve('success');
      modal.hide();
    },
    (err: unknown) => {
      // Error - show in dialog and keep open
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String(err.message)
          : t('tasks:git.forcePushDialog.error');
      setError(message);
    }
  );

  const handleConfirm = async () => {
    setError(null);
    try {
      await forcePush.mutateAsync({ repo_id: repoId });
    } catch {
      // Error already handled by onError callback
    }
  };

  const handleCancel = () => {
    modal.resolve('canceled');
    modal.hide();
  };

  const isProcessing = forcePush.isPending;

  return (
    <Modal visible={modal.visible} onCancel={handleCancel} footer={null} width={500}>
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <Typography.Title heading={5}>
              {t('tasks:git.forcePushDialog.title')}
            </Typography.Title>
          </div>
          <div className="text-left pt-2 space-y-2">
            <p>{t('tasks:git.forcePushDialog.description', { branchLabel })}</p>
            <p className="font-medium">
              {t('tasks:git.forcePushDialog.warning')}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('tasks:git.forcePushDialog.note')}
            </p>
          </div>
        </div>
        {error && (
          <Banner type="danger" fullMode={false} description={error} />
        )}
        <div className="gap-2 flex items-center justify-end">
          <Button
            theme="outline"
            onClick={handleCancel}
            disabled={isProcessing}
          >
            {t('common:buttons.cancel')}
          </Button>
          <Button
            type="danger"
            onClick={handleConfirm}
            disabled={isProcessing}
            loading={isProcessing}
          >
            {isProcessing
              ? t('tasks:git.states.forcePushing')
              : t('tasks:git.states.forcePush')}
          </Button>
        </div>
      </div>
    </Modal>
  );
});

export const ForcePushDialog = defineModal<ForcePushDialogProps, string>(
  ForcePushDialogImpl
);
