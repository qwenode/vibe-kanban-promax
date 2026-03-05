import { Outlet, useRouterState } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Button, Divider, Nav, Typography } from '@douyinfe/semi-ui';
import {
  Settings,
  Cpu,
  Server,
  X,
  FolderOpen,
  GitBranch,
} from 'lucide-react';
import { useEffect } from 'react';
import { useHotkeysContext } from 'react-hotkeys-hook';
import { useKeyExit } from '@/keyboard/hooks';
import { Scope } from '@/keyboard/registry';
import { usePreviousPath } from '@/hooks/usePreviousPath';
import { useNavigate } from '@tanstack/react-router';

const settingsNavigation = [
  {
    path: 'general',
    icon: Settings,
  },
  {
    path: 'projects',
    icon: FolderOpen,
  },
  {
    path: 'repos',
    icon: GitBranch,
  },
  {
    path: 'agents',
    icon: Cpu,
  },
  {
    path: 'mcp',
    icon: Server,
  },
];

export function SettingsLayout() {
  const { t } = useTranslation('settings');
  const { enableScope, disableScope } = useHotkeysContext();
  const goToPreviousPath = usePreviousPath();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  // Enable SETTINGS scope when component mounts
  useEffect(() => {
    enableScope(Scope.SETTINGS);
    return () => {
      disableScope(Scope.SETTINGS);
    };
  }, [enableScope, disableScope]);

  // Register ESC keyboard shortcut
  useKeyExit(goToPreviousPath, { scope: Scope.SETTINGS });

  return (
    <div className="h-full overflow-auto">
      <div className="container mx-auto px-4 py-8">
        {/* Header with title and close button */}
        <div className="sticky top-0 z-10 -mx-4 px-4 pt-4">
          <div className="flex items-center justify-between">
            <Typography.Title heading={3} className="!m-0">
              {t('settings.layout.nav.title')}
            </Typography.Title>
            <Button theme="borderless" icon={<X size={16} />} onClick={goToPreviousPath}>
              <span className="text-xs font-medium">ESC</span>
            </Button>
          </div>
          <Divider margin="12px 0 0 0" />
        </div>
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <aside className="w-full lg:w-64 lg:shrink-0 lg:sticky lg:top-24 lg:h-fit lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto">
            <div className="rounded-lg border border-[var(--semi-color-border)]">
              <Nav
                mode="vertical"
                selectedKeys={[
                  (pathname.split('/')[2] || 'general') as unknown as string,
                ]}
                items={settingsNavigation.map((item) => {
                  const Icon = item.icon;
                  return {
                    itemKey: item.path,
                    icon: <Icon size={16} />,
                    text: (
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">
                          {t(`settings.layout.nav.${item.path}`)}
                        </div>
                        <div>{t(`settings.layout.nav.${item.path}Desc`)}</div>
                      </div>
                    ),
                  };
                })}
                onSelect={(data) => {
                  navigate({ to: `/settings/${String(data.itemKey)}` as never });
                }}
              />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
