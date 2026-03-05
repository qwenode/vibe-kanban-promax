import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@douyinfe/semi-ui';

type ToggleGroupProps = {
  type?: 'single' | 'multiple';
  value?: string | string[];
  defaultValue?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  className?: string;
  children?: React.ReactNode;
};

type ToggleGroupItemProps = {
  value: string;
  disabled?: boolean;
  className?: string;
  active?: boolean;
  children?: React.ReactNode;
  onSelect?: (value: string) => void;
};

export function ToggleGroup({
  type = 'single',
  value,
  defaultValue,
  onValueChange,
  className,
  children,
}: ToggleGroupProps) {
  const [internal, setInternal] = React.useState<string | string[] | undefined>(
    defaultValue
  );
  const current = value ?? internal;
  const currentSingle = typeof current === 'string' ? current : undefined;
  const currentMulti = Array.isArray(current) ? current : [];

  const handleSelect = (next: string) => {
    if (type === 'single') {
      if (value === undefined) setInternal(next);
      onValueChange?.(next);
      return;
    }

    const exists = currentMulti.includes(next);
    const nextArr = exists
      ? currentMulti.filter((v) => v !== next)
      : [...currentMulti, next];
    if (value === undefined) setInternal(nextArr);
    onValueChange?.(nextArr);
  };

  return (
    <div className={cn('inline-flex items-center gap-1', className)}>
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        if (child.type !== ToggleGroupItem) return child;
        const childValue = (child.props as ToggleGroupItemProps).value;
        return React.cloneElement(child, {
          active:
            type === 'single'
              ? childValue === currentSingle
              : currentMulti.includes(childValue),
          onSelect: handleSelect,
        });
      })}
    </div>
  );
}

export const ToggleGroupItem = React.forwardRef<HTMLButtonElement, ToggleGroupItemProps>(
  ({ className, active, disabled, children, value, onSelect }, ref) => {
    return (
      <Button
        ref={ref as never}
        theme={active ? 'solid' : 'borderless'}
        size="small"
        disabled={disabled}
        className={cn('h-8 w-8', className)}
        onClick={() => onSelect?.(value)}
      >
        {children}
      </Button>
    );
  }
);
ToggleGroupItem.displayName = 'ToggleGroupItem';
