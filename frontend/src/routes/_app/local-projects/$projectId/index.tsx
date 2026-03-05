import { createFileRoute } from '@tanstack/react-router';
import { Projects } from '@/pages/Projects';

export const Route = createFileRoute('/_app/local-projects/$projectId/')({
  component: Projects,
});

