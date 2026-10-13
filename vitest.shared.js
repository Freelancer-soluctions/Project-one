import { defineConfig } from 'vitest/config';
import HistorySequencer from './vitest.sequencer.js';

// Opt-out del fail-first en el tier de seguridad (design D7 de `tia-hardening`):
// con `TIA_SEQUENCER=stable` (nightly-full-suite.yml) NO se fija `sequencer`,
// de modo que Vitest aplica su resolución por defecto — `BaseSequencer`, o
// `RandomSequencer` cuando el run pide `--sequence.shuffle` (auditoría de
// order-dependence, `order-dependence-audit.yml`). Fijar aquí `BaseSequencer`
// bloquearía el flag de CLI y dejaría la auditoría sin shuffle real.
const stableOrder = process.env.TIA_SEQUENCER === 'stable';

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 30000,
    hookTimeout: 15000,
    teardownTimeout: 5000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
    },
    sequence: stableOrder ? {} : { sequencer: HistorySequencer },
  },
});
