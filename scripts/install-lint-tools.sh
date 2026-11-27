#!/usr/bin/env bash
# Bootstrap lint/security tools for local hooks.
# Usage: bash scripts/install-lint-tools.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "Installing lint/security tools (versions from .tool-versions)..."

# hadolint
if ! command -v hadolint >/dev/null 2>&1; then
  echo "→ hadolint: install from https://github.com/hadolint/hadolint/releases (v2.15.1)"
fi

# actionlint
if ! command -v actionlint >/dev/null 2>&1; then
  echo "→ actionlint: install from https://github.com/rhysd/actionlint/releases (v1.7.12)"
fi

# zizmor + guarddog + checkov via uv
if command -v uv >/dev/null 2>&1; then
  uv tool install zizmor==1.30.1 2>/dev/null || true
  uv tool install --python 3.13 guarddog==3.2.0 2>/dev/null || true
  uv tool install checkov==3.2.0 2>/dev/null || true
  echo "✅ uv tools installed (zizmor, guarddog, checkov)"
else
  echo "⚠️  uv not found — install uv (https://docs.astral.sh/uv/) and re-run"
fi

echo "Done. Verify with: hadolint --version, actionlint -version, zizmor --version, guarddog --version, checkov --version"
