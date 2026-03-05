import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Modal, Select, Spin, Typography } from '@douyinfe/semi-ui';
import { AutoExpandingTextarea } from '@/components/ui/auto-expanding-textarea';
import { defineModal } from '@/lib/modals';
import { repoApi, attemptsApi } from '@/lib/api';
import { useLogStream } from '@/hooks/useLogStream';
import { useExecutionProcesses } from '@/hooks/useExecutionProcesses';
import type { RepoWithTargetBranch, PatchType, UpdateRepo } from 'shared/types';

export type ScriptType = 'setup' | 'cleanup' | 'dev_server' | 'archive';

export interface ScriptFixerDialogProps {
  scriptType: ScriptType;
  repos: RepoWithTargetBranch[];
  workspaceId: string;
  sessionId?: string;
  initialRepoId?: string;
}

export type ScriptFixerDialogResult = {
  action: 'saved' | 'saved_and_tested' | 'canceled';
};

type LogEntry = Extract<PatchType, { type: 'STDOUT' } | { type: 'STDERR' }>;

const ScriptFixerDialogImpl = NiceModal.create<ScriptFixerDialogProps>(
  ({ scriptType, repos, workspaceId, sessionId, initialRepoId }) => {
    const modal = useModal();
    const { t } = useTranslation(['tasks', 'common']);
    const queryClient = useQueryClient();

    // State
    const [selectedRepoId, setSelectedRepoId] = useState<string>(
      initialRepoId || repos[0]?.id || ''
    );
    const [script, setScript] = useState('');
    const [originalScript, setOriginalScript] = useState('');
    const [isLoadingRepo, setIsLoadingRepo] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // Track session ID locally so we can update it after starting a script
    const [activeSessionId, setActiveSessionId] = useState<string | undefined>(
      sessionId
    );

    // Get execution processes for the session to find latest script process
    const { executionProcesses } = useExecutionProcesses(activeSessionId);

    // Find the latest process for this script type
    const latestProcess = useMemo(() => {
      const runReason =
        scriptType === 'setup'
          ? 'setupscript'
          : scriptType === 'cleanup'
            ? 'cleanupscript'
            : scriptType === 'archive'
              ? 'archivescript'
              : 'devserver';
      const filtered = executionProcesses.filter(
        (p) => p.run_reason === runReason && !p.dropped
      );
      // Sort by created_at descending and return the first one
      return filtered.sort(
        (a, b) =>
          new Date(b.created_at as unknown as string).getTime() -
          new Date(a.created_at as unknown as string).getTime()
      )[0];
    }, [executionProcesses, scriptType]);

    // Stream logs for the latest process
    const { logs: rawLogs, error: logsError } = useLogStream(
      latestProcess?.id ?? ''
    );
    const logs: LogEntry[] = rawLogs.filter(
      (l): l is LogEntry => l.type === 'STDOUT' || l.type === 'STDERR'
    );

    // Compute status for the latest process
    const isProcessRunning = latestProcess?.status === 'running';
    const isProcessCompleted = latestProcess?.status === 'completed';
    const isProcessKilled = latestProcess?.status === 'killed';
    const isProcessFailed = latestProcess?.status === 'failed';
    // exit_code can be null, number, or BigInt - convert to Number for comparison
    const exitCode = latestProcess?.exit_code;
    const isExitCodeZero = exitCode == null || Number(exitCode) === 0;
    const isProcessSuccessful = isProcessCompleted && isExitCodeZero;
    const hasProcessError =
      isProcessFailed || (isProcessCompleted && !isExitCodeZero);

    // Reset selectedRepoId on dialog re-open
    useEffect(() => {
      if (!initialRepoId) return;
      setSelectedRepoId(initialRepoId);
    }, [initialRepoId]);

    // Fetch the selected repo's script
    useEffect(() => {
      if (!selectedRepoId) return;

      let cancelled = false;
      setIsLoadingRepo(true);
      setError(null);

      (async () => {
        try {
          const repo = await repoApi.getById(selectedRepoId);
          if (cancelled) return;

          const scriptContent =
            scriptType === 'setup'
              ? (repo.setup_script ?? '')
              : scriptType === 'cleanup'
                ? (repo.cleanup_script ?? '')
                : scriptType === 'archive'
                  ? (repo.archive_script ?? '')
                  : (repo.dev_server_script ?? '');

          setScript(scriptContent);
          setOriginalScript(scriptContent);
        } catch (err) {
          if (cancelled) return;
          setError(
            err instanceof Error ? err.message : t('common:error.generic')
          );
        } finally {
          if (!cancelled) setIsLoadingRepo(false);
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [selectedRepoId, scriptType, t]);

    const hasChanges = script !== originalScript;

    const handleClose = useCallback(() => {
      modal.resolve({ action: 'canceled' } as ScriptFixerDialogResult);
      modal.hide();
    }, [modal]);

    const handleSave = useCallback(async () => {
      if (!selectedRepoId) return;

      setIsSaving(true);
      setError(null);

      try {
        // Only send the field being edited - other fields will be preserved by the backend
        const scriptValue = script.trim() || null;
        const updateData: Partial<UpdateRepo> =
          scriptType === 'setup'
            ? { setup_script: scriptValue }
            : scriptType === 'cleanup'
              ? { cleanup_script: scriptValue }
              : scriptType === 'archive'
                ? { archive_script: scriptValue }
                : { dev_server_script: scriptValue };

        await repoApi.update(selectedRepoId, updateData as UpdateRepo);

        // Invalidate repos cache
        queryClient.invalidateQueries({ queryKey: ['repos'] });

        setOriginalScript(script);
        modal.resolve({ action: 'saved' } as ScriptFixerDialogResult);
        modal.hide();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : t('common:error.generic')
        );
      } finally {
        setIsSaving(false);
      }
    }, [selectedRepoId, script, scriptType, queryClient, modal, t]);

    const handleSaveAndTest = useCallback(async () => {
      if (!selectedRepoId) return;

      setIsTesting(true);
      setError(null);

      try {
        // Only send the field being edited - other fields will be preserved by the backend
        const scriptValue = script.trim() || null;
        const updateData: Partial<UpdateRepo> =
          scriptType === 'setup'
            ? { setup_script: scriptValue }
            : scriptType === 'cleanup'
              ? { cleanup_script: scriptValue }
              : scriptType === 'archive'
                ? { archive_script: scriptValue }
                : { dev_server_script: scriptValue };

        await repoApi.update(selectedRepoId, updateData as UpdateRepo);

        // Invalidate repos cache
        queryClient.invalidateQueries({ queryKey: ['repos'] });

        setOriginalScript(script);

        // Then run the script and capture the session ID from the returned process
        if (scriptType === 'setup') {
          const result = await attemptsApi.runSetupScript(workspaceId);
          if (result.success) {
            setActiveSessionId(result.data.session_id);
          }
        } else if (scriptType === 'cleanup') {
          const result = await attemptsApi.runCleanupScript(workspaceId);
          if (result.success) {
            setActiveSessionId(result.data.session_id);
          }
        } else if (scriptType === 'archive') {
          const result = await attemptsApi.runArchiveScript(workspaceId);
          if (result.success) {
            setActiveSessionId(result.data.session_id);
          }
        } else {
          // Start the dev server
          const processes = await attemptsApi.startDevServer(workspaceId);
          if (processes.length > 0) {
            setActiveSessionId(processes[0].session_id);
          }
        }

        // Keep dialog open so user can see the new execution logs
        // The logs will update automatically via useLogStream/useExecutionProcesses
      } catch (err) {
        setError(
          err instanceof Error ? err.message : t('common:error.generic')
        );
      } finally {
        setIsTesting(false);
      }
    }, [selectedRepoId, script, scriptType, workspaceId, queryClient, t]);

    const dialogTitle =
      scriptType === 'setup'
        ? t('scriptFixer.setupScriptTitle')
        : scriptType === 'cleanup'
          ? t('scriptFixer.cleanupScriptTitle')
          : scriptType === 'archive'
            ? t('scriptFixer.archiveScriptTitle')
            : t('scriptFixer.devServerTitle');

    return (
      <Modal
        visible={modal.visible}
        onCancel={handleClose}
        footer={null}
        width={1000}
      >
        <div className="max-h-[80vh] flex flex-col overflow-hidden">
          <Typography.Title heading={5}>{dialogTitle}</Typography.Title>

          <div className="flex-1 flex flex-col gap-4 min-h-0 min-w-0 overflow-hidden">
            {/* Repo selector (only show if multiple repos) */}
            {repos.length > 1 && (
              <div className="flex items-center gap-2">
                <Typography.Text className="shrink-0">
                  {t('scriptFixer.selectRepo')}
                </Typography.Text>
                <Select
                  value={selectedRepoId}
                  onChange={(value) => setSelectedRepoId(String(value))}
                  className="flex-1"
                  optionList={repos.map((repo) => ({
                    value: repo.id,
                    label: repo.display_name || repo.path,
                  }))}
                />
              </div>
            )}

            {/* Script editor */}
            <div className="flex flex-col gap-2 flex-1 min-h-0 min-w-0">
              <Typography.Text>{t('scriptFixer.scriptLabel')}</Typography.Text>
              <div className="bg-panel flex-1 min-h-[150px] max-h-[300px] overflow-auto border rounded-md min-w-0">
                {isLoadingRepo ? (
                  <div className="h-full flex items-center justify-center">
                    <Spin />
                  </div>
                ) : (
                  <AutoExpandingTextarea
                    value={script}
                    onChange={(e) => setScript(e.target.value)}
                    className="font-mono text-sm p-3 border-0 min-h-full bg-panel"
                    placeholder={
                      scriptType === 'setup'
                        ? 'npm install'
                        : scriptType === 'cleanup'
                          ? 'npm run lint'
                          : 'npm run dev'
                    }
                    disableInternalScroll
                  />
                )}
              </div>
            </div>

            {/* Logs section */}
            <div
              className="flex flex-col gap-2 min-h-0 min-w-0"
              style={{ height: '200px' }}
            >
              <div className="flex items-center justify-between gap-2">
                <Typography.Text>{t('scriptFixer.logsLabel')}</Typography.Text>
                {/* Status indicator */}
                {latestProcess && (
                  <div className="flex items-center gap-2 text-sm">
                    {isProcessRunning ? (
                      <>
                        <Spin />
                        <span className="text-muted-foreground">
                          {t('scriptFixer.statusRunning')}
                        </span>
                      </>
                    ) : isProcessSuccessful ? (
                      <>
                        <span className="size-2 rounded-full bg-success" />
                        <span className="text-success">
                          {t('scriptFixer.statusSuccess')}
                        </span>
                      </>
                    ) : hasProcessError ? (
                      <>
                        <span className="size-2 rounded-full bg-destructive bg-error" />
                        <span className="text-destructive text-error">
                          {t('scriptFixer.statusFailed', {
                            exitCode: Number(latestProcess.exit_code ?? 0),
                          })}
                        </span>
                      </>
                    ) : isProcessKilled ? (
                      <>
                        <span className="size-2 rounded-full bg-low" />
                        <span className="text-muted-foreground">
                          {t('scriptFixer.statusKilled')}
                        </span>
                      </>
                    ) : null}
                  </div>
                )}
              </div>
              <div className="bg-secondary py-base flex-1 border rounded-md bg-muted overflow-hidden min-w-0">
                {latestProcess ? (
                  <div className="h-full overflow-auto px-3 py-2 font-mono text-xs">
                    {logsError ? (
                      <div className="text-destructive">{String(logsError)}</div>
                    ) : logs.length === 0 ? (
                      <div className="text-muted-foreground">
                        {t('scriptFixer.noLogs')}
                      </div>
                    ) : (
                      logs.map((log, index) => (
                        <div key={index}>{log.content}</div>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    {t('scriptFixer.noLogs')}
                  </div>
                )}
              </div>
            </div>

            {/* Error display */}
            {error && <div className="text-destructive text-sm">{error}</div>}
          </div>

          <div className="gap-2 flex items-center justify-end">
            <Button theme="outline" onClick={handleClose}>
              {t('common:buttons.close')}
            </Button>
            <Button
              theme="outline"
              onClick={handleSave}
              disabled={!hasChanges || isSaving || isTesting}
              loading={isSaving}
            >
              {t('scriptFixer.saveButton')}
            </Button>
            <Button
              onClick={handleSaveAndTest}
              disabled={isSaving || isTesting}
              loading={isTesting}
            >
              {t('scriptFixer.saveAndTestButton')}
            </Button>
          </div>
        </div>
      </Modal>
    );
  }
);

export const ScriptFixerDialog = defineModal<
  ScriptFixerDialogProps,
  ScriptFixerDialogResult
>(ScriptFixerDialogImpl);
