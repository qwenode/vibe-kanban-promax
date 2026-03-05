import { useEffect, useCallback, useRef } from 'react';
import { AlertCircle } from 'lucide-react';
import { CreateProject, Project } from 'shared/types';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { useProjectMutations } from '@/hooks/useProjectMutations';
import { defineModal } from '@/lib/modals';
import { RepoPickerDialog } from '@/components/dialogs/shared/RepoPickerDialog';
import { Banner, Modal, Spin, Typography } from '@douyinfe/semi-ui';

export interface ProjectFormDialogProps {}

export type ProjectFormDialogResult =
  | { status: 'saved'; project: Project }
  | { status: 'canceled' };

const ProjectFormDialogImpl = NiceModal.create<ProjectFormDialogProps>(() => {
  const modal = useModal();

  const { createProject } = useProjectMutations({
    onCreateSuccess: (project) => {
      modal.resolve({ status: 'saved', project } as ProjectFormDialogResult);
      modal.hide();
    },
    onCreateError: () => {},
  });
  const createProjectMutate = createProject.mutate;

  const hasStartedCreateRef = useRef(false);

  const handlePickRepo = useCallback(async () => {
    const repo = await RepoPickerDialog.show({
      title: 'Create Project',
      description: 'Select or create a repository for your project',
    });

    if (repo) {
      const projectName = repo.display_name || repo.name;

      const createData: CreateProject = {
        name: projectName,
        repositories: [{ display_name: projectName, git_repo_path: repo.path }],
      };

      createProjectMutate(createData);
    } else {
      modal.resolve({ status: 'canceled' } as ProjectFormDialogResult);
      modal.hide();
    }
  }, [createProjectMutate, modal]);

  useEffect(() => {
    if (!modal.visible) {
      hasStartedCreateRef.current = false;
      return;
    }

    if (hasStartedCreateRef.current) return;
    hasStartedCreateRef.current = true;
    handlePickRepo();
  }, [modal.visible, handlePickRepo]);

  return (
    <Modal
      visible={modal.visible && createProject.isPending}
      onCancel={() => {
        modal.resolve({ status: 'canceled' } as ProjectFormDialogResult);
        modal.hide();
      }}
      footer={null}
      width={400}
    >
      <div className="space-y-3">
        <Typography.Title heading={5}>Creating Project</Typography.Title>
        <Typography.Text type="tertiary">Setting up your project...</Typography.Text>

        <div className="flex items-center justify-center py-8">
          <Spin size="large" />
        </div>

        {createProject.isError && (
          <Banner
            type="danger"
            fullMode={false}
            icon={<AlertCircle className="h-4 w-4" />}
            description={
              createProject.error instanceof Error
                ? createProject.error.message
                : 'Failed to create project'
            }
          />
        )}
      </div>
    </Modal>
  );
});

export const ProjectFormDialog = defineModal<
  ProjectFormDialogProps,
  ProjectFormDialogResult
>(ProjectFormDialogImpl);
