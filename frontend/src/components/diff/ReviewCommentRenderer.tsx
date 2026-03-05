import { useState, type MouseEvent } from 'react';
import { Button } from '@douyinfe/semi-ui';
import WYSIWYGEditor from '@/components/ui/wysiwyg';
import { useReview, type ReviewComment } from '@/contexts/ReviewProvider';

interface ReviewCommentRendererProps {
  comment: ReviewComment;
  projectId?: string;
}

export function ReviewCommentRenderer({
  comment,
  projectId,
}: ReviewCommentRendererProps) {
  const { deleteComment, updateComment } = useReview();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const reviewCommentContainerClass =
    'w-full border-y border-border/70 bg-muted/30 px-4 py-3';
  const reviewCommentCardClass =
    'rounded-md border border-warning/40 bg-warning/10 px-3 py-2 shadow-sm';

  const handleDelete = () => {
    deleteComment(comment.id);
  };

  const handleEdit = () => {
    setEditText(comment.text);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editText.trim()) {
      updateComment(comment.id, editText.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(comment.text);
    setIsEditing(false);
  };

  const handleReadOnlyClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest('button')) {
      return;
    }

    handleEdit();
  };

  if (isEditing) {
    return (
      <div className={reviewCommentContainerClass}>
        <div className={reviewCommentCardClass}>
          <WYSIWYGEditor
            value={editText}
            onChange={setEditText}
            placeholder="Edit comment... (type @ to search files)"
            className="w-full bg-background text-foreground text-sm font-mono min-h-[60px] px-2 py-1"
            projectId={projectId}
            onCmdEnter={handleSave}
            autoFocus
          />
          <div className="mt-2 flex gap-2">
            <Button size="small" onClick={handleSave} disabled={!editText.trim()}>
              Save changes
            </Button>
            <Button
              size="small"
              theme="borderless"
              onClick={handleCancel}
              className="text-secondary-foreground"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={reviewCommentContainerClass}>
      <div className={reviewCommentCardClass}>
        <div onClick={handleReadOnlyClick} className="cursor-text">
          <WYSIWYGEditor
            value={comment.text}
            disabled={true}
            className="text-sm"
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </div>
  );
}
