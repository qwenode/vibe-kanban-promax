import { Link, useRouterState } from '@tanstack/react-router';
import { useCallback } from 'react';
import { Button, Dropdown, Select } from '@douyinfe/semi-ui';
import {
  FolderOpen,
  Settings,
  BookOpen,
  MessageCircleQuestion,
  MessageCircle,
  Menu,
  Plus,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { SearchBar } from '@/components/SearchBar';
import { useSearch } from '@/contexts/SearchContext';
import { openTaskForm } from '@/lib/openTaskForm';
import { useProject } from '@/contexts/ProjectContext';
import { useOpenProjectInEditor } from '@/hooks/useOpenProjectInEditor';
import { OpenInIdeButton } from '@/components/ide/OpenInIdeButton';
import { useProjectRepos } from '@/hooks';
import { useProjects } from '@/hooks/useProjects';
import { useNavigateWithSearch } from '@/hooks/useNavigateWithSearch';

const INTERNAL_NAV = [
  { label: 'Projects', icon: FolderOpen, to: '/local-projects' },
];

const EXTERNAL_LINKS = [
  {
    label: 'Docs',
    icon: BookOpen,
    href: 'https://vibekanban.com/docs',
  },
  {
    label: 'Support',
    icon: MessageCircleQuestion,
    href: 'https://github.com/BloopAI/vibe-kanban/issues',
  },
  {
    label: 'Discord',
    icon: MessageCircle,
    href: 'https://discord.gg/AC4nwVtJM3',
  },
];

function NavDivider() {
  return (
    <div
      className="mx-2 h-6 w-px bg-border/60"
      role="separator"
      aria-orientation="vertical"
    />
  );
}

export function Navbar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigateWithSearch();
  const { projectId, project } = useProject();
  const { query, setQuery, active, clear, registerInputRef } = useSearch();
  const handleOpenInEditor = useOpenProjectInEditor(project || null);
  const { projects } = useProjects();

  const { data: repos } = useProjectRepos(projectId);
  const isSingleRepoProject = repos?.length === 1;

  const setSearchBarRef = useCallback(
    (node: HTMLInputElement | null) => {
      registerInputRef(node);
    },
    [registerInputRef]
  );

  const handleCreateTask = () => {
    if (projectId) {
      openTaskForm({ mode: 'create', projectId });
    }
  };

  const handleOpenInIDE = () => {
    handleOpenInEditor();
  };

  const handleProjectSwitch = useCallback(
    (nextProjectId: string) => {
      if (!nextProjectId || nextProjectId === projectId) {
        return;
      }

      const pathMatch = pathname.match(/^\/local-projects\/[^/]+(\/.*)?$/);
      if (pathMatch) {
        const suffix = pathMatch[1] ?? '';
        if (suffix.startsWith('/tasks')) {
          navigate(`/local-projects/${nextProjectId}/tasks`);
          return;
        }

        navigate(`/local-projects/${nextProjectId}`);
        return;
      }

      navigate(`/local-projects/${nextProjectId}/tasks`);
    },
    [navigate, pathname, projectId]
  );

  return (
    <div className="border-b bg-background">
      <div className="w-full px-3">
        <div className="flex items-center h-12 py-2">
          <div className="flex-1 flex items-center">
            <Link to="/local-projects">
              <Logo />
            </Link>
            <div className="ml-3 w-44 sm:w-64">
              <Select
                style={{ width: '100%' }}
                value={projectId ?? undefined}
                placeholder="Select project"
                optionList={projects.map((item) => ({
                  value: item.id,
                  label: item.name,
                }))}
                onChange={(value) => {
                  if (typeof value === 'string') {
                    handleProjectSwitch(value);
                  }
                }}
              />
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <SearchBar
              ref={setSearchBarRef}
              className="shrink-0"
              value={query}
              onChange={setQuery}
              disabled={!active}
              onClear={clear}
              project={project || null}
            />
          </div>

          <div className="flex flex-1 items-center justify-end gap-1">
            {projectId ? (
              <>
                <div className="flex items-center gap-1">
                  <Button
                    theme="borderless"
                    noHorizontalPadding
                    onClick={handleCreateTask}
                    aria-label="Create new task"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  {isSingleRepoProject && (
                    <OpenInIdeButton
                      onClick={handleOpenInIDE}
                      className="h-9 w-9"
                    />
                  )}
                </div>
                <NavDivider />
              </>
            ) : null}

            <div className="flex items-center gap-1">
              <Button
                theme="borderless"
                noHorizontalPadding
                aria-label="Settings"
                onClick={() =>
                  navigate((projectId ? '/settings/projects' : '/settings') as never)
                }
              >
                <Settings className="h-4 w-4" />
              </Button>

              <Dropdown
                trigger="click"
                position="bottomRight"
                render={
                  <Dropdown.Menu>
                    {INTERNAL_NAV.map((item) => {
                      const active = pathname.startsWith(item.to);
                      const Icon = item.icon;
                      return (
                        <Dropdown.Item
                          key={item.to}
                          className={active ? 'bg-accent' : ''}
                          onClick={() => navigate(item.to as never)}
                        >
                          <Icon className="mr-2 h-4 w-4" />
                          {item.label}
                        </Dropdown.Item>
                      );
                    })}
                    <Dropdown.Divider />
                    {EXTERNAL_LINKS.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Dropdown.Item
                          key={item.href}
                          onClick={() => window.open(item.href, '_blank', 'noopener,noreferrer')}
                        >
                          <Icon className="mr-2 h-4 w-4" />
                          {item.label}
                        </Dropdown.Item>
                      );
                    })}
                  </Dropdown.Menu>
                }
              >
                <Button
                  theme="borderless"
                  noHorizontalPadding
                  aria-label="Main navigation"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              </Dropdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
