import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Modal, Typography } from '@douyinfe/semi-ui';
import BranchSelector from '@/components/tasks/BranchSelector';
import type { GitBranch } from 'shared/types';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { defineModal } from '@/lib/modals';

export interface ChangeTargetBranchDialogProps {
  branches: GitBranch[];
  isChangingTargetBranch?: boolean;
}

export type ChangeTargetBranchDialogResult = {
  action: 'confirmed' | 'canceled';
  branchName?: string;
};

const ChangeTargetBranchDialogImpl =
  NiceModal.create<ChangeTargetBranchDialogProps>(
    ({ branches, isChangingTargetBranch: isChangingTargetBranch = false }) => {
      const modal = useModal();
      const { t } = useTranslation(['tasks', 'common']);
      const [selectedBranch, setSelectedBranch] = useState<string>('');

      const handleConfirm = () => {
        if (selectedBranch) {
          modal.resolve({
            action: 'confirmed',
            branchName: selectedBranch,
          } as ChangeTargetBranchDialogResult);
          modal.hide();
        }
      };

      const handleCancel = () => {
        modal.resolve({ action: 'canceled' } as ChangeTargetBranchDialogResult);
        modal.hide();
      };

      return (
        <Modal visible={modal.visible} onCancel={handleCancel} footer={null} width={448}>
          <div className="space-y-4">
            <div className="space-y-1">
              <Typography.Title heading={5}>
                {t('branches.changeTarget.dialog.title')}
              </Typography.Title>
              <Typography.Text type="tertiary">
                {t('branches.changeTarget.dialog.description')}
              </Typography.Text>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Typography.Text strong>
                  {t('rebase.dialog.targetLabel')}
                </Typography.Text>
                <BranchSelector
                  branches={branches}
                  selectedBranch={selectedBranch}
                  onBranchSelect={setSelectedBranch}
                  placeholder={t('branches.changeTarget.dialog.placeholder')}
                  excludeCurrentBranch={false}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button
                theme="outline"
                onClick={handleCancel}
                disabled={isChangingTargetBranch}
              >
                {t('common:buttons.cancel')}
              </Button>
              <Button
                type="primary"
                onClick={handleConfirm}
                disabled={isChangingTargetBranch || !selectedBranch}
              >
                {isChangingTargetBranch
                  ? t('branches.changeTarget.dialog.inProgress')
                  : t('branches.changeTarget.dialog.action')}
              </Button>
            </div>
          </div>
        </Modal>
      );
    }
  );

export const ChangeTargetBranchDialog = defineModal<
  ChangeTargetBranchDialogProps,
  ChangeTargetBranchDialogResult
>(ChangeTargetBranchDialogImpl);
