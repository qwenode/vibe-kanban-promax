import { memo } from 'react';
import {
  type DragEndEvent,
  KanbanBoard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
} from '@/components/ui/shadcn-io/kanban';
import { TaskCard } from './TaskCard';
import type { TaskStatus, TaskWithAttemptStatus } from 'shared/types';
import { statusBoardColors, statusLabels } from '@/utils/statusLabels';

export type KanbanColumns = Record<TaskStatus, TaskWithAttemptStatus[]>;

interface TaskKanbanBoardProps {
  columns: KanbanColumns;
  onDragEnd: (event: DragEndEvent) => void;
  onViewTaskDetails: (task: TaskWithAttemptStatus) => void;
  selectedTaskId?: string;
  onCreateTask?: (status: TaskStatus) => void;
  onClearDoneTasks?: () => void;
  canClearDoneTasks?: boolean;
  projectId: string;
}

function renderColumn(
  statusKey: TaskStatus,
  tasks: TaskWithAttemptStatus[],
  {
    onCreateTask,
    onClearDoneTasks,
    canClearDoneTasks,
    onViewTaskDetails,
    selectedTaskId,
    projectId,
  }: Pick<
    TaskKanbanBoardProps,
    | 'onCreateTask'
    | 'onClearDoneTasks'
    | 'canClearDoneTasks'
    | 'onViewTaskDetails'
    | 'selectedTaskId'
    | 'projectId'
  >,
) {
  return (
    <KanbanBoard key={statusKey} id={statusKey}>
      <KanbanHeader
        name={statusLabels[statusKey]}
        color={statusBoardColors[statusKey]}
        onAddTask={() => onCreateTask?.(statusKey)}
        onClearColumn={statusKey === 'done' ? onClearDoneTasks : undefined}
        clearDisabled={statusKey === 'done' ? !canClearDoneTasks : false}
      />
      <KanbanCards>
        {tasks.map((task, index) => (
          <TaskCard
            key={task.id}
            task={task}
            index={index}
            status={statusKey}
            onViewDetails={onViewTaskDetails}
            isOpen={selectedTaskId === task.id}
            projectId={projectId}
          />
        ))}
      </KanbanCards>
    </KanbanBoard>
  );
}

function TaskKanbanBoard({
  columns,
  onDragEnd,
  onViewTaskDetails,
  selectedTaskId,
  onCreateTask,
  onClearDoneTasks,
  canClearDoneTasks,
  projectId,
}: TaskKanbanBoardProps) {
  const shared = {
    onCreateTask,
    onClearDoneTasks,
    canClearDoneTasks,
    onViewTaskDetails,
    selectedTaskId,
    projectId,
  };

  return (
    <KanbanProvider onDragEnd={onDragEnd}>
      {/* To Do */}
      {renderColumn('todo', columns.todo, shared)}

      {/* Combined In Progress + In Review column */}
      <div className="flex flex-col min-h-full divide-y">
        <div className="flex flex-col flex-1 min-h-0 basis-1/2">
          {renderColumn('inreview', columns.inreview, shared)}
        </div>
        <div className="flex flex-col flex-1 min-h-0 basis-1/2">
          {renderColumn('inprogress', columns.inprogress, shared)}
        </div>
      </div>

      {/* Done */}
      {renderColumn('done', columns.done, shared)}

      {/* Cancelled */}
      {renderColumn('cancelled', columns.cancelled, shared)}
    </KanbanProvider>
  );
}

export default memo(TaskKanbanBoard);
