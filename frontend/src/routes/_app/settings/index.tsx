import { createFileRoute } from '@tanstack/react-router';
import { GeneralSettings } from '@/pages/settings';

export const Route = createFileRoute('/_app/settings/')({
  component: GeneralSettings,
});

