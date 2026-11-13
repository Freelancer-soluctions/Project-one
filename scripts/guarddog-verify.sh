#!/usr/bin/env bash
# ============================================================
# GuardDog verify — política como código (change `typosquatting-detection`)
# ============================================================
# ÚNICO punto de configuración de la capa de typosquatting (jobs CI
# `typosquat-guarddog` / `guarddog-weekly`, pre-commit y validación
# local lo invocan — cero flags de política dispersos en workflows).
#
# Por qué un wrapper y no un fichero de configuración: GuardDog v3.2.0
# NO soporta config files — su configuración oficial son variables de
# entorno y flags CLI (README v3.2.0, sección "Configuration via
# Environment Variables"). Un `.guarddog.yml` sería un fichero muerto.
#
# Uso: la salida SARIF la redirige el llamador:
#   bash scripts/guarddog-verify.sh > guarddog.sarif
#
# Cambios de política = PR (auditable) con review de CODEOWNERS.

set -u

# ------------------------------------------------------------
# Política: devDependencies EXCLUIDAS del escaneo (blocking desde día uno).
# Para incluirlas: PR que cambie esto a `true` con justificación.
# ------------------------------------------------------------
export GUARDDOG_NPM_INCLUDE_DEV_DEPENDENCIES=false

# ------------------------------------------------------------
# Exclusiones de reglas (selectivas, justificadas por regla).
# Blocking desde día uno: NINGUNA excluida. Exclusiones (si se necesitan)
# se añaden aquí con justificación (qué regla, por qué, hasta cuándo).
#
# Formato: --exclude-rules <regla> (repetible). Reglas npm reales
# en v3.2.0 (RULES.md): threat.metadata.typosquatting,
# threat-npm-dependency-confusion, threat-runtime-obfuscation-unicode,
# deceptive_author, unclaimed_maintainer_email_domain,
# risky_new_dependency, provenance_regression,
# threat-npm-preinstall-script. NO existe `new_install_script`.
#
# Ejemplo de exclusión justificada (plantilla):
#   EXCLUDE+=(threat.metadata.typosquatting)  # por qué: ...; hasta: ...
# ------------------------------------------------------------

# Pin estricto de versión (nunca `latest`). Verificación abajo.
GUARDDOG_PIN='3.2.0'

# Intérprete PINADO. NO quitar: uvx elige por defecto el Python más nuevo que
# encuentre (hoy 3.14 en los runners, vía setup-uv) y guarddog 3.2.0 exige
# `pygit2>=1.11,<1.19` + `yara-python ^4.5.4`, que NO publican wheels para
# cp314: uv cae a compilar desde fuente y falla → `--version` sale vacío y el
# paso aborta con "guarddog.sarif vacio" (verificado 2026-11-06 con
# `uv pip compile --python-version 3.14 --no-build`: insatisfacible).
# 3.13 sí resuelve (wheels cp313 de pygit2/yara-python) y es la versión con la
# que el job pasó originalmente. uv la descarga (managed) si no está.
GUARDDOG_PYTHON='3.13'

# Verificación de versión ANTES del scan (si difiere → fallo del paso;
# uvx resolvería `latest` si el pin se pierde — esto lo detecta).
# stderr se captura aparte: el llamador redirige stdout al .sarif, así que un
# error de uv NUNCA debe acabar ahí (lo vería upload-sarif como SARIF roto);
# se reemite por stderr para que quede en el log del job.
guarddog_stderr="$(mktemp)"
guarddog_version="$(uvx --python "${GUARDDOG_PYTHON}" "guarddog==${GUARDDOG_PIN}" --version 2>"${guarddog_stderr}" || true)"
case "${guarddog_version}" in
  *"${GUARDDOG_PIN}"*) : ;;
  *)
    cat "${guarddog_stderr}" >&2 || :
    echo "ERROR: guarddog version mismatch (esperado ${GUARDDOG_PIN}, obtenido: '${guarddog_version}')" >&2
    rm -f "${guarddog_stderr}"
    exit 1
    ;;
esac
rm -f "${guarddog_stderr}"

# Sandbox Landlock/Seatbelt OBLIGATORIO (nunca --no-sandbox): si la
# plataforma no lo soporta, el scan falla — comportamiento seguro por
# defecto (mitiga CVE-2022-23530/31, CVE-2026-22870/871). En Windows
# nativo fallará (GuardDog solo soporta Windows vía Docker): los
# consumidores llaman este script con `|| true` (para generar la evidencia) y
# el gate bloqueante parsea el SARIF, no el exit code.
#
# `--output-format sarif` es OBLIGATORIO: los jobs `typosquat-guarddog` /
# `guarddog-weekly` y el hook pre-commit redirigen stdout a un .sarif que
# se sube a Code Scanning (upload-sarif valida el JSON). Sin el flag,
# GuardDog imprime texto plano y el "SARIF" queda corrupto/invalido.

# ------------------------------------------------------------
# Alcance del escaneo: manifiestos de PRODUCTO (raíz + workspaces declarados
# en `package.json`). GuardDog `npm verify` recorre el árbol completo y NO
# tiene flag de exclusión, así que se monta un espejo temporal con solo esos
# manifiestos. Se conserva la ruta relativa (misma forma de árbol) para que
# las URIs del SARIF sigan siendo repo-relativas y Code Scanning no marque
# rutas inexistentes.
#
# Quedan fuera `.opencode/**` y `docs/opencode/**`: son manifiestos de
# tooling de agentes, no dependencias que se distribuyan con el producto, y
# sus paquetes (plugins/SDK) disparan heurísticas `capability-*`
# (network-outbound, process-spawn) que no describen un typosquat. Si en el
# futuro alguno pasa a ser dependencia de producto, basta con declararlo como
# workspace y entra automáticamente.
# ------------------------------------------------------------
GUARDDOG_SCOPE="$(mktemp -d)"
trap 'rm -rf "${GUARDDOG_SCOPE}"' EXIT

node - "${GUARDDOG_SCOPE}" <<'NODE'
const fs = require('node:fs');
const path = require('node:path');

const out = process.argv[2];
const root = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const dirs = ['.'];

for (const pattern of root.workspaces || []) {
  if (pattern.endsWith('/*')) {
    const base = pattern.slice(0, -2);
    for (const entry of fs.readdirSync(base)) {
      const dir = path.join(base, entry);
      if (fs.existsSync(path.join(dir, 'package.json'))) dirs.push(dir);
    }
  } else if (fs.existsSync(path.join(pattern, 'package.json'))) {
    dirs.push(pattern);
  }
}

for (const dir of dirs) {
  fs.mkdirSync(path.join(out, dir), { recursive: true });
  fs.copyFileSync(
    path.join(dir, 'package.json'),
    path.join(out, dir, 'package.json')
  );
}
NODE

( cd "${GUARDDOG_SCOPE}" && uvx --python "${GUARDDOG_PYTHON}" "guarddog==${GUARDDOG_PIN}" npm verify . --output-format sarif "$@" )
