import * as React from 'react';

import { cn } from '@/lib/utils';
import { useHotkeysContext } from 'react-hotkeys-hook';
import { useKeyExit, useKeySubmit, Scope } from '@/keyboard';
import { Modal, Typography } from '@douyinfe/semi-ui';

const WIDTH_MAP: Record<string, number> = {
  'max-w-md': 448,
  'max-w-lg': 512,
  'max-w-xl': 576,
  'max-w-2xl': 672,
  'max-w-3xl': 768,
  'max-w-4xl': 896,
  'max-w-5xl': 1024,
  'max-w-6xl': 1152,
  'max-w-7xl': 1280,
};

function extractModalWidth(className: string | undefined): number | undefined {
  if (!className) return undefined;

  const px = className.match(/(?:^|\s)(?:sm:)?max-w-\[(\d+)px\](?:\s|$)/);
  if (px?.[1]) return Number(px[1]);

  for (const [k, v] of Object.entries(WIDTH_MAP)) {
    const re = new RegExp(`(?:^|\\s)(?:sm:)?${k}(?:\\s|$)`);
    if (re.test(className)) return v;
  }

  return undefined;
}

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-1', className)} {...props} />
);
DialogHeader.displayName = 'DialogHeader';

const DialogTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <Typography.Title
    ref={ref as never}
    heading={4}
    className={cn(className)}
    {...props}
  />
));
DialogTitle.displayName = 'DialogTitle';

const DialogDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <Typography.Text
    ref={ref as never}
    type="tertiary"
    className={cn(className)}
    {...props}
  />
));
DialogDescription.displayName = 'DialogDescription';

const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col gap-4', className)} {...props} />
));
DialogContent.displayName = 'DialogContent';

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-center justify-end gap-2', className)} {...props} />
);
DialogFooter.displayName = 'DialogFooter';

const Dialog = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    uncloseable?: boolean;
    width?: number | string;
    bodyStyle?: React.CSSProperties;
  }
>(
  (
    {
      className,
      open,
      onOpenChange,
      children,
      uncloseable,
      width,
      bodyStyle,
      ...props
    },
    ref
  ) => {
  const { enableScope, disableScope } = useHotkeysContext();

  // Manage dialog scope when open/closed
  React.useEffect(() => {
    if (open) {
      enableScope(Scope.DIALOG);
      disableScope(Scope.KANBAN);
      disableScope(Scope.PROJECTS);
    } else {
      disableScope(Scope.DIALOG);
      enableScope(Scope.KANBAN);
      enableScope(Scope.PROJECTS);
    }
    return () => {
      disableScope(Scope.DIALOG);
      enableScope(Scope.KANBAN);
      enableScope(Scope.PROJECTS);
    };
  }, [open, enableScope, disableScope]);

  // Dialog keyboard shortcuts using semantic hooks
  useKeyExit(
    (e) => {
      if (uncloseable) return;

      // Two-step Esc behavior:
      // 1. If input/textarea is focused, blur it first
      const activeElement = document.activeElement as HTMLElement;
      if (
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.isContentEditable)
      ) {
        activeElement.blur();
        e?.preventDefault();
        return;
      }

      // 2. Otherwise close the dialog
      onOpenChange?.(false);
    },
    {
      scope: Scope.DIALOG,
      when: () => !!open,
    }
  );

  useKeySubmit(
    (e) => {
      // Don't interfere if user is typing in textarea (allow new lines)
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      // Look for submit button or primary action button within this dialog
      if (ref && typeof ref === 'object' && ref.current) {
        // First try to find a submit button
        const submitButton = ref.current.querySelector(
          'button[type="submit"]'
        ) as HTMLButtonElement;
        if (submitButton && !submitButton.disabled) {
          e?.preventDefault();
          submitButton.click();
          return;
        }

        // If no submit button, look for primary action button
        const buttons = Array.from(
          ref.current.querySelectorAll('button')
        ) as HTMLButtonElement[];
        const primaryButton = buttons.find(
          (btn) =>
            !btn.disabled &&
            !btn.textContent?.toLowerCase().includes('cancel') &&
            !btn.textContent?.toLowerCase().includes('close') &&
            btn.type !== 'button'
        );

        if (primaryButton) {
          e?.preventDefault();
          primaryButton.click();
        }
      }
    },
    {
      scope: Scope.DIALOG,
      when: () => !!open,
    }
  );

  if (!open) return null;

  const contentChild = React.Children.toArray(children).find(
    (c): c is React.ReactElement =>
      React.isValidElement(c) && c.type === DialogContent
  );
  const contentClassName = (
    contentChild?.props as unknown as { className?: string }
  )?.className;
  const inferredWidth = extractModalWidth(contentClassName);

  return (
    <Modal
      visible={open}
      width={width ?? inferredWidth}
      // Let dialog content fully control header/footer layout
      header={null}
      footer={null}
      bodyStyle={bodyStyle}
      closable={!uncloseable}
      closeOnEsc={!uncloseable}
      maskClosable={!uncloseable}
      onCancel={() => onOpenChange?.(false)}
    >
      <div
        ref={ref}
        className={cn(className)}
        {...(props as unknown as Record<string, unknown>)}
      >
        {children}
      </div>
    </Modal>
  );
  }
);
Dialog.displayName = 'Dialog';

export {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
};
