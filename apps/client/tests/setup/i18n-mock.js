import i18n from '@/config/i18n';

// Mock i18n for tests
const i18nMock = {
  t: (key) => {
    // Return the key or a default value for testing
    return key.includes(':') ? key : `translation:${key}`;
  },
  init: () => {},
  changeLanguage: () => Promise.resolve(),
  // Add other methods as needed
};

export { i18nMock as i18n };