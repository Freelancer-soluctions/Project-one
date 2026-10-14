import { config } from 'dotenv';
import fc from 'fast-check';

config({
  path: './.env.test',
});

fc.configureGlobal({
  numRuns: process.env.CI ? 1000 : 100,
  ...(process.env.CI ? { seed: 42 } : {}),
});
