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
# Política: devDependencies EXCLUIDAS del escaneo (FASE 1).
# Para incluirlas: PR que cambie esto a `true` con justificación.
# ------------------------------------------------------------
export GUARDDOG_NPM_INCLUDE_DEV_DEPENDENCIES=false

# ------------------------------------------------------------
# Exclusiones de reglas (selectivas, justificadas por regla).
# FASE 1: NINGUNA excluida — acumular runs advisory antes de
# excluir nada (la promoción a FASE 2 exige clasificar el ruido).
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

# Verificación de versión ANTES del scan (si difiere → fallo del paso;
# uvx resolvería `latest` si el pin se pierde — esto lo detecta).
guarddog_version="$(uvx "guarddog==${GUARDDOG_PIN}" --version 2>/dev/null || true)"
case "${guarddog_version}" in
  *"${GUARDDOG_PIN}"*) : ;;
  *)
    echo "ERROR: guarddog version mismatch (esperado ${GUARDDOG_PIN}, obtenido: '${guarddog_version}')" >&2
    exit 1
    ;;
esac

# Sandbox Landlock/Seatbelt OBLIGATORIO (nunca --no-sandbox): si la
# plataforma no lo soporta, el scan falla — comportamiento seguro por
# defecto (mitiga CVE-2022-23530/31, CVE-2026-22870/871). En Windows
# nativo fallará (GuardDog solo soporta Windows vía Docker): los
# consumidores llaman este script con `|| true` (advisory).
exec uvx "guarddog==${GUARDDOG_PIN}" npm verify package.json "$@"
