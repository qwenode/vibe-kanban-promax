import { Settings2, ArrowDown } from 'lucide-react';
import { Select, Typography } from '@douyinfe/semi-ui';
import type { ExecutorProfileId } from 'shared/types';

interface ConfigSelectorProps {
  profiles: Record<string, Record<string, unknown>> | null;
  selectedExecutorProfile: ExecutorProfileId | null;
  onChange: (profile: ExecutorProfileId) => void;
  disabled?: boolean;
  className?: string;
  showLabel?: boolean;
}

export function ConfigSelector({
  profiles,
  selectedExecutorProfile,
  onChange,
  disabled,
  className = '',
  showLabel = false,
}: ConfigSelectorProps) {
  const selectedAgent = selectedExecutorProfile?.executor;
  const configs = selectedAgent && profiles ? profiles[selectedAgent] : null;
  const configOptions = configs ? Object.keys(configs).sort() : [];
  const selectedVariant = selectedExecutorProfile?.variant || 'DEFAULT';

  if (
    !selectedAgent ||
    !profiles ||
    !configs ||
    Object.keys(configs).length === 0
  )
    return null;

  return (
    <div className="flex-1">
      {showLabel && (
        <Typography.Text className="text-sm font-medium">
          Configuration
        </Typography.Text>
      )}
      <Select
        value={selectedVariant}
        disabled={disabled}
        className={`w-full text-xs ${showLabel ? 'mt-1.5' : ''} ${className}`}
        suffix={<ArrowDown className="h-3 w-3" />}
        prefix={<Settings2 className="h-3 w-3" />}
        optionList={configOptions.map((variant) => ({
          value: variant,
          label: variant,
        }))}
        onChange={(value) => {
          const picked = String(value);
          onChange({
            executor: selectedAgent,
            variant: picked === 'DEFAULT' ? null : picked,
          });
        }}
      />
    </div>
  );
}
