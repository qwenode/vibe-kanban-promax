import { Button } from '@douyinfe/semi-ui';
import { X } from 'lucide-react';
import type { TaskWithAttemptStatus } from 'shared/types';
import { ActionsDropdown } from '../ui/actions-dropdown';

type Task = TaskWithAttemptStatus;

interface TaskPanelHeaderActionsProps {
  task: Task;
  onClose: () => void;
}

export const TaskPanelHeaderActions = ({
  task,
  onClose,
}: TaskPanelHeaderActionsProps) => {
  return (
    <>
      <ActionsDropdown task={task} />
      <Button
        theme="borderless"
        size="small"
        icon={<X size={16} />}
        aria-label="Close"
        onClick={onClose}
      />
    </>
  );
};
