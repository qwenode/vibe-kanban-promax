import { useCallback } from 'react';
import { useRouterState } from '@tanstack/react-router';
import { IconPlus } from '@douyinfe/semi-icons';
import { Button, Empty, Nav, Spin } from '@douyinfe/semi-ui';
import { useProjects } from '@/hooks/useProjects';
import { useProject } from '@/contexts/ProjectContext';
import { ProjectFormDialog } from '@/components/dialogs/projects/ProjectFormDialog';
import { useNavigateWithSearch } from '@/hooks/useNavigateWithSearch';

export function ProjectSidebar() {
  const navigate = useNavigateWithSearch();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { projectId } = useProject();
  const { projects, isLoading } = useProjects();

  const handleOpenProject = useCallback(
    (nextProjectId: string) => {
      const pathMatch = pathname.match(/^\/local-projects\/[^/]+(\/.*)?$/);
      const suffix = pathMatch?.[1] ?? '/tasks';
      const targetSuffix = suffix.startsWith('/tasks') ? suffix : '/tasks';
      navigate(`/local-projects/${nextProjectId}${targetSuffix}`);
    },
    [navigate, pathname]
  );

  const handleCreateProject = useCallback(async () => {
    try {
      await ProjectFormDialog.show({});
    } catch {
      // User cancelled dialog.
    }
  }, []);

  return (
    <aside className="h-full min-h-0 border-r bg-background">
      <div className="flex h-12 items-center justify-between border-b px-3">
        <div className="text-sm font-medium">项目</div>
        <Button
          theme="borderless"
          icon={<IconPlus />}
          onClick={handleCreateProject}
          aria-label="Create project"
        />
      </div>

      <div className="h-[calc(100%-3rem)] overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Spin />
          </div>
        ) : projects.length === 0 ? (
          <Empty
            image={null}
            description="暂无项目"
            style={{ padding: 12 }}
          />
        ) : (
          <Nav
            mode="vertical"
            style={{ maxWidth: '100%' }}
            selectedKeys={projectId ? [projectId] : []}
            items={projects.map((project) => ({
              itemKey: project.id,
              text: project.name,
            }))}
            onSelect={({ itemKey }) => handleOpenProject(String(itemKey))}
          />
        )}
      </div>
    </aside>
  );
}
