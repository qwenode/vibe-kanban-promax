import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Banner, Button, Input, Modal, Typography } from '@douyinfe/semi-ui';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { defineModal, getErrorMessage } from '@/lib/modals';
import { useRenameBranch } from '@/hooks/useRenameBranch';

export interface EditBranchNameDialogProps {
  attemptId: string;
  currentBranchName: string;
}

export type EditBranchNameDialogResult = {
  action: 'confirmed' | 'canceled';
  branchName?: string;
};

const EditBranchNameDialogImpl = NiceModal.create<EditBranchNameDialogProps>(
  ({ attemptId, currentBranchName }) => {
    const modal = useModal();
    const { t } = useTranslation(['tasks', 'common']);
    const [branchName, setBranchName] = useState<string>(currentBranchName);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      setBranchName(currentBranchName);
      setError(null);
    }, [currentBranchName]);

    const renameMutation = useRenameBranch(
      attemptId,
      (newBranch) => {
        modal.resolve({
          action: 'confirmed',
          branchName: newBranch,
        } as EditBranchNameDialogResult);
        modal.hide();
      },
      (err: unknown) => {
        setError(getErrorMessage(err) || 'Failed to rename branch');
      }
    );

    const handleConfirm = () => {
      const trimmedName = branchName.trim();

      if (!trimmedName) {
        setError('Branch name cannot be empty');
        return;
      }

      if (trimmedName === currentBranchName) {
        modal.resolve({ action: 'canceled' } as EditBranchNameDialogResult);
        modal.hide();
        return;
      }

      if (trimmedName.includes(' ')) {
        setError('Branch name cannot contain spaces');
        return;
      }

      setError(null);
      renameMutation.mutate(trimmedName);
    };

    const handleCancel = () => {
      modal.resolve({ action: 'canceled' } as EditBranchNameDialogResult);
      modal.hide();
    };

    return (
      <Modal
        visible={modal.visible}
        onCancel={handleCancel}
        footer={null}
        width={448}
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <Typography.Title heading={5}>
              {t('editBranchName.dialog.title')}
            </Typography.Title>
            <Typography.Text type="tertiary">
              {t('editBranchName.dialog.description')}
            </Typography.Text>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Typography.Text strong>
                {t('editBranchName.dialog.branchNameLabel')}
              </Typography.Text>
              <Input
                id="branch-name"
                type="text"
                value={branchName}
                onChange={(value) => {
                  setBranchName(String(value));
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !renameMutation.isPending) {
                    handleConfirm();
                  }
                }}
                placeholder={t('editBranchName.dialog.placeholder')}
                disabled={renameMutation.isPending}
                autoFocus
              />
              {error && <Banner type="danger" fullMode={false} description={error} />}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              theme="outline"
              onClick={handleCancel}
              disabled={renameMutation.isPending}
            >
              {t('common:buttons.cancel')}
            </Button>
            <Button
              type="primary"
              onClick={handleConfirm}
              disabled={renameMutation.isPending || !branchName.trim()}
            >
              {renameMutation.isPending
                ? t('editBranchName.dialog.renaming')
                : t('editBranchName.dialog.action')}
            </Button>
          </div>
        </div>
      </Modal>
    );
  }
);

export const EditBranchNameDialog = defineModal<
  EditBranchNameDialogProps,
  EditBranchNameDialogResult
>(EditBranchNameDialogImpl);
