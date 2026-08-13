import { useState, useCallback } from 'react';
import { i18n, setLocale, getLocale, type AppLocale } from './index';

export function useTranslation() {
  const [locale, setLocaleState] = useState<AppLocale>(getLocale());

  const changeLocale = useCallback((newLocale: AppLocale) => {
    setLocale(newLocale);
    setLocaleState(newLocale);
  }, []);

  return {
    t: i18n.t.bind(i18n),
    locale,
    changeLocale,
  };
}
