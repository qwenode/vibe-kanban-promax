import { useState } from 'react';
import { Button, Modal, Select, Typography } from '@douyinfe/semi-ui';
import { EditorType, Project } from 'shared/types';
import { useOpenProjectInEditor } from '@/hooks/useOpenProjectInEditor';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { defineModal } from '@/lib/modals';

export interface ProjectEditorSelectionDialogProps {
  selectedProject: Project | null;
}

const ProjectEditorSelectionDialogImpl =
  NiceModal.create<ProjectEditorSelectionDialogProps>(({ selectedProject }) => {
    const modal = useModal();
    const handleOpenInEditor = useOpenProjectInEditor(selectedProject, () =>
      modal.hide()
    );
    const [selectedEditor, setSelectedEditor] = useState<EditorType>(
      EditorType.VS_CODE
    );

    const handleConfirm = () => {
      handleOpenInEditor(selectedEditor);
      modal.resolve(selectedEditor);
      modal.hide();
    };

    const handleCancel = () => {
      modal.resolve(null);
      modal.hide();
    };

    return (
      <Modal visible={modal.visible} onCancel={handleCancel} footer={null} width={425}>
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <Typography.Title heading={4} className="!mb-0">
              Choose Editor
            </Typography.Title>
            <Typography.Text type="tertiary">
              The default editor failed to open. Please select an alternative
              editor to open the project.
            </Typography.Text>
          </div>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Editor</label>
              <Select
                style={{ width: '100%' }}
                value={selectedEditor}
                optionList={Object.values(EditorType).map((editor) => ({
                  value: editor,
                  label: editor,
                }))}
                onChange={(value) => setSelectedEditor(String(value) as EditorType)}
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button theme="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleConfirm}>Open Editor</Button>
          </div>
        </div>
      </Modal>
    );
  });

export const ProjectEditorSelectionDialog = defineModal<
  ProjectEditorSelectionDialogProps,
  EditorType | null
>(ProjectEditorSelectionDialogImpl);
