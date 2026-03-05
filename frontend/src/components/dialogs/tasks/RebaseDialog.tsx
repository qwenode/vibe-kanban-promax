import { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, Modal, Typography } from '@douyinfe/semi-ui';
import BranchSelector from '@/components/tasks/BranchSelector';
import type { GitBranch } from 'shared/types';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { defineModal } from '@/lib/modals';

export interface RebaseDialogProps {
  branches: GitBranch[];
  isRebasing?: boolean;
  initialTargetBranch?: string;
  initialUpstreamBranch?: string;
}

export type RebaseDialogResult = {
  action: 'confirmed' | 'canceled';
  branchName?: string;
  upstreamBranch?: string;
};

const RebaseDialogImpl = NiceModal.create<RebaseDialogProps>(
  ({
    branches,
    isRebasing = false,
    initialTargetBranch,
    initialUpstreamBranch,
  }) => {
    const modal = useModal();
    const { t } = useTranslation(['tasks', 'common']);
    const [selectedBranch, setSelectedBranch] = useState<string>(
      initialTargetBranch ?? ''
    );
    const [selectedUpstream, setSelectedUpstream] = useState<string>(
      initialUpstreamBranch ?? ''
    );

    useEffect(() => {
      if (initialTargetBranch) {
        setSelectedBranch(initialTargetBranch);
      }
    }, [initialTargetBranch]);

    useEffect(() => {
      if (initialUpstreamBranch) {
        setSelectedUpstream(initialUpstreamBranch);
      }
    }, [initialUpstreamBranch]);

    const [showAdvanced, setShowAdvanced] = useState(false);

    const handleConfirm = () => {
      if (selectedBranch) {
        modal.resolve({
          action: 'confirmed',
          branchName: selectedBranch,
          upstreamBranch: selectedUpstream,
        } as RebaseDialogResult);
        modal.hide();
      }
    };

    const handleCancel = () => {
      modal.resolve({ action: 'canceled' } as RebaseDialogResult);
      modal.hide();
    };

    return (
      <Modal visible={modal.visible} onCancel={handleCancel} footer={null} width={448}>
        <div className="space-y-4">
          <div className="space-y-1">
            <Typography.Title heading={5}>{t('rebase.dialog.title')}</Typography.Title>
            <Typography.Text type="tertiary">
              {t('rebase.dialog.description')}
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
                placeholder={t('rebase.dialog.targetPlaceholder')}
                excludeCurrentBranch={false}
              />
            </div>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowAdvanced((prev) => !prev)}
                className="flex w-full items-center gap-2 text-left text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ChevronRight
                  className={`h-3 w-3 transition-transform ${showAdvanced ? 'rotate-90' : ''}`}
                />
                <span>{t('rebase.dialog.advanced')}</span>
              </button>
              {showAdvanced && (
                <div className="space-y-2">
                  <Typography.Text strong>
                    {t('rebase.dialog.upstreamLabel')}
                  </Typography.Text>
                  <BranchSelector
                    branches={branches}
                    selectedBranch={selectedUpstream}
                    onBranchSelect={setSelectedUpstream}
                    placeholder={t('rebase.dialog.upstreamPlaceholder')}
                    excludeCurrentBranch={false}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              theme="outline"
              onClick={handleCancel}
              disabled={isRebasing}
            >
              {t('common:buttons.cancel')}
            </Button>
            <Button
              type="primary"
              onClick={handleConfirm}
              disabled={isRebasing || !selectedBranch}
            >
              {isRebasing
                ? t('rebase.common.inProgress')
                : t('rebase.common.action')}
            </Button>
          </div>
        </div>
      </Modal>
    );
  }
);

export const RebaseDialog = defineModal<RebaseDialogProps, RebaseDialogResult>(
  RebaseDialogImpl
);
