// Language: 'en' | 'ar'. Arabic switches the page to right-to-left.
// Content objects keep English in `key` and Arabic in `key_ar`; tx() picks the right one.
import { createContext, useContext } from 'react';

export const LangContext = createContext('en');
export const useLang = () => useContext(LangContext);

/** t('English', 'عربي') for inline UI strings. */
export function useT() {
  const lang = useLang();
  return (en, ar) => (lang === 'ar' && ar != null ? ar : en);
}

/** Field from a content object: obj.key_ar in Arabic (falls back to obj.key). */
export const tx = (obj, key, lang) => (obj == null ? '' : lang === 'ar' && obj[`${key}_ar`] != null ? obj[`${key}_ar`] : obj[key]);

// Every new visit opens in English. The choice is kept only for the current tab
// (sessionStorage), so a refresh keeps Arabic but a fresh open starts in English.
export function loadLang() {
  try { const v = sessionStorage.getItem('suhail-lang'); return v === 'ar' ? 'ar' : 'en'; } catch { return 'en'; }
}
export function saveLang(v) { try { sessionStorage.setItem('suhail-lang', v); } catch { /* private mode */ } }
