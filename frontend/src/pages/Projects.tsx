import { useNavigate, useRouterState } from '@tanstack/react-router';
import { ProjectList } from '@/components/projects/ProjectList';
import { ProjectDetail } from '@/components/projects/ProjectDetail';

export function Projects() {
  const navigate = useNavigate();
  const projectId = useRouterState({
    select: (s) => {
      for (const match of s.matches as Array<{ params?: Record<string, unknown> }>) {
        const value = match.params?.projectId;
        if (typeof value === 'string' && value.length > 0) return value;
      }
      return undefined;
    },
  });

  const handleBack = () => {
    navigate({ to: '/local-projects' as never });
  };

  if (projectId) {
    return <ProjectDetail projectId={projectId} onBack={handleBack} />;
  }

  return <ProjectList />;
}
