import { createFileRoute } from '@tanstack/react-router';
import { ProjectTasksThreeColumn } from '@/pages/ProjectTasksThreeColumn';

export const Route = createFileRoute('/_app/local-projects/$projectId/tasks/')({
  component: ProjectTasksThreeColumn,
});

