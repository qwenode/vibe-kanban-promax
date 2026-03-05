import { createFileRoute } from '@tanstack/react-router';
import { FullAttemptLogsPage } from '@/pages/FullAttemptLogs';

export const Route = createFileRoute(
  '/local-projects/$projectId/tasks/$taskId/attempts/$attemptId/full'
)({
  component: FullAttemptLogsPage,
});

