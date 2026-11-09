import { config } from 'dotenv';
import fc from 'fast-check';

config({
  path: './.env.test',
});

/**
 * Configuración global de fast-check (change `pbt-hardening`, tareas 4.3 y 6.3).
 *
 * Precedencia de `numRuns`: `PBT_NUMRUNS` > default por entorno (CI 1000, local
 * 100). La exploración nocturna (`.github/workflows/pbt-nightly.yml`) sube el
 * presupuesto a miles de casos sin tocar código.
 *
 * Precedencia de `seed`: `PBT_SEED` > 42 en CI > aleatoria en local. CI mantiene
 * la semilla fija para que un rojo sea reproducible; la corrida nocturna inyecta
 * una semilla aleatoria para explorar inputs nuevos.
 *
 * `maxSkipsPerRun` acota los descartes: una propiedad que evita el 90% de sus
 * casos genera poco valor y debe reescribirse, así que 50 skips se consideran
 * fallo en lugar de pasar desapercibidos.
 */
const envNumRuns = Number(process.env.PBT_NUMRUNS);
const envSeed = Number(process.env.PBT_SEED);
const numRuns =
  Number.isFinite(envNumRuns) && envNumRuns > 0
    ? envNumRuns
    : process.env.CI
      ? 1000
      : 100;
const seed = Number.isFinite(envSeed)
  ? envSeed
  : process.env.CI
    ? 42
    : undefined;

fc.configureGlobal({
  numRuns,
  maxSkipsPerRun: 50,
  ...(seed === undefined ? {} : { seed }),
});
