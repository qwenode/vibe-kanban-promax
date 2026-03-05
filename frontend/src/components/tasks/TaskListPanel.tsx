import { useCallback } from 'react';
import { Link, Loader2, Plus, Trash2, XCircle } from 'lucide-react';
import type { TaskStatus, TaskWithAttemptStatus } from 'shared/types';
import { Button } from '@douyinfe/semi-ui';
import { cn } from '@/lib/utils';
import { ActionsDropdown } from '@/components/ui/actions-dropdown';
import { attemptsApi } from '@/lib/api';
import { paths } from '@/lib/paths';
import { useNavigateWithSearch } from '@/hooks';
import { statusLabels } from '@/utils/statusLabels';

type Task = TaskWithAttemptStatus;

const TASK_STATUSES: TaskStatus[] = [
  'todo',
  'inprogress',
  'inreview',
  'done',
  'cancelled',
];

const STATUS_DOT_CLASSES: Record<TaskStatus, string> = {
  todo: 'bg-neutral-400',
  inprogress: 'bg-sky-500',
  inreview: 'bg-amber-500',
  done: 'bg-emerald-500',
  cancelled: 'bg-red-500',
};

interface TaskListPanelProps {
  columns: Record<TaskStatus, Task[]>;
  selectedTaskId?: string;
  projectId: string;
  onSelectTask: (task: Task) => void;
  onCreateTask: (status?: TaskStatus) => void;
  onClearDoneTasks: () => void;
  canClearDoneTasks: boolean;
}

function TaskRow({
  task,
  isSelected,
  projectId,
  onSelectTask,
}: {
  task: Task;
  isSelected: boolean;
  projectId: string;
  onSelectTask: (task: Task) => void;
}) {
  const navigate = useNavigateWithSearch();

  const handleParentClick = useCallback(
    async (event: React.MouseEvent) => {
      event.stopPropagation();
      if (!task.parent_workspace_id) return;

      try {
        const parentAttempt = await attemptsApi.get(task.parent_workspace_id);
        navigate(paths.attempt(projectId, parentAttempt.task_id, parentAttempt.id));
      } catch (error) {
        console.error('Failed to navigate to parent attempt:', error);
      }
    },
    [task.parent_workspace_id, navigate, projectId]
  );

  return (
    <div
      role="button"
      tabIndex={0}
      aria-selected={isSelected}
      className={cn(
        'group relative rounded-md border px-3 py-2 text-left transition-colors',
        'cursor-pointer bg-background hover:bg-accent/60 hover:border-border/80',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
        isSelected && 'border-primary/55 bg-accent'
      )}
      onClick={() => onSelectTask(task)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelectTask(task);
        }
      }}
    >
      <span
        className={cn(
          'absolute left-0 top-2 bottom-2 w-1 rounded-r bg-primary transition-opacity',
          isSelected ? 'opacity-100' : 'opacity-0'
        )}
        aria-hidden="true"
      />
      <div className="mb-1 flex items-start gap-2">
        <p className="line-clamp-2 flex-1 text-sm font-medium">{task.title}</p>
        <div className="flex shrink-0 items-center gap-1">
          {task.has_in_progress_attempt && (
            <Loader2 className="h-4 w-4 animate-spin text-sky-500" />
          )}
          {task.last_attempt_failed && (
            <XCircle className="h-4 w-4 text-destructive" />
          )}
          {task.parent_workspace_id && (
            <Button
              theme="borderless"
              size="small"
              onClick={handleParentClick}
              onPointerDown={(event) => event.stopPropagation()}
              onMouseDown={(event) => event.stopPropagation()}
              aria-label="Open parent attempt"
            >
              <Link className="h-3.5 w-3.5" />
            </Button>
          )}
          <ActionsDropdown task={task} />
        </div>
      </div>
      {task.description ? (
        <p className="line-clamp-2 text-xs text-muted-foreground">
          {task.description}
        </p>
      ) : null}
    </div>
  );
}

export function TaskListPanel({
  columns,
  selectedTaskId,
  projectId,
  onSelectTask,
  onCreateTask,
  onClearDoneTasks,
  canClearDoneTasks,
}: TaskListPanelProps) {
  return (
    <section className="h-full min-h-0 border-r bg-background">
      <div className="flex h-12 items-center justify-between border-b px-3">
        <p className="text-sm font-medium">任务</p>
        <Button
          theme="borderless"
          size="small"
          onClick={() => onCreateTask()}
          aria-label="Create task"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="h-[calc(100%-3rem)] space-y-3 overflow-y-auto p-3">
        {TASK_STATUSES.map((status) => {
          const tasks = columns[status] ?? [];
          return (
            <div key={status} className="rounded-md border bg-muted/20 p-2">
              <div className="flex items-center gap-2 pb-2">
                <span
                  className={cn('h-2 w-2 rounded-full', STATUS_DOT_CLASSES[status])}
                  aria-hidden="true"
                />
                <p className="text-xs font-semibold text-foreground/80">
                  {statusLabels[status]}
                </p>
                <span className="text-xs text-muted-foreground">{tasks.length}</span>
                <div className="ml-auto flex items-center gap-1">
                  {status === 'done' && (
                    <Button
                      theme="borderless"
                      size="small"
                      onClick={onClearDoneTasks}
                      disabled={!canClearDoneTasks}
                      aria-label="Clear done tasks"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button
                    theme="borderless"
                    size="small"
                    onClick={() => onCreateTask(status)}
                    aria-label={`Create ${statusLabels[status]} task`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              {tasks.length === 0 ? (
                <div className="rounded-md border border-dashed bg-background/60 px-3 py-4 text-center text-xs text-muted-foreground">
                  暂无任务
                </div>
              ) : (
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      isSelected={selectedTaskId === task.id}
                      projectId={projectId}
                      onSelectTask={onSelectTask}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
