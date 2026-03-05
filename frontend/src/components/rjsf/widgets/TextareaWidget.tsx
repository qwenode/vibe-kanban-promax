import { WidgetProps } from '@rjsf/utils';
import TextArea from '@douyinfe/semi-ui/lib/es/input/textarea';

export const TextareaWidget = (props: WidgetProps) => {
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
    schema,
  } = props;

  const handleChange = (newValue: string) => {
    onChange(newValue === '' ? options.emptyValue : newValue);
  };

  const handleBlur = (event: React.FocusEvent<HTMLTextAreaElement>) => {
    if (onBlur) {
      onBlur(id, event.target.value);
    }
  };

  const handleFocus = (event: React.FocusEvent<HTMLTextAreaElement>) => {
    if (onFocus) {
      onFocus(id, event.target.value);
    }
  };

  // Get rows from ui:options or default based on field name
  const rows =
    options.rows ||
    ((schema.title || '').toLowerCase().includes('prompt') ? 4 : 3);

  return (
    <TextArea
      id={id}
      value={value ?? ''}
      placeholder={placeholder || ''}
      disabled={disabled || readonly}
      onChange={(value) => handleChange(String(value))}
      onBlur={handleBlur}
      onFocus={handleFocus}
      rows={rows}
      className="resize-vertical"
    />
  );
};
