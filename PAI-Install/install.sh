#!/usr/bin/env bash
# PAI-OpenCode Installer Bootstrap
#
# WHY: Single entry point for terminal installer flows.
#
# Usage:
#   bash install.sh                     # Interactive wizard (default)
#   bash install.sh --headless [args]  # Non-interactive CLI installer
#   bash install.sh --cli [args]       # Backward-compatible alias for --headless
#

set -euo pipefail

# ─── Colors ────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ─── Helpers ───────────────────────────────────────────────
info() { echo -e "${BLUE}[installer]${NC} $*"; }
success() { echo -e "${GREEN}[installer]${NC} $*"; }
warn() { echo -e "${YELLOW}[installer]${NC} $*"; }
error() { echo -e "${RED}[installer]${NC} $*" >&2; }

# ─── Resolve Script Directory ────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ─── Check/Install Bun ───────────────────────────────────
if command -v bun &>/dev/null; then
  success "Bun found: v$(bun --version 2>/dev/null || echo 'unknown')"
else
  info "Installing Bun runtime..."
  curl -fsSL https://bun.sh/install | bash 2>/dev/null

  # Add to PATH for this session
  export PATH="$HOME/.bun/bin:$PATH"

  if command -v bun &>/dev/null; then
    success "Bun installed: v$(bun --version 2>/dev/null || echo 'unknown')"
  else
    error "Failed to install Bun. Please install manually: https://bun.sh"
    exit 1
  fi
fi

# ─── Check OpenCode ───────────────────────────────────
if command -v opencode &>/dev/null; then
  success "OpenCode found"
else
  warn "OpenCode not found — will install during setup"
fi

# ─── Launch Installer (terminal wizard + headless CLI) ─────────────────────
INSTALLER_DIR="$SCRIPT_DIR"

if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
	cat <<'EOF'
PAI-OpenCode installer bootstrap

Usage:
  bash PAI-Install/install.sh
    Launch interactive TypeScript installation wizard.

  bash PAI-Install/install.sh --headless [quick-install flags]
    Run non-interactive installer (for CI/scripts).

  bash PAI-Install/install.sh --cli [quick-install flags]
    Backward-compatible alias for --headless.

Examples:
  bash PAI-Install/install.sh
  bash PAI-Install/install.sh --headless --preset zen --name "Your Name" --ai-name "Jeremy"
  bash PAI-Install/install.sh --headless --migrate

Headless flags:
  bun PAI-Install/cli/quick-install.ts --help
EOF
	exit 0
fi

info "Preparing installer..."
echo ""

# Scan args so removed flags cannot slip through
args=("$@")
mode="wizard"

for ((i = 0; i < ${#args[@]}; i++)); do
	arg="${args[$i]}"
	next="${args[$((i + 1))]:-}"

	if [ "$arg" = "--cli" ]; then
		if [ $i -eq 0 ] && [ "$mode" = "wizard" ]; then
			mode="headless"
		else
			error "Flag --cli must be the first argument when used as alias for --headless."
			exit 2
		fi
	fi

	if [ "$arg" = "--headless" ]; then
		if [ $i -eq 0 ] && [ "$mode" = "wizard" ]; then
			mode="headless"
		else
			error "Flag --headless must be the first argument."
			exit 2
		fi
	fi

	if [ "$arg" = "--gui" ] || [ "$arg" = "--mode=gui" ] || { [ "$arg" = "--mode" ] && [ "$next" = "gui" ]; }; then
		error "Requested GUI mode was removed. Use CLI options."
		exit 2
	fi

	if [ "$arg" = "--mode" ] || [[ "$arg" == --mode=* ]]; then
		error "Flag --mode is not supported. Use --migrate or --update."
		exit 2
	fi

	# Route quick-install flags to headless automatically for backward compatibility.
	if [ "$mode" = "wizard" ]; then
		case "$arg" in
			--preset|--name|--ai-name|--timezone|--api-key|--elevenlabs-key|--backup-dir)
				mode="headless"
				;;
			--fresh|--migrate|--update|--skip-build|--no-voice|--dry-run|--version)
				mode="headless"
				;;
			--preset=*|--name=*|--ai-name=*|--timezone=*|--api-key=*|--elevenlabs-key=*|--backup-dir=*)
				mode="headless"
				;;
		esac
	fi
done

# Backward-compatible alias stripping
if [ "${1:-}" = "--cli" ] || [ "${1:-}" = "--headless" ]; then
	shift
fi

if [ "$mode" = "headless" ]; then
	info "Launching headless CLI installer..."
	exec bun "$INSTALLER_DIR/cli/quick-install.ts" "$@"
fi

info "Launching interactive TypeScript installer wizard..."
exec bun "$INSTALLER_DIR/cli/install-wizard.ts" "$@"
