import * as React from 'react';
import TextArea from '@douyinfe/semi-ui/lib/es/input/textarea';
import type { TextAreaProps } from '@douyinfe/semi-ui/lib/es/input/textarea';

interface AutoExpandingTextareaProps
  extends Omit<
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    'onChange' | 'value' | 'defaultValue' | 'disabled' | 'readOnly'
  > {
  maxRows?: number;
  disableInternalScroll?: boolean;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  readOnly?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onValueChange?: (value: string) => void;
  validateStatus?: TextAreaProps['validateStatus'];
}

const AutoExpandingTextarea = React.forwardRef<
  HTMLTextAreaElement,
  AutoExpandingTextareaProps
>(
  (
    {
      maxRows = 10,
      disableInternalScroll = false,
      onChange,
      onValueChange,
      ...props
    },
    ref
  ) => {
    return (
      <TextArea
        {...(props as unknown as TextAreaProps)}
        ref={ref as never}
        autosize={disableInternalScroll ? true : { maxRows }}
        onChange={(value: string, e: unknown) => {
          onValueChange?.(value);
          if (onChange) onChange(e as React.ChangeEvent<HTMLTextAreaElement>);
        }}
      />
    );
  }
);

AutoExpandingTextarea.displayName = 'AutoExpandingTextarea';

export { AutoExpandingTextarea };
