import { ReactNode, useState } from 'react';
import { PortalContainerContext } from '@/contexts/PortalContainerContext';
import NiceModal from '@ebay/nice-modal-react';
import '@/styles/legacy/index.css';
import 'semi-ui-css';
import { ConfigProvider, LocaleProvider } from '@douyinfe/semi-ui';
import { useSemiLocale } from '@/hooks/useSemiLocale';

interface LegacyDesignScopeProps {
  children: ReactNode;
}

export function LegacyDesignScope({ children }: LegacyDesignScopeProps) {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const locale = useSemiLocale();

  return (
    <div ref={setContainer} className="legacy-design min-h-screen">
      {container && (
        <PortalContainerContext.Provider value={container}>
          <LocaleProvider locale={locale}>
            <ConfigProvider locale={locale} getPopupContainer={() => container}>
              <NiceModal.Provider>{children}</NiceModal.Provider>
            </ConfigProvider>
          </LocaleProvider>
        </PortalContainerContext.Provider>
      )}
    </div>
  );
}
