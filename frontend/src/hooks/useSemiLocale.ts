import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import enGB from '@douyinfe/semi-ui/lib/es/locale/source/en_GB';
import es from '@douyinfe/semi-ui/lib/es/locale/source/es';
import fr from '@douyinfe/semi-ui/lib/es/locale/source/fr';
import jaJP from '@douyinfe/semi-ui/lib/es/locale/source/ja_JP';
import koKR from '@douyinfe/semi-ui/lib/es/locale/source/ko_KR';
import zhCN from '@douyinfe/semi-ui/lib/es/locale/source/zh_CN';
import zhTW from '@douyinfe/semi-ui/lib/es/locale/source/zh_TW';

type SemiLocale = typeof enGB;

export function useSemiLocale(): SemiLocale {
  const { i18n } = useTranslation();

  return useMemo(() => {
    const lang = (i18n.resolvedLanguage || i18n.language || 'en').toLowerCase();

    if (lang === 'zh-hans' || lang === 'zh-cn' || lang === 'zh') return zhCN;
    if (lang === 'zh-hant' || lang === 'zh-tw' || lang === 'zh-hk')
      return zhTW;

    if (lang.startsWith('fr')) return fr;
    if (lang.startsWith('ja')) return jaJP;
    if (lang.startsWith('es')) return es;
    if (lang.startsWith('ko')) return koKR;

    return enGB;
  }, [i18n.language, i18n.resolvedLanguage]);
}

