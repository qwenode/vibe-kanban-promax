import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Banner from '@douyinfe/semi-ui/lib/es/banner';

export function DevBanner() {
  const { t } = useTranslation();

  // Only show in development mode
  if (import.meta.env.MODE !== 'development') {
    return null;
  }

  return (
    <Banner
      type="warning"
      fullMode
      bordered={false}
      icon={<AlertTriangle size={16} />}
      description={t('devMode.banner')}
    />
  );
}
