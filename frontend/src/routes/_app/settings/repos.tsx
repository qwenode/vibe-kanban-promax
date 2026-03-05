import { createFileRoute } from '@tanstack/react-router';
import { ReposSettings } from '@/pages/settings';

export const Route = createFileRoute('/_app/settings/repos')({
  component: ReposSettings,
});

