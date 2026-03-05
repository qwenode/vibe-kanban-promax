import {
  createContext,
  useContext,
  ReactNode,
  useMemo,
  useEffect,
} from 'react';
import { useRouterState } from '@tanstack/react-router';
import type { Project } from 'shared/types';
import { useProjects } from '@/hooks/useProjects';

interface ProjectContextValue {
  projectId: string | undefined;
  project: Project | undefined;
  isLoading: boolean;
  error: Error | null;
  isError: boolean;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

interface ProjectProviderProps {
  children: ReactNode;
}

export function ProjectProvider({ children }: ProjectProviderProps) {
  const projectId = useRouterState({
    select: (s) => {
      for (const match of s.matches as Array<{ params?: Record<string, unknown> }>) {
        const value = match.params?.projectId;
        if (typeof value === 'string' && value.length > 0) return value;
      }
      return undefined;
    },
  });

  const { projectsById, isLoading, error } = useProjects();
  const project = projectId ? projectsById[projectId] : undefined;

  const value = useMemo(
    () => ({
      projectId,
      project,
      isLoading,
      error,
      isError: !!error,
    }),
    [projectId, project, isLoading, error]
  );

  // Centralized page title management
  useEffect(() => {
    if (project) {
      document.title = `${project.name} | vibe-kanban`;
    } else {
      document.title = 'vibe-kanban';
    }
  }, [project]);

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
}

export function useProject(): ProjectContextValue {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
