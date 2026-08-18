import { useState, useCallback } from 'react';
import { i18n, setLocale, getLocale, savePreferredLocale, type AppLocale } from './index';

export function useTranslation() {
  const [locale, setLocaleState] = useState<AppLocale>(getLocale());
  const [, forceRefresh] = useState(0);

  const changeLocale = useCallback(async (newLocale: AppLocale) => {
    setLocale(newLocale);
    setLocaleState(newLocale);
    await savePreferredLocale(newLocale);
    forceRefresh((n) => n + 1);
  }, []);

  return {
    t: i18n.t.bind(i18n),
    locale,
    changeLocale,
  };
}
