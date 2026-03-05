import * as React from 'react';
import { cn } from '@/lib/utils';
import { Switch as SemiSwitch } from '@douyinfe/semi-ui';
import type { SwitchProps as SemiSwitchProps } from '@douyinfe/semi-ui/lib/es/switch';

export type SwitchProps = Omit<SemiSwitchProps, 'onChange'> & {
  onCheckedChange?: (checked: boolean) => void;
  onChange?: SemiSwitchProps['onChange'];
};

const Switch = React.forwardRef<unknown, SwitchProps>(
  ({ className, onCheckedChange, onChange, ...props }, ref) => {
    return (
      <SemiSwitch
        ref={ref as never}
        className={cn(className)}
        {...props}
        onChange={(checked, e) => {
          onChange?.(checked, e);
          onCheckedChange?.(checked);
        }}
      />
    );
  }
);
Switch.displayName = 'Switch';

export { Switch };
