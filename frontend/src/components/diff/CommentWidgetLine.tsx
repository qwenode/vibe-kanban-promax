import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import WYSIWYGEditor, { type WYSIWYGEditorRef } from '@/components/ui/wysiwyg';
import { useReview, type ReviewDraft } from '@/contexts/ReviewProvider';
import { Scope, useKeyExit, useKeySubmitComment } from '@/keyboard';
import { useHotkeysContext } from 'react-hotkeys-hook';

interface CommentWidgetLineProps {
  draft: ReviewDraft;
  widgetKey: string;
  onSave: () => void;
  onCancel: () => void;
  projectId?: string;
}

export function CommentWidgetLine({
  draft,
  widgetKey,
  onSave,
  onCancel,
  projectId,
}: CommentWidgetLineProps) {
  const { setDraft, addComment } = useReview();
  const [value, setValue] = useState(draft.text);
  const editorRef = useRef<WYSIWYGEditorRef>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const { enableScope, disableScope } = useHotkeysContext();
  const reviewDraftContainerClass =
    'w-full border-y border-border/70 bg-muted/30 px-4 py-3';
  const reviewDraftCardClass =
    'rounded-md border border-warning/40 bg-warning/10 px-3 py-3 shadow-sm';

  const focusEditor = useCallback(() => {
    const editableElement =
      editorContainerRef.current?.querySelector<HTMLElement>(
        '[contenteditable="true"]'
      ) ?? null;

    if (editableElement && document.activeElement !== editableElement) {
      editableElement.focus();
    }

    editorRef.current?.focus();
  }, []);

  useEffect(() => {
    enableScope(Scope.EDIT_COMMENT);
    return () => {
      disableScope(Scope.EDIT_COMMENT);
    };
  }, [enableScope, disableScope]);

  useEffect(() => {
    let isCancelled = false;
    const timeoutIds: number[] = [];

    const tryFocus = (remainingAttempts: number) => {
      if (isCancelled) {
        return;
      }

      focusEditor();

      const editableElement =
        editorContainerRef.current?.querySelector<HTMLElement>(
          '[contenteditable="true"]'
        ) ?? null;
      if (editableElement && document.activeElement === editableElement) {
        return;
      }

      if (remainingAttempts <= 0) {
        return;
      }

      const timeoutId = window.setTimeout(() => {
        tryFocus(remainingAttempts - 1);
      }, 24);
      timeoutIds.push(timeoutId);
    };

    const frameId = window.requestAnimationFrame(() => {
      tryFocus(5);
    });

    return () => {
      isCancelled = true;
      window.cancelAnimationFrame(frameId);
      timeoutIds.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
    };
  }, [widgetKey, focusEditor]);

  const handleCancel = useCallback(() => {
    setDraft(widgetKey, null);
    onCancel();
  }, [setDraft, widgetKey, onCancel]);

  const handleSave = useCallback(() => {
    if (value.trim()) {
      addComment({
        filePath: draft.filePath,
        side: draft.side,
        lineNumber: draft.lineNumber,
        text: value.trim(),
        codeLine: draft.codeLine,
      });
    }
    setDraft(widgetKey, null);
    onSave();
  }, [value, draft, setDraft, widgetKey, onSave, addComment]);

  const handleSubmitShortcut = useCallback(
    (e?: KeyboardEvent) => {
      e?.preventDefault();
      handleSave();
    },
    [handleSave]
  );

  const exitOptions = useMemo(
    () => ({
      scope: Scope.EDIT_COMMENT,
    }),
    []
  );

  useKeyExit(handleCancel, exitOptions);

  useKeySubmitComment(handleSubmitShortcut, {
    scope: Scope.EDIT_COMMENT,
    enableOnFormTags: ['textarea', 'TEXTAREA'],
    when: value.trim() !== '',
    preventDefault: true,
  });

  return (
    <div className={reviewDraftContainerClass}>
      <div className={reviewDraftCardClass}>
        <div ref={editorContainerRef}>
          <WYSIWYGEditor
            ref={editorRef}
            value={value}
            onChange={setValue}
            placeholder="Add a comment... (type @ to search files)"
            className="w-full bg-background text-foreground text-sm font-mono min-h-[60px] px-2 py-1"
            projectId={projectId}
            onCmdEnter={handleSave}
            autoFocus
          />
        </div>
        <div className="mt-2 flex gap-2">
          <Button size="xs" onClick={handleSave} disabled={!value.trim()}>
            Add review comment
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
