import { WidgetProps } from '@rjsf/utils';
import { Input } from '@douyinfe/semi-ui';

export const TextWidget = (props: WidgetProps) => {
  const {
    id,
    value,
    disabled,
    readonly,
    onChange,
    onBlur,
    onFocus,
    placeholder,
    options,
  } = props;

  const handleChange = (newValue: string) => {
    onChange(newValue === '' ? options.emptyValue : newValue);
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    if (onBlur) {
      onBlur(id, event.target.value);
    }
  };

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    if (onFocus) {
      onFocus(id, event.target.value);
    }
  };

  return (
    <Input
      id={id}
      value={value ?? ''}
      placeholder={placeholder || ''}
      disabled={disabled || readonly}
      onChange={(value) => handleChange(value)}
      onBlur={handleBlur}
      onFocus={handleFocus}
    />
  );
};
