import { WidgetProps } from '@rjsf/utils';
import { Checkbox } from '@douyinfe/semi-ui';

export const CheckboxWidget = (props: WidgetProps) => {
  const { id, value, disabled, readonly, onChange } = props;

  const handleChange = (checked: boolean) => {
    onChange(checked);
  };

  const checked = Boolean(value);

  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        id={id}
        checked={checked}
        onChange={(e) => handleChange(Boolean(e.target.checked))}
        disabled={disabled || readonly}
      />
    </div>
  );
};
