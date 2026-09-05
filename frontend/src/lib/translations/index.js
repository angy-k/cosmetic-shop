// Combines the locale dictionaries (./locales/sr.js, ./locales/en.js) into
// translate()/plural()/t(). Reactive components should use useTranslation()
// instead of the Serbian-only t() below.

import sr from './locales/sr';
import en from './locales/en';

// Serbian plural rule: 1->one, 2-4->few, 5+/teens->many. Legacy - prefer plural() below.
export function pluralSr(n, [one, few, many]) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) return few;
  return many;
}

// English only distinguishes singular (1) from plural (everything else).
export function pluralEn(n, [one, other]) {
  return n === 1 ? one : other;
}

const pluralCategory = {
  sr: (n) => {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return 'one';
    if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) return 'few';
    return 'many';
  },
  en: (n) => (n === 1 ? 'one' : 'other'),
};

export const dictionaries = { sr, en };
export const DEFAULT_LANGUAGE = 'sr';

// Looks up a dot-separated key and substitutes {param} placeholders.
export function translate(dict, key, params = {}) {
  const parts = key.split('.');
  let value = dict;
  for (const part of parts) {
    value = value?.[part];
  }
  if (typeof value !== 'string') {
    console.warn(`Missing translation for key: ${key}`);
    return key;
  }
  return value.replace(/\{(\w+)\}/g, (_, k) => (params[k] !== undefined ? String(params[k]) : `{${k}}`));
}

// Resolves the declined form of `wordKey` for `count`, in the given language.
export function plural(language, wordKey, count) {
  const dict = dictionaries[language] || sr;
  const forms = dict.words?.[wordKey];
  if (!forms) return '';
  const category = (pluralCategory[language] || pluralCategory.sr)(count);
  return forms[category] ?? forms.other ?? forms.many ?? '';
}

// Non-reactive, Serbian-only - for places that can't reach the Context (route metadata, global-error.js).
export function t(key, params = {}) {
  return translate(sr, key, params);
}

// Maps a Stripe error.code/decline_code to localized text; null if there's no mapping.
export function translateStripeError(error, language = DEFAULT_LANGUAGE) {
  if (!error) return null;
  const dict = dictionaries[language] || sr;
  if (error.code === 'card_declined') {
    const reason = error.decline_code && dict.payment.declineReasons[error.decline_code];
    return reason || dict.payment.declineGeneric;
  }
  if (error.code && dict.payment.errorCodes[error.code]) {
    return dict.payment.errorCodes[error.code];
  }
  return null;
}

export default sr;
