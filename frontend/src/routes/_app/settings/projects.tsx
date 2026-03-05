import { createFileRoute } from '@tanstack/react-router';
import { ProjectSettings } from '@/pages/settings';

export const Route = createFileRoute('/_app/settings/projects')({
  component: ProjectSettings,
});

