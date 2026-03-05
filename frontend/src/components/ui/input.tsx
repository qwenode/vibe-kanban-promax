import * as React from 'react';
import { cn } from '@/lib/utils';
import { Input as SemiInput } from '@douyinfe/semi-ui';
import type { InputProps as SemiInputProps } from '@douyinfe/semi-ui/lib/es/input';

export type InputProps = Omit<
  SemiInputProps,
  'onChange' | 'onKeyDown' | 'value' | 'defaultValue' | 'type' | 'className'
> & {
  value?: string;
  defaultValue?: string;
  type?: string;
  className?: string;
  onCommandEnter?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onCommandShiftEnter?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  /**
   * Semi Input's native callback shape is `(value, e)`.
   * For compatibility, we keep `onChange(e)` and also offer `onValueChange(value)`.
   */
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onValueChange?: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      onChange,
      onKeyDown,
      onCommandEnter,
      onCommandShiftEnter,
      onValueChange,
      ...props
    },
    ref
  ) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        e.currentTarget.blur();
      }
      if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
        if (e.metaKey && e.shiftKey) {
          onCommandShiftEnter?.(e);
        } else {
          onCommandEnter?.(e);
        }
      }
      onKeyDown?.(e);
    };

    return (
      <SemiInput
        {...props}
        ref={ref as never}
        type={type}
        onChange={(value, e) => {
          onValueChange?.(value);
          onChange?.(e);
        }}
        onKeyDown={handleKeyDown}
        className={cn(className)}
      />
    );
  }
);

Input.displayName = 'Input';
export { Input };
