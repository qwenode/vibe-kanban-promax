import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { defineModal, getErrorMessage } from '@/lib/modals';
import { attemptsApi } from '@/lib/api';
import type { GhCliSetupError } from 'shared/types';
import { useRef, useState } from 'react';
import { Banner, Button, Modal, Typography } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';

interface GhCliSetupDialogProps {
  attemptId: string;
}

export type GhCliSupportVariant = 'homebrew' | 'manual';

export interface GhCliSupportContent {
  message: string;
  variant: GhCliSupportVariant | null;
}

export const mapGhCliErrorToUi = (
  error: GhCliSetupError | null,
  fallbackMessage: string,
  t: (key: string) => string
): GhCliSupportContent => {
  if (!error) {
    return { message: fallbackMessage, variant: null };
  }

  if (error === 'BREW_MISSING') {
    return {
      message: t('settings:integrations.github.cliSetup.errors.brewMissing'),
      variant: 'homebrew',
    };
  }

  if (error === 'SETUP_HELPER_NOT_SUPPORTED') {
    return {
      message: t('settings:integrations.github.cliSetup.errors.notSupported'),
      variant: 'manual',
    };
  }

  if (typeof error === 'object' && 'OTHER' in error) {
    return {
      message: error.OTHER.message || fallbackMessage,
      variant: null,
    };
  }

  return { message: fallbackMessage, variant: null };
};

export const GhCliHelpInstructions = ({
  variant,
  t,
}: {
  variant: GhCliSupportVariant;
  t: (key: string) => string;
}) => {
  if (variant === 'homebrew') {
    return (
      <div className="space-y-2 text-sm">
        <p>
          {t('settings:integrations.github.cliSetup.help.homebrew.description')}{' '}
          <a
            href="https://brew.sh/"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            {t('settings:integrations.github.cliSetup.help.homebrew.brewSh')}
          </a>{' '}
          {t(
            'settings:integrations.github.cliSetup.help.homebrew.manualInstall'
          )}
        </p>
        <pre className="rounded bg-muted px-2 py-1 text-xs">
          brew install gh
        </pre>
        <p>
          {t(
            'settings:integrations.github.cliSetup.help.homebrew.afterInstall'
          )}
          <br />
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            gh auth login --web --git-protocol https
          </code>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 text-sm">
      <p>
        {t('settings:integrations.github.cliSetup.help.manual.description')}{' '}
        <a
          href="https://cli.github.com/"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          {t('settings:integrations.github.cliSetup.help.manual.officialDocs')}
        </a>{' '}
        {t('settings:integrations.github.cliSetup.help.manual.andAuthenticate')}
      </p>
      <pre className="rounded bg-muted px-2 py-1 text-xs">
        gh auth login --web --git-protocol https
      </pre>
    </div>
  );
};

const GhCliSetupDialogImpl = NiceModal.create<GhCliSetupDialogProps>(
  ({ attemptId }) => {
    const modal = useModal();
    const { t } = useTranslation();
    const [isRunning, setIsRunning] = useState(false);
    const [errorInfo, setErrorInfo] = useState<{
      error: GhCliSetupError;
      message: string;
      variant: GhCliSupportVariant | null;
    } | null>(null);
    const pendingResultRef = useRef<GhCliSetupError | null>(null);
    const hasResolvedRef = useRef(false);

    const handleRunSetup = async () => {
      setIsRunning(true);
      setErrorInfo(null);
      pendingResultRef.current = null;

      try {
        await attemptsApi.setupGhCli(attemptId);
        hasResolvedRef.current = true;
        modal.resolve(null);
        modal.hide();
      } catch (err: unknown) {
        const rawMessage =
          getErrorMessage(err) ||
          t('settings:integrations.github.cliSetup.errors.setupFailed');

        const maybeErrorData =
          typeof err === 'object' && err !== null && 'error_data' in err
            ? (err as { error_data?: unknown }).error_data
            : undefined;

        const isGhCliSetupError = (x: unknown): x is GhCliSetupError =>
          x === 'BREW_MISSING' ||
          x === 'SETUP_HELPER_NOT_SUPPORTED' ||
          (typeof x === 'object' && x !== null && 'OTHER' in x);

        const errorData = isGhCliSetupError(maybeErrorData)
          ? maybeErrorData
          : undefined;

        const resolvedError: GhCliSetupError = errorData ?? {
          OTHER: { message: rawMessage },
        };
        const ui = mapGhCliErrorToUi(resolvedError, rawMessage, t);

        pendingResultRef.current = resolvedError;
        setErrorInfo({
          error: resolvedError,
          message: ui.message,
          variant: ui.variant,
        });
      } finally {
        setIsRunning(false);
      }
    };

    const handleClose = () => {
      if (!hasResolvedRef.current) {
        modal.resolve(pendingResultRef.current);
      }
      modal.hide();
    };

    return (
      <Modal visible={modal.visible} onCancel={handleClose} footer={null}>
        <div className="space-y-4">
          <Typography.Title heading={5}>
              {t('settings:integrations.github.cliSetup.title')}
          </Typography.Title>
          <div className="space-y-4">
            <p>{t('settings:integrations.github.cliSetup.description')}</p>

            <div className="space-y-2">
              <p className="text-sm">
                {t('settings:integrations.github.cliSetup.setupWillTitle')}
              </p>
              <ol className="text-sm list-decimal list-inside space-y-1 ml-2">
                <li>
                  {t(
                    'settings:integrations.github.cliSetup.steps.checkInstalled'
                  )}
                </li>
                <li>
                  {t(
                    'settings:integrations.github.cliSetup.steps.installHomebrew'
                  )}
                </li>
                <li>
                  {t(
                    'settings:integrations.github.cliSetup.steps.authenticate'
                  )}
                </li>
              </ol>
              <p className="text-sm text-muted-foreground mt-4">
                {t('settings:integrations.github.cliSetup.setupNote')}
              </p>
            </div>
            {errorInfo && (
              <Banner
                type="danger"
                fullMode={false}
                description={
                  <div className="space-y-2">
                    <p>{errorInfo.message}</p>
                    {errorInfo.variant && (
                      <GhCliHelpInstructions variant={errorInfo.variant} t={t} />
                    )}
                  </div>
                }
              />
            )}
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button onClick={handleRunSetup} disabled={isRunning} loading={isRunning}>
              {isRunning
                ? t('settings:integrations.github.cliSetup.running')
                : t('settings:integrations.github.cliSetup.runSetup')}
            </Button>
            <Button
              theme="outline"
              onClick={handleClose}
              disabled={isRunning}
            >
              {t('common:buttons.close')}
            </Button>
          </div>
        </div>
      </Modal>
    );
  }
);

export const GhCliSetupDialog = defineModal<
  GhCliSetupDialogProps,
  GhCliSetupError | null
>(GhCliSetupDialogImpl);
