import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { defineModal } from '@/lib/modals';
import { Banner, Button, Checkbox, Modal, Spin, Typography } from '@douyinfe/semi-ui';
import { MessageSquare, AlertCircle } from 'lucide-react';
import { usePrComments } from '@/hooks/usePrComments';
import { PrCommentCard } from '@/components/ui/pr-comment-card';
import type { UnifiedPrComment } from 'shared/types';

export interface PrCommentsDialogProps {
  attemptId: string;
  repoId: string;
}

export interface PrCommentsDialogResult {
  comments: UnifiedPrComment[];
}

function getCommentId(comment: UnifiedPrComment): string {
  return comment.comment_type === 'general'
    ? comment.id
    : comment.id.toString();
}

const PrCommentsDialogImpl = NiceModal.create<PrCommentsDialogProps>(
  ({ attemptId, repoId }) => {
    const { t } = useTranslation(['tasks', 'common']);
    const modal = useModal();
    const { data, isLoading, isError, error } = usePrComments(
      attemptId,
      repoId
    );
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const comments = data?.comments ?? [];

    // Reset selection when dialog opens
    useEffect(() => {
      if (modal.visible) {
        setSelectedIds(new Set());
      }
    }, [modal.visible]);

    const toggleSelection = (id: string) => {
      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        return newSet;
      });
    };

    const selectAll = () => {
      setSelectedIds(new Set(comments.map((c) => getCommentId(c))));
    };

    const deselectAll = () => {
      setSelectedIds(new Set());
    };

    const isAllSelected =
      comments.length > 0 && selectedIds.size === comments.length;

    const handleConfirm = () => {
      const selected = comments.filter((c) => selectedIds.has(getCommentId(c)));
      modal.resolve({ comments: selected });
      modal.hide();
    };

    const handleOpenChange = (open: boolean) => {
      if (!open) {
        modal.resolve({ comments: [] });
        modal.hide();
      }
    };

    // Check for specific error types from the API
    const errorMessage = isError ? getErrorMessage(error) : null;

    return (
      <Modal
        visible={modal.visible}
        onCancel={() => handleOpenChange(false)}
        width={672}
        footer={null}
        bodyStyle={{ padding: 0 }}
      >
        <div
          className="overflow-hidden"
          onKeyDownCapture={(e) => {
            if (e.key === 'Escape') {
              e.stopPropagation();
              modal.resolve({ comments: [] });
              modal.hide();
            }
          }}
        >
          <div className="px-4 py-3 border-b">
            <Typography.Title heading={5} className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {t('tasks:prComments.dialog.title')}
            </Typography.Title>
          </div>

          <div className="max-h-[70vh] flex flex-col min-h-0">
            <div className="p-4 overflow-auto flex-1 min-h-0">
              {errorMessage ? (
                <Banner
                  type="danger"
                  icon={<AlertCircle className="h-4 w-4" />}
                  description={errorMessage}
                  fullMode={false}
                />
              ) : isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Spin />
                </div>
              ) : comments.length === 0 ? (
                <Typography.Text type="tertiary" className="w-full text-center py-8">
                  {t('tasks:prComments.dialog.noComments')}
                </Typography.Text>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <Typography.Text type="tertiary">
                      {t('tasks:prComments.dialog.selectedCount', {
                        selected: selectedIds.size,
                        total: comments.length,
                      })}
                    </Typography.Text>
                    <Button
                      theme="borderless"
                      onClick={isAllSelected ? deselectAll : selectAll}
                    >
                      {isAllSelected
                        ? t('tasks:prComments.dialog.deselectAll')
                        : t('tasks:prComments.dialog.selectAll')}
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {comments.map((comment) => {
                      const id = getCommentId(comment);
                      return (
                        <div
                          key={id}
                          className="flex items-start gap-3 min-w-0"
                        >
                          <Checkbox
                            checked={selectedIds.has(id)}
                            onChange={() => toggleSelection(id)}
                          />
                          <PrCommentCard
                            author={comment.author}
                            body={comment.body}
                            createdAt={comment.created_at}
                            url={comment.url}
                            commentType={comment.comment_type}
                            path={
                              comment.comment_type === 'review'
                                ? comment.path
                                : undefined
                            }
                            line={
                              comment.comment_type === 'review' &&
                              comment.line != null
                                ? Number(comment.line)
                                : undefined
                            }
                            diffHunk={
                              comment.comment_type === 'review'
                                ? comment.diff_hunk
                                : undefined
                            }
                            variant="list"
                            onClick={() => toggleSelection(id)}
                            className="flex-1 min-w-0"
                          />
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          {!errorMessage && !isLoading && comments.length > 0 && (
            <div className="px-4 py-3 border-t flex items-center justify-end gap-2">
              <Button theme="outline" onClick={() => handleOpenChange(false)}>
                {t('common:buttons.cancel')}
              </Button>
              <Button
                type="primary"
                onClick={handleConfirm}
                disabled={selectedIds.size === 0}
              >
                {t('tasks:prComments.dialog.add')}
                {selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}
              </Button>
            </div>
          )}
        </div>
      </Modal>
    );
  }
);

function getErrorMessage(error: unknown): string {
  // Check if it's an API error with error_data
  if (error && typeof error === 'object' && 'error_data' in error) {
    const errorData = (error as { error_data?: { type?: string } }).error_data;
    if (errorData?.type === 'no_pr_attached') {
      return 'No PR is attached to this task attempt. Create a PR first to see comments.';
    }
    if (errorData?.type === 'cli_not_installed') {
      return 'CLI is not installed. Please install it to fetch PR comments.';
    }
    if (errorData?.type === 'cli_not_logged_in') {
      return 'CLI is not logged in. Please authenticate to fetch PR comments.';
    }
  }
  return 'Failed to load PR comments. Please try again.';
}

export const PrCommentsDialog = defineModal<
  PrCommentsDialogProps,
  PrCommentsDialogResult
>(PrCommentsDialogImpl);
