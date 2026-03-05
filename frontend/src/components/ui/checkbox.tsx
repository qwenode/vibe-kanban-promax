import * as React from 'react';
import { cn } from '@/lib/utils';
import { Checkbox as SemiCheckbox } from '@douyinfe/semi-ui';

interface CheckboxProps {
  id?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
}

const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  (
    { className, checked = false, onCheckedChange, disabled, ...props },
    ref
  ) => {
    return (
      <SemiCheckbox
        {...(props as unknown as Record<string, unknown>)}
        ref={ref as never}
        disabled={disabled}
        checked={checked}
        onChange={(e) => onCheckedChange?.(Boolean(e.target.checked))}
        className={cn(className)}
      />
    );
  }
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };
