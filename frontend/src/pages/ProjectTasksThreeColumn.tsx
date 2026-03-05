import { useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { Banner, Spin } from '@douyinfe/semi-ui';
import { paths } from '@/lib/paths';
import { openTaskForm } from '@/lib/openTaskForm';
import { useSearch } from '@/contexts/SearchContext';
import { useProject } from '@/contexts/ProjectContext';
import { useNavigateWithSearch } from '@/hooks/useNavigateWithSearch';
import { useProjectTasks } from '@/hooks/useProjectTasks';
import { useTaskAttempts } from '@/hooks/useTaskAttempts';
import { useTaskAttemptWithSession } from '@/hooks/useTaskAttempt';
import { ProjectSidebar } from '@/components/tasks/ProjectSidebar';
import { TaskListPanel } from '@/components/tasks/TaskListPanel';
import { TaskLogStreamPanel } from '@/components/tasks/TaskLogStreamPanel';
import { ClearDoneTasksConfirmationDialog } from '@/components/dialogs/tasks/ClearDoneTasksConfirmationDialog';
import {
  Scope,
  useKeyCreate,
  useKeyExit,
  useKeyFocusSearch,
  useKeyNavDown,
  useKeyNavLeft,
  useKeyNavRight,
  useKeyNavUp,
} from '@/keyboard';
import { useHotkeysContext } from 'react-hotkeys-hook';
import type { TaskStatus, TaskWithAttemptStatus } from 'shared/types';
import { ClickedElementsProvider } from '@/contexts/ClickedElementsProvider';
import { ExecutionProcessesProvider } from '@/contexts/ExecutionProcessesContext';
import { GitOperationsProvider } from '@/contexts/GitOperationsContext';
import { ReviewProvider } from '@/contexts/ReviewProvider';

type Task = TaskWithAttemptStatus;

type AttemptViewMode = 'diffs' | null;

const TASK_STATUSES: TaskStatus[] = [
  'todo',
  'inprogress',
  'inreview',
  'done',
  'cancelled',
];

const normalizeStatus = (status: string): TaskStatus =>
  status.toLowerCase() as TaskStatus;

export function ProjectTasksThreeColumn() {
  const { t } = useTranslation(['tasks', 'common']);
  const navigate = useNavigateWithSearch();
  const routerNavigate = useNavigate();
  const { taskId, attemptId } = useRouterState({
    select: (s) => {
      const last = s.matches[s.matches.length - 1] as
        | { params?: Record<string, unknown> }
        | undefined;
      const params = last?.params ?? {};
      return {
        taskId: typeof params.taskId === 'string' ? params.taskId : undefined,
        attemptId:
          typeof params.attemptId === 'string' ? params.attemptId : undefined,
      };
    },
  });
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const search = useRouterState({
    select: (s) => (s.location.search as Record<string, unknown>) ?? {},
  });
  const { enableScope, disableScope } = useHotkeysContext();

  const {
    projectId,
    isLoading: projectLoading,
    error: projectError,
  } = useProject();
  const { query: searchQuery, focusInput } = useSearch();

  useEffect(() => {
    enableScope(Scope.KANBAN);
    return () => {
      disableScope(Scope.KANBAN);
    };
  }, [disableScope, enableScope]);

  const handleCreateTask = useCallback(
    (initialStatus?: TaskStatus) => {
      if (projectId) {
        openTaskForm({ mode: 'create', projectId, initialStatus });
      }
    },
    [projectId]
  );

  const {
    tasks,
    tasksById,
    isLoading,
    error: streamError,
  } = useProjectTasks(projectId || '');

  const selectedTask = useMemo(
    () => (taskId ? (tasksById[taskId] ?? null) : null),
    [taskId, tasksById]
  );

  useEffect(() => {
    if (!projectId || !taskId || attemptId) return;
    navigate(`${paths.task(projectId, taskId)}/attempts/latest`, {
      replace: true,
    });
  }, [attemptId, navigate, projectId, taskId]);

  const isLatest = attemptId === 'latest';
  const { data: attempts = [], isLoading: isAttemptsLoading } = useTaskAttempts(
    taskId,
    {
      enabled: !!taskId && isLatest,
    }
  );

  const latestAttemptId = useMemo(() => {
    if (!attempts.length) return undefined;
    return [...attempts].sort((a, b) => {
      const diff =
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (diff !== 0) return diff;
      return a.id.localeCompare(b.id);
    })[0].id;
  }, [attempts]);

  useEffect(() => {
    if (!projectId || !taskId || !isLatest || isAttemptsLoading) return;
    if (!latestAttemptId) {
      navigate(paths.task(projectId, taskId), { replace: true });
      return;
    }
    navigate(paths.attempt(projectId, taskId, latestAttemptId), {
      replace: true,
    });
  }, [
    isAttemptsLoading,
    isLatest,
    latestAttemptId,
    navigate,
    projectId,
    taskId,
  ]);

  useEffect(() => {
    if (!projectId || !taskId || isLoading) return;
    if (selectedTask === null) {
      navigate(`/local-projects/${projectId}/tasks`, { replace: true });
    }
  }, [projectId, taskId, isLoading, selectedTask, navigate]);

  const effectiveAttemptId = attemptId === 'latest' ? undefined : attemptId;
  const { data: attempt } = useTaskAttemptWithSession(effectiveAttemptId);

  const searchParams = useMemo(() => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(search)) {
      if (typeof v === 'string') params.set(k, v);
    }
    return params;
  }, [search]);

  const rawView = searchParams.get('view') as AttemptViewMode | null;
  const mode: AttemptViewMode = rawView === 'diffs' ? 'diffs' : null;

  const replaceSearchParams = useCallback(
    (params: URLSearchParams) => {
      routerNavigate({
        to: pathname as never,
        search: Object.fromEntries(params.entries()) as never,
        replace: true,
      } as never);
    },
    [routerNavigate, pathname]
  );

  const setMode = useCallback(
    (newMode: AttemptViewMode) => {
      const params = new URLSearchParams(searchParams);
      if (newMode === null) {
        params.delete('view');
      } else {
        params.set('view', newMode);
      }
      replaceSearchParams(params);
    },
    [searchParams, replaceSearchParams]
  );

  const hasSearch = Boolean(searchQuery.trim());
  const normalizedSearch = searchQuery.trim().toLowerCase();

  const columns = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      todo: [],
      inprogress: [],
      inreview: [],
      done: [],
      cancelled: [],
    };

    const matchesSearch = (title: string, description?: string | null) => {
      if (!hasSearch) return true;
      const lowerTitle = title.toLowerCase();
      const lowerDescription = description?.toLowerCase() ?? '';
      return (
        lowerTitle.includes(normalizedSearch) ||
        lowerDescription.includes(normalizedSearch)
      );
    };

    tasks.forEach((task) => {
      const statusKey = normalizeStatus(task.status);
      if (!matchesSearch(task.title, task.description)) return;
      grouped[statusKey].push(task);
    });

    TASK_STATUSES.forEach((status) => {
      grouped[status].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

    return grouped;
  }, [hasSearch, normalizedSearch, tasks]);

  const doneTasks = useMemo(() => columns.done, [columns.done]);

  const handleClearDoneTasks = useCallback(async () => {
    if (doneTasks.length === 0) return;
    try {
      await ClearDoneTasksConfirmationDialog.show({ tasks: doneTasks });
    } catch {
      // User cancelled dialog.
    }
  }, [doneTasks]);

  const handleViewTaskDetails = useCallback(
    (task: Task, attemptIdToShow?: string) => {
      if (!projectId) return;
      if (attemptIdToShow) {
        navigate(paths.attempt(projectId, task.id, attemptIdToShow));
      } else {
        navigate(`${paths.task(projectId, task.id)}/attempts/latest`);
      }
    },
    [navigate, projectId]
  );

  const selectNextTask = useCallback(() => {
    if (!selectedTask) {
      for (const status of TASK_STATUSES) {
        const list = columns[status];
        if (list.length > 0) {
          handleViewTaskDetails(list[0]);
          break;
        }
      }
      return;
    }

    const statusKey = normalizeStatus(selectedTask.status);
    const list = columns[statusKey];
    const currentIndex = list.findIndex((task) => task.id === selectedTask.id);
    if (currentIndex >= 0 && currentIndex < list.length - 1) {
      handleViewTaskDetails(list[currentIndex + 1]);
    }
  }, [columns, handleViewTaskDetails, selectedTask]);

  const selectPreviousTask = useCallback(() => {
    if (!selectedTask) {
      for (const status of TASK_STATUSES) {
        const list = columns[status];
        if (list.length > 0) {
          handleViewTaskDetails(list[0]);
          break;
        }
      }
      return;
    }

    const statusKey = normalizeStatus(selectedTask.status);
    const list = columns[statusKey];
    const currentIndex = list.findIndex((task) => task.id === selectedTask.id);
    if (currentIndex > 0) {
      handleViewTaskDetails(list[currentIndex - 1]);
    }
  }, [columns, handleViewTaskDetails, selectedTask]);

  const selectNextColumn = useCallback(() => {
    if (!selectedTask) return;
    const currentStatus = normalizeStatus(selectedTask.status);
    const currentIndex = TASK_STATUSES.indexOf(currentStatus);
    for (let index = currentIndex + 1; index < TASK_STATUSES.length; index += 1) {
      const list = columns[TASK_STATUSES[index]];
      if (list.length > 0) {
        handleViewTaskDetails(list[0]);
        return;
      }
    }
  }, [columns, handleViewTaskDetails, selectedTask]);

  const selectPreviousColumn = useCallback(() => {
    if (!selectedTask) return;
    const currentStatus = normalizeStatus(selectedTask.status);
    const currentIndex = TASK_STATUSES.indexOf(currentStatus);
    for (let index = currentIndex - 1; index >= 0; index -= 1) {
      const list = columns[TASK_STATUSES[index]];
      if (list.length > 0) {
        handleViewTaskDetails(list[0]);
        return;
      }
    }
  }, [columns, handleViewTaskDetails, selectedTask]);

  useKeyCreate(() => handleCreateTask(), {
    scope: Scope.KANBAN,
    preventDefault: true,
  });

  useKeyFocusSearch(
    () => {
      focusInput();
    },
    { scope: Scope.KANBAN, preventDefault: true }
  );

  useKeyExit(
    () => {
      if (projectId) {
        navigate(`/local-projects/${projectId}/tasks`, { replace: true });
      } else {
        navigate('/local-projects');
      }
    },
    { scope: Scope.KANBAN }
  );

  useKeyNavUp(() => selectPreviousTask(), {
    scope: Scope.KANBAN,
    preventDefault: true,
  });
  useKeyNavDown(() => selectNextTask(), {
    scope: Scope.KANBAN,
    preventDefault: true,
  });
  useKeyNavLeft(() => selectPreviousColumn(), {
    scope: Scope.KANBAN,
    preventDefault: true,
  });
  useKeyNavRight(() => selectNextColumn(), {
    scope: Scope.KANBAN,
    preventDefault: true,
  });

  const isInitialTasksLoad = isLoading && tasks.length === 0;
  if (projectError) {
    return (
      <div className="p-4">
        <Banner
          type="danger"
          fullMode={false}
          icon={<AlertTriangle size={16} />}
          title={t('common:states.error')}
          description={projectError.message || 'Failed to load project'}
        />
      </div>
    );
  }
  if (projectLoading && isInitialTasksLoad) {
    return (
      <div className="py-8 flex items-center justify-center">
        <Spin />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {streamError && (
        <Banner
          className="w-full z-20"
          type="warning"
          fullMode={false}
          icon={<AlertTriangle size={16} />}
          title={t('common:states.reconnecting')}
          description={streamError}
        />
      )}

      <div className="grid h-full min-h-0 grid-cols-1 xl:grid-cols-[240px_380px_minmax(0,1fr)]">
        <ProjectSidebar />
        <TaskListPanel
          columns={columns}
          selectedTaskId={selectedTask?.id}
          projectId={projectId ?? ''}
          onSelectTask={handleViewTaskDetails}
          onCreateTask={handleCreateTask}
          onClearDoneTasks={handleClearDoneTasks}
          canClearDoneTasks={doneTasks.length > 0}
        />
        <GitOperationsProvider attemptId={attempt?.id}>
          <ClickedElementsProvider attempt={attempt}>
            <ReviewProvider attemptId={attempt?.id}>
              <ExecutionProcessesProvider
                attemptId={attempt?.id}
                sessionId={attempt?.session?.id}
              >
                <TaskLogStreamPanel
                  selectedTask={selectedTask}
                  attempt={attempt}
                  mode={mode}
                  onModeChange={setMode}
                />
              </ExecutionProcessesProvider>
            </ReviewProvider>
          </ClickedElementsProvider>
        </GitOperationsProvider>
      </div>
    </div>
  );
}
