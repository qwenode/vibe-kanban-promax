import { useTranslation } from 'react-i18next';
import { Button, Dropdown } from '@douyinfe/semi-ui';
import { MoreHorizontal } from 'lucide-react';
import type { TaskWithAttemptStatus } from 'shared/types';
import { useOpenInEditor } from '@/hooks/useOpenInEditor';
import { DeleteTaskConfirmationDialog } from '@/components/dialogs/tasks/DeleteTaskConfirmationDialog';
import { ViewProcessesDialog } from '@/components/dialogs/tasks/ViewProcessesDialog';
import { ViewRelatedTasksDialog } from '@/components/dialogs/tasks/ViewRelatedTasksDialog';
import { CreateAttemptDialog } from '@/components/dialogs/tasks/CreateAttemptDialog';
import { GitActionsDialog } from '@/components/dialogs/tasks/GitActionsDialog';
import { EditBranchNameDialog } from '@/components/dialogs/tasks/EditBranchNameDialog';
import { useProject } from '@/contexts/ProjectContext';
import { openTaskForm } from '@/lib/openTaskForm';

import { WorkspaceWithSession } from '@/types/attempt';
import { useNavigateWithSearch } from '@/hooks/useNavigateWithSearch';

interface ActionsDropdownProps {
  task?: TaskWithAttemptStatus | null;
  attempt?: WorkspaceWithSession | null;
}

export function ActionsDropdown({ task, attempt }: ActionsDropdownProps) {
  const { t } = useTranslation('tasks');
  const { projectId } = useProject();
  const openInEditor = useOpenInEditor(attempt?.id);
  const navigate = useNavigateWithSearch();

  const hasAttemptActions = Boolean(attempt);
  const hasTaskActions = Boolean(task);

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!projectId || !task) return;
    openTaskForm({ mode: 'edit', projectId, task });
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!projectId || !task) return;
    openTaskForm({ mode: 'duplicate', projectId, initialTask: task });
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!projectId || !task) return;
    try {
      await DeleteTaskConfirmationDialog.show({
        task,
        projectId,
      });
    } catch {
      // User cancelled or error occurred
    }
  };

  const handleOpenInEditor = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!attempt?.id) return;
    openInEditor();
  };

  const handleViewProcesses = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!attempt?.id) return;
    ViewProcessesDialog.show({ sessionId: attempt.session?.id });
  };

  const handleViewRelatedTasks = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!attempt?.id || !projectId) return;
    ViewRelatedTasksDialog.show({
      attemptId: attempt.id,
      projectId,
      attempt,
      onNavigateToTask: (taskId: string) => {
        if (projectId) {
          navigate(
            `/local-projects/${projectId}/tasks/${taskId}/attempts/latest`
          );
        }
      },
    });
  };

  const handleCreateNewAttempt = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!task?.id) return;
    CreateAttemptDialog.show({
      taskId: task.id,
    });
  };

  const handleCreateSubtask = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!projectId || !attempt) return;
    const baseBranch = attempt.branch;
    if (!baseBranch) return;
    openTaskForm({
      mode: 'subtask',
      projectId,
      parentTaskAttemptId: attempt.id,
      initialBaseBranch: baseBranch,
    });
  };

  const handleGitActions = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!attempt?.id || !task) return;
    GitActionsDialog.show({
      attemptId: attempt.id,
      task,
    });
  };

  const handleEditBranchName = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!attempt?.id) return;
    EditBranchNameDialog.show({
      attemptId: attempt.id,
      currentBranchName: attempt.branch,
    });
  };

  return (
    <Dropdown
      trigger="click"
      position="bottomRight"
      render={
        <Dropdown.Menu>
          {hasAttemptActions && (
            <>
              <Dropdown.Title>{t('actionsMenu.attempt')}</Dropdown.Title>
              <Dropdown.Item disabled={!attempt?.id} onClick={handleOpenInEditor}>
                {t('actionsMenu.openInIde')}
              </Dropdown.Item>
              <Dropdown.Item disabled={!attempt?.id} onClick={handleViewProcesses}>
                {t('actionsMenu.viewProcesses')}
              </Dropdown.Item>
              <Dropdown.Item disabled={!attempt?.id} onClick={handleViewRelatedTasks}>
                {t('actionsMenu.viewRelatedTasks')}
              </Dropdown.Item>
              <Dropdown.Item onClick={handleCreateNewAttempt}>
                {t('actionsMenu.createNewAttempt')}
              </Dropdown.Item>
              <Dropdown.Item
                disabled={!projectId || !attempt}
                onClick={handleCreateSubtask}
              >
                {t('actionsMenu.createSubtask')}
              </Dropdown.Item>
              <Dropdown.Item
                disabled={!attempt?.id || !task}
                onClick={handleGitActions}
              >
                {t('actionsMenu.gitActions')}
              </Dropdown.Item>
              <Dropdown.Item disabled={!attempt?.id} onClick={handleEditBranchName}>
                {t('actionsMenu.editBranchName')}
              </Dropdown.Item>
              <Dropdown.Divider />
            </>
          )}
          {hasTaskActions && (
            <>
              <Dropdown.Title>{t('actionsMenu.task')}</Dropdown.Title>
              <Dropdown.Item disabled={!projectId} onClick={handleEdit}>
                {t('common:buttons.edit')}
              </Dropdown.Item>
              <Dropdown.Item disabled={!projectId} onClick={handleDuplicate}>
                {t('actionsMenu.duplicate')}
              </Dropdown.Item>
              <Dropdown.Item disabled={!projectId} onClick={handleDelete}>
                {t('common:buttons.delete')}
              </Dropdown.Item>
            </>
          )}
        </Dropdown.Menu>
      }
    >
      <Button
        theme="borderless"
        aria-label="Actions"
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </Dropdown>
  );
}
