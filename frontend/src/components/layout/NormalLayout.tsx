import { Outlet, useRouterState } from '@tanstack/react-router';
import { DevBanner } from '@/components/DevBanner';
import { Navbar } from '@/components/layout/Navbar';

export function NormalLayout() {
  const view = useRouterState({
    select: (s) => (s.location.search as { view?: string } | undefined)?.view,
  });
  // Only hide the navbar for true fullscreen preview mode.
  // Diffs should not hide global navigation; only the tasks third column changes.
  const shouldHideNavbar = view === 'preview';

  return (
    <>
      <div className="flex flex-col h-screen">
        <DevBanner />
        {!shouldHideNavbar && <Navbar />}
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>
    </>
  );
}
