import { WidgetProps } from '@rjsf/utils';
import { Select } from '@douyinfe/semi-ui';

export const SelectWidget = (props: WidgetProps) => {
  const {
    id,
    value,
    disabled,
    readonly,
    onChange,
    onBlur,
    onFocus,
    options,
    schema,
    placeholder,
  } = props;

  const { enumOptions } = options;

  const handleChange = (newValue: string) => {
    // Handle nullable enum values - '__null__' means null for nullable types
    const finalValue = newValue === '__null__' ? options.emptyValue : newValue;
    onChange(finalValue);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && onBlur) {
      onBlur(id, value);
    }
    if (open && onFocus) {
      onFocus(id, value);
    }
  };

  // Convert enumOptions to the format expected by our Select component
  const selectOptions = enumOptions || [];

  // Handle nullable types by adding a null option and filtering out null from enumOptions
  // (schema has null in both type and enum, but String(null) breaks validation)
  const isNullable = Array.isArray(schema.type) && schema.type.includes('null');
  const allOptions = isNullable
    ? [
        { value: '__null__', label: 'Not specified' },
        ...selectOptions.filter((opt) => opt.value !== null),
      ]
    : selectOptions;

  return (
    <Select
      id={id}
      value={value === null ? '__null__' : (value ?? '')}
      onChange={(newValue) => handleChange(String(newValue))}
      onDropdownVisibleChange={handleOpenChange}
      disabled={disabled || readonly}
      placeholder={placeholder || 'Select an option...'}
      optionList={allOptions.map((option) => ({
        value: String(option.value),
        label: option.label,
      }))}
    />
  );
};
