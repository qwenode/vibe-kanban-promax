import * as React from 'react';

import { cn } from '@/lib/utils';
import TextArea from '@douyinfe/semi-ui/lib/es/input/textarea';

export type TextareaProps = Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  'onChange' | 'value' | 'defaultValue'
> & {
  value?: string;
  defaultValue?: string;
  /**
   * Legacy React Textarea API: `onChange(e)`
   */
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  /**
   * Semi TextArea API: `onValueChange(value)`
   */
  onValueChange?: (value: string) => void;
};

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, onChange, onValueChange, ...props }, ref) => {
  return (
    <TextArea
      {...(props as unknown as Record<string, unknown>)}
      ref={ref as never}
      onChange={(value: string, e: unknown) => {
        onValueChange?.(value);
        // Best-effort compatibility for callsites expecting `e.target.value`
        if (onChange) onChange(e as React.ChangeEvent<HTMLTextAreaElement>);
      }}
      className={cn(className)}
    />
  );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
