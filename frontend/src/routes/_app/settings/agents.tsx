import { createFileRoute } from '@tanstack/react-router';
import { AgentSettings } from '@/pages/settings';

export const Route = createFileRoute('/_app/settings/agents')({
  component: AgentSettings,
});

