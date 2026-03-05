import { useState } from 'react';
import { Button, Dropdown, Input, Modal, Select, Typography } from '@douyinfe/semi-ui';
import { Sparkles, Code, ChevronDown, HandMetal } from 'lucide-react';
import { BaseCodingAgent, EditorType } from 'shared/types';
import type { EditorConfig, ExecutorProfileId } from 'shared/types';
import { useUserSystem } from '@/components/ConfigProvider';

import { toPrettyCase } from '@/utils/string';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { defineModal, type NoProps } from '@/lib/modals';
import { useEditorAvailability } from '@/hooks/useEditorAvailability';
import { EditorAvailabilityIndicator } from '@/components/EditorAvailabilityIndicator';
import { useAgentAvailability } from '@/hooks/useAgentAvailability';
import { AgentAvailabilityIndicator } from '@/components/AgentAvailabilityIndicator';

export type OnboardingResult = {
  profile: ExecutorProfileId;
  editor: EditorConfig;
};

const OnboardingDialogImpl = NiceModal.create<NoProps>(() => {
  const modal = useModal();
  const { profiles, config } = useUserSystem();

  const [profile, setProfile] = useState<ExecutorProfileId>(
    config?.executor_profile || {
      executor: BaseCodingAgent.CLAUDE_CODE,
      variant: null,
    }
  );
  const [editorType, setEditorType] = useState<EditorType>(EditorType.VS_CODE);
  const [customCommand, setCustomCommand] = useState<string>('');

  const editorAvailability = useEditorAvailability(editorType);
  const agentAvailability = useAgentAvailability(profile.executor);

  const handleComplete = () => {
    modal.resolve({
      profile,
      editor: {
        editor_type: editorType,
        custom_command:
          editorType === EditorType.CUSTOM ? customCommand || null : null,
        remote_ssh_host: null,
        remote_ssh_user: null,
      },
    } as OnboardingResult);
  };

  const isValid =
    editorType !== EditorType.CUSTOM ||
    (editorType === EditorType.CUSTOM && customCommand.trim() !== '');

  return (
    <Modal
      visible={modal.visible}
      closable={false}
      closeOnEsc={false}
      maskClosable={false}
      footer={null}
      width={600}
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <HandMetal className="h-6 w-6 text-primary text-primary-foreground" />
            <Typography.Title heading={4} className="!mb-0">
              Welcome to Vibe Kanban
            </Typography.Title>
          </div>
          <Typography.Text type="tertiary" className="text-left pt-2">
            Let's set up your coding preferences. You can always change these
            later in Settings.
          </Typography.Text>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Choose Your Coding Agent
          </h2>
          <div className="space-y-2">
            <label htmlFor="profile" className="text-sm font-medium leading-none">
              Default Agent
            </label>
            <div className="flex gap-2">
              <Select
                style={{ width: '100%' }}
                value={profile.executor}
                placeholder="Select your preferred coding agent"
                optionList={(
                  profiles ? (Object.keys(profiles) as BaseCodingAgent[]).sort() : []
                ).map((agent) => ({
                  value: agent,
                  label: agent,
                }))}
                onChange={(v) =>
                  setProfile({ executor: String(v) as BaseCodingAgent, variant: null })
                }
              />

              {/* Show variant selector if selected profile has variants */}
              {(() => {
                const selectedProfile = profiles?.[profile.executor];
                const hasVariants =
                  selectedProfile && Object.keys(selectedProfile).length > 0;

                if (hasVariants) {
                  return (
                    <Dropdown
                      trigger="click"
                      render={
                        <Dropdown.Menu>
                          {Object.keys(selectedProfile).map((variant) => (
                            <Dropdown.Item
                              key={variant}
                              onClick={() =>
                                setProfile({
                                  ...profile,
                                  variant: variant,
                                })
                              }
                              className={profile.variant === variant ? 'bg-accent' : ''}
                            >
                              {variant}
                            </Dropdown.Item>
                          ))}
                        </Dropdown.Menu>
                      }
                    >
                        <Button
                          theme="outline"
                          className="w-24 px-2 flex items-center justify-between"
                        >
                          <span className="text-xs truncate flex-1 text-left">
                            {profile.variant || 'DEFAULT'}
                          </span>
                          <ChevronDown className="h-3 w-3 ml-1 flex-shrink-0" />
                        </Button>
                    </Dropdown>
                  );
                } else if (selectedProfile) {
                  // Show disabled button when profile exists but has no variants
                  return (
                    <Button
                      theme="outline"
                      className="w-24 px-2 flex items-center justify-between"
                      disabled
                    >
                      <span className="text-xs truncate flex-1 text-left">
                        Default
                      </span>
                    </Button>
                  );
                }
                return null;
              })()}
            </div>
            <AgentAvailabilityIndicator availability={agentAvailability} />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl flex items-center gap-2">
            <Code className="h-4 w-4" />
            Choose Your Code Editor
          </h2>

          <div className="space-y-2">
            <label htmlFor="editor" className="text-sm font-medium leading-none">
              Preferred Editor
            </label>
            <Select
              style={{ width: '100%' }}
              value={editorType}
              placeholder="Select your preferred editor"
              optionList={Object.values(EditorType).map((type) => ({
                value: type,
                label: toPrettyCase(type),
              }))}
              onChange={(value) => setEditorType(String(value) as EditorType)}
            />

            {/* Editor availability status indicator */}
            {editorType !== EditorType.CUSTOM && (
              <EditorAvailabilityIndicator availability={editorAvailability} />
            )}

            <p className="text-sm text-muted-foreground">
              This editor will be used to open task attempts and project files.
            </p>

            {editorType === EditorType.CUSTOM && (
              <div className="space-y-2">
                <label
                  htmlFor="custom-command"
                  className="text-sm font-medium leading-none"
                >
                  Custom Command
                </label>
                <Input
                  id="custom-command"
                  placeholder="e.g., code, subl, vim"
                  value={customCommand}
                  onChange={(value) => setCustomCommand(value)}
                />
                <p className="text-sm text-muted-foreground">
                  Enter the command to run your custom editor. Use spaces for
                  arguments (e.g., "code --wait").
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button
            onClick={handleComplete}
            disabled={!isValid}
            className="w-full"
          >
            Continue
          </Button>
        </div>
      </div>
    </Modal>
  );
});

export const OnboardingDialog = defineModal<void, OnboardingResult>(
  OnboardingDialogImpl
);
