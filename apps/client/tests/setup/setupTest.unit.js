import { expect, afterEach } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

import { cleanup } from '@testing-library/react';

// No MSW — unit tests son aislados, sin red
afterEach(() => {
  cleanup();
});
