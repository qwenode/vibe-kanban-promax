import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
// CSS is now imported by design scope components (LegacyDesignScope, NewDesignScope)

import { QueryClientProvider } from '@tanstack/react-query';
import i18n from './i18n';
// Import modal type definitions
import './types/modals';
import { queryClient } from '@/lib/queryClient';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <React.Suspense
        fallback={<p>{i18n.t('common:states.error')}</p>}
      >
        <App />
        {/*<TanStackDevtools plugins={[FormDevtoolsPlugin()]} />*/}
        {/* <ReactQueryDevtools initialIsOpen={false} /> */}
      </React.Suspense>
    </QueryClientProvider>
  </React.StrictMode>
);
