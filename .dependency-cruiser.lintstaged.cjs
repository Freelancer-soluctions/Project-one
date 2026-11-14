const base = require('./.dependency-cruiser.cjs');

module.exports = {
  ...base,
  rules: {
    ...base.rules,
    'no-orphans': { severity: 'off' },
  },
};
