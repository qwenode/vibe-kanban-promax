import * as React from 'react';
import { Dropdown } from '@douyinfe/semi-ui';
import { cn } from '@/lib/utils';

type MarkerProps = { children?: React.ReactNode; className?: string };

// Accept extra Radix-like props (open/onOpenChange/etc) for compatibility.
export function DropdownMenu({
  children,
  open,
  onOpenChange,
}: {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const nodes = React.Children.toArray(children) as React.ReactElement[];
  const triggerEl = nodes.find(
    (n) => React.isValidElement(n) && n.type === DropdownMenuTrigger
  );
  const contentEl = nodes.find(
    (n) => React.isValidElement(n) && n.type === DropdownMenuContent
  );

  const trigger = triggerEl?.props?.children ?? null;
  const contentChildren = contentEl?.props?.children ?? null;
  const contentClassName = contentEl?.props?.className;

  if (!trigger) return null;

  return (
    <Dropdown
      trigger="click"
      visible={open}
      onVisibleChange={(next) => onOpenChange?.(next)}
      render={
        <Dropdown.Menu className={cn(contentClassName)}>
          {contentChildren}
        </Dropdown.Menu>
      }
    >
      {trigger}
    </Dropdown>
  );
}

export function DropdownMenuTrigger({
  children,
}: {
  asChild?: boolean;
  onClick?: React.MouseEventHandler;
  children?: React.ReactNode;
}) {
  return <>{children}</>;
}

export function DropdownMenuContent({
  children,
}: {
  children?: React.ReactNode;
  className?: string;
  align?: string;
  side?: string;
}) {
  return <>{children}</>;
}

export function DropdownMenuItem({
  className,
  onClick,
  onSelect,
  disabled,
  asChild,
  children,
  ...rest
}: {
  className?: string;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  onSelect?: (e: Event) => void;
  asChild?: boolean;
  children?: React.ReactNode;
} & Omit<React.HTMLAttributes<HTMLDivElement>, 'onClick'>) {
  void asChild;
  return (
    <Dropdown.Item
      className={cn(className)}
      disabled={disabled}
      onClick={(e) => {
        onClick?.(e);
        // Radix compatible callback name
        onSelect?.(e.nativeEvent);
      }}
      {...(rest as unknown as Record<string, unknown>)}
    >
      {children}
    </Dropdown.Item>
  );
}

export function DropdownMenuLabel({ className, children }: MarkerProps) {
  return <Dropdown.Title className={cn(className)}>{children}</Dropdown.Title>;
}

export function DropdownMenuSeparator({ className }: { className?: string }) {
  return <Dropdown.Divider className={cn(className)} />;
}

export function DropdownMenuShortcut({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cn('ml-auto text-xs opacity-60', className)} {...props} />
  );
}

// Minimal no-op exports kept for compatibility
export const DropdownMenuGroup = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);
export const DropdownMenuPortal = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);
export const DropdownMenuSub = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);
export const DropdownMenuSubContent = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);
export const DropdownMenuSubTrigger = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);
export const DropdownMenuRadioGroup = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);
export const DropdownMenuCheckboxItem = DropdownMenuItem;
export const DropdownMenuRadioItem = DropdownMenuItem;
