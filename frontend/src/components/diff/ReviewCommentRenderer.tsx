import { useState } from 'react';
import { Button } from '@/components/ui/button';
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
    'rounded-md border border-primary/20 bg-primary/5 px-3 py-2';

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

  if (isEditing) {
    return (
      <div className={reviewCommentContainerClass}>
        <div className={reviewCommentCardClass}>
          <WYSIWYGEditor
            value={editText}
            onChange={setEditText}
            placeholder="Edit comment... (type @ to search files)"
            className="w-full bg-background text-foreground text-sm font-mono min-h-[60px]"
            projectId={projectId}
            onCmdEnter={handleSave}
            autoFocus
          />
          <div className="mt-2 flex gap-2">
            <Button size="xs" onClick={handleSave} disabled={!editText.trim()}>
              Save changes
            </Button>
            <Button
              size="xs"
              variant="ghost"
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
        <WYSIWYGEditor
          value={comment.text}
          disabled={true}
          className="text-sm"
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
