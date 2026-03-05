import { useState } from 'react';
import { Button, Modal, Select, Typography } from '@douyinfe/semi-ui';
import { EditorType } from 'shared/types';
import { useOpenInEditor } from '@/hooks/useOpenInEditor';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { defineModal } from '@/lib/modals';

export interface EditorSelectionDialogProps {
  selectedAttemptId?: string;
  filePath?: string;
}

const EditorSelectionDialogImpl = NiceModal.create<EditorSelectionDialogProps>(
  ({ selectedAttemptId, filePath }) => {
    const modal = useModal();
    const handleOpenInEditor = useOpenInEditor(selectedAttemptId, () =>
      modal.hide()
    );
    const [selectedEditor, setSelectedEditor] = useState<EditorType>(
      EditorType.VS_CODE
    );

    const handleConfirm = () => {
      handleOpenInEditor({ editorType: selectedEditor, filePath });
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
          <div className="space-y-1">
            <Typography.Title heading={5}>Choose Editor</Typography.Title>
            <Typography.Text type="tertiary">
              The default editor failed to open. Please select an alternative
              editor to open the task worktree.
            </Typography.Text>
          </div>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Typography.Text strong>Editor</Typography.Text>
              <Select
                value={selectedEditor}
                optionList={Object.values(EditorType).map((editor) => ({
                  value: editor,
                  label: editor,
                }))}
                onChange={(value) => setSelectedEditor(value as EditorType)}
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button theme="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="primary" onClick={handleConfirm}>
              Open Editor
            </Button>
          </div>
        </div>
      </Modal>
    );
  }
);

export const EditorSelectionDialog = defineModal<
  EditorSelectionDialogProps,
  EditorType | null
>(EditorSelectionDialogImpl);
