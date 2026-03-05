import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { HotkeysProvider } from 'react-hotkeys-hook';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { UserSystemProvider, useUserSystem } from '@/components/ConfigProvider';
import { ClickedElementsProvider } from '@/contexts/ClickedElementsProvider';
import { ProjectProvider } from '@/contexts/ProjectContext';
import { SearchProvider } from '@/contexts/SearchContext';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ThemeMode } from 'shared/types';
import { usePreviousPath } from '@/hooks/usePreviousPath';
import { useUiPreferencesScratch } from '@/hooks/useUiPreferencesScratch';
import { LegacyDesignScope } from '@/components/legacy-design/LegacyDesignScope';
import { DisclaimerDialog } from '@/components/dialogs/global/DisclaimerDialog';
import { OnboardingDialog } from '@/components/dialogs/global/OnboardingDialog';
import { ReleaseNotesDialog } from '@/components/dialogs/global/ReleaseNotesDialog';

export type RouterContext = {
  queryClient: QueryClient;
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  return (
    <UserSystemProvider>
      <ClickedElementsProvider>
        <ProjectProvider>
          <HotkeysProvider
            initiallyActiveScopes={['global', 'workspace', 'kanban', 'projects']}
          >
            <RootApp />
          </HotkeysProvider>
        </ProjectProvider>
      </ClickedElementsProvider>
    </UserSystemProvider>
  );
}

function RootApp() {
  const { config, updateAndSaveConfig } = useUserSystem();

  usePreviousPath();
  useUiPreferencesScratch();

  useEffect(() => {
    if (!config) return;
    let cancelled = false;

    const showNextStep = async () => {
      if (!config.disclaimer_acknowledged) {
        await DisclaimerDialog.show();
        if (!cancelled) {
          await updateAndSaveConfig({ disclaimer_acknowledged: true });
        }
        DisclaimerDialog.hide();
        return;
      }

      if (!config.onboarding_acknowledged) {
        const result = await OnboardingDialog.show();
        if (!cancelled) {
          await updateAndSaveConfig({
            onboarding_acknowledged: true,
            executor_profile: result.profile,
            editor: result.editor,
          });
        }
        OnboardingDialog.hide();
        return;
      }

      if (config.show_release_notes) {
        await ReleaseNotesDialog.show();
        if (!cancelled) {
          await updateAndSaveConfig({ show_release_notes: false });
        }
        ReleaseNotesDialog.hide();
        return;
      }
    };

    showNextStep();

    return () => {
      cancelled = true;
    };
  }, [config, updateAndSaveConfig]);

  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider initialTheme={config?.theme || ThemeMode.SYSTEM}>
        <SearchProvider>
          <LegacyDesignScope>
            <Outlet />
          </LegacyDesignScope>
        </SearchProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}

