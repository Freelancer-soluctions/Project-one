import { z } from 'zod';
import i18n from './i18n';

// Set up Zod error map with i18n
const createI18nErrorMap = (i18next) => (issue, ctx) => {
  // Try to find a translation for the current error
  let fallbackMessage = ctx.defaultError || 'Validation error';
  let translationKey = 'zod:common.' + issue.code;
  
  // Try to get a specific translation for the path if it's a known error type
  if (issue.code === 'invalid_union') {
    // For union errors, we use a generic message
    return {
      message: i18next.t(translationKey, {
        defaultValue: fallbackMessage
      })
    };
  }
  
  // Default error map for common validation errors
  return {
    message: i18next.t(`zod.errors.${issue.code}`, {
      defaultValue: fallbackMessage,
      ...issue, // Pass issue data to the translation function
    })
  };
};

// Set the error map
z.setErrorMap(createI18nErrorMap(i18n));

export default createI18nErrorMap;
export { i18n };