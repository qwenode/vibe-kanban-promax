import { createFileRoute } from '@tanstack/react-router';
import { McpSettings } from '@/pages/settings';

export const Route = createFileRoute('/_app/settings/mcp')({
  component: McpSettings,
});

