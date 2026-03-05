import { Bot, ArrowDown } from 'lucide-react';
import { Select, Typography } from '@douyinfe/semi-ui';
import type { ExecutorProfileId, BaseCodingAgent } from 'shared/types';

interface AgentSelectorProps {
  profiles: Record<string, Record<string, unknown>> | null;
  selectedExecutorProfile: ExecutorProfileId | null;
  onChange: (profile: ExecutorProfileId) => void;
  disabled?: boolean;
  className?: string;
  showLabel?: boolean;
}

export function AgentSelector({
  profiles,
  selectedExecutorProfile,
  onChange,
  disabled,
  className = '',
  showLabel = false,
}: AgentSelectorProps) {
  const agents = profiles
    ? (Object.keys(profiles).sort() as BaseCodingAgent[])
    : [];
  const selectedAgent = selectedExecutorProfile?.executor;

  if (!profiles) return null;

  return (
    <div className="flex-1">
      {showLabel && (
        <Typography.Text className="text-sm font-medium">
          Agent
        </Typography.Text>
      )}
      <Select
        value={selectedAgent}
        disabled={disabled || agents.length === 0}
        className={`w-full text-xs ${showLabel ? 'mt-1.5' : ''} ${className}`}
        suffix={<ArrowDown className="h-3 w-3" />}
        prefix={<Bot className="h-3 w-3" />}
        placeholder="Agent"
        optionList={agents.map((agent) => ({ value: agent, label: agent }))}
        onChange={(value) => {
          onChange({
            executor: value as BaseCodingAgent,
            variant: null,
          });
        }}
      />
    </div>
  );
}
