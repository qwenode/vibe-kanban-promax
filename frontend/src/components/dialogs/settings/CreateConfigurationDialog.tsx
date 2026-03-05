import { useState, useEffect } from 'react';
import { Banner, Button, Input, Modal, Select, Typography } from '@douyinfe/semi-ui';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { defineModal } from '@/lib/modals';

export interface CreateConfigurationDialogProps {
  executorType: string;
  existingConfigs: string[];
}

export type CreateConfigurationResult = {
  action: 'created' | 'canceled';
  configName?: string;
  cloneFrom?: string | null;
};

const CreateConfigurationDialogImpl =
  NiceModal.create<CreateConfigurationDialogProps>(
    ({ executorType, existingConfigs }) => {
      const modal = useModal();
      const [configName, setConfigName] = useState('');
      const [cloneFrom, setCloneFrom] = useState<string | null>(null);
      const [error, setError] = useState<string | null>(null);

      useEffect(() => {
        // Reset form when dialog opens
        if (modal.visible) {
          setConfigName('');
          setCloneFrom(null);
          setError(null);
        }
      }, [modal.visible]);

      const validateConfigName = (name: string): string | null => {
        const trimmedName = name.trim();
        if (!trimmedName) return 'Configuration name cannot be empty';
        if (trimmedName.length > 40)
          return 'Configuration name must be 40 characters or less';
        if (!/^[a-zA-Z0-9_-]+$/.test(trimmedName)) {
          return 'Configuration name can only contain letters, numbers, underscores, and hyphens';
        }
        if (existingConfigs.includes(trimmedName)) {
          return 'A configuration with this name already exists';
        }
        return null;
      };

      const handleCreate = () => {
        const validationError = validateConfigName(configName);
        if (validationError) {
          setError(validationError);
          return;
        }

        modal.resolve({
          action: 'created',
          configName: configName.trim(),
          cloneFrom,
        } as CreateConfigurationResult);
        modal.hide();
      };

      const handleCancel = () => {
        modal.resolve({ action: 'canceled' } as CreateConfigurationResult);
        modal.hide();
      };

      const handleOpenChange = (open: boolean) => {
        if (!open) {
          handleCancel();
        }
      };

      return (
        <Modal visible={modal.visible} onCancel={() => handleOpenChange(false)} footer={null}>
          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <Typography.Title heading={4} className="!mb-0">
                Create New Configuration
              </Typography.Title>
              <Typography.Text type="tertiary">
                Add a new configuration for the {executorType} executor.
              </Typography.Text>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="config-name"
                  className="text-sm font-medium leading-none"
                >
                  Configuration Name
                </label>
                <Input
                  id="config-name"
                  value={configName}
                  onChange={(value) => {
                    setConfigName(value);
                    setError(null);
                  }}
                  placeholder="e.g., PRODUCTION, DEVELOPMENT"
                  maxLength={40}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="clone-from" className="text-sm font-medium leading-none">
                  Clone from (optional)
                </label>
                <Select
                  style={{ width: '100%' }}
                  value={cloneFrom || '__blank__'}
                  placeholder="Start blank or clone existing"
                  optionList={[
                    { value: '__blank__', label: 'Start blank' },
                    ...existingConfigs.map((configuration) => ({
                      value: configuration,
                      label: `Clone from ${configuration}`,
                    })),
                  ]}
                  onChange={(value) =>
                    setCloneFrom(String(value) === '__blank__' ? null : String(value))
                  }
                />
              </div>

              {error && (
                <Banner type="danger" description={error} />
              )}
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button theme="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!configName.trim()}>
                Create Configuration
              </Button>
            </div>
          </div>
        </Modal>
      );
    }
  );

export const CreateConfigurationDialog = defineModal<
  CreateConfigurationDialogProps,
  CreateConfigurationResult
>(CreateConfigurationDialogImpl);
