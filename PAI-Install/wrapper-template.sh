#!/usr/bin/env bash
#
# PAI-OpenCode Wrapper — {AI_NAME}-wrapper
#
# WHY: PAI-OpenCode runs on vanilla OpenCode. This wrapper only provides:
#   1. A symlink health check for ~/.opencode (the PAI installation).
#   2. A convenient way to install OpenCode if it is missing.
#   3. A status report for debugging.
#
# Usage:
#   {AI_NAME}-wrapper [opencode args...]
#   {AI_NAME}-wrapper --status         # Show install info and symlink health
#   {AI_NAME}-wrapper --install        # Install vanilla OpenCode via opencode.ai
#   {AI_NAME}-wrapper --fix-symlink    # Recreate ~/.opencode symlink to current PWD
#   {AI_NAME}-wrapper --help-wrapper   # Show this help
#
# Called from .zshrc {AI_NAME}() function:
#   {AI_NAME}() {
#     {AI_NAME}-wrapper "$@"
#   }
#

set -euo pipefail

# ─── Configuration ─────────────────────────────────────────
AI_NAME="{AI_NAME}"

# Detect OpenCode location. Prefer the official installer output, then
# fall back to common alternatives (~/.local/bin, Homebrew).
#
# Note on symlinks: when the user runs `{AI_NAME}-wrapper --fix-symlink`,
# `~/.opencode` becomes a symlink to the PAI install repo (not a real
# directory containing a `bin/` subdir). In that case `~/.opencode/bin/opencode`
# resolves through the symlink into the repo, which does NOT contain the
# vanilla binary. We therefore resolve the real target of `~/.opencode`
# first and only trust `${HOME}/.opencode/bin/opencode` when the real
# target is itself a directory (i.e. the vanilla installer layout).
OPENCODE_BIN=""

_pai_real_opencode_dir=""
if [[ -L "${HOME}/.opencode" ]]; then
    _pai_real_opencode_dir=$(readlink -f "${HOME}/.opencode" 2>/dev/null || readlink "${HOME}/.opencode" 2>/dev/null || true)
elif [[ -d "${HOME}/.opencode" ]]; then
    _pai_real_opencode_dir="${HOME}/.opencode"
fi

# Only consider ~/.opencode/bin/opencode if the real target looks like the
# vanilla installer layout (has a bin/opencode). The symlink-to-repo case
# will fall through to the other candidates.
if [[ -n "${_pai_real_opencode_dir}" ]] && [[ -x "${_pai_real_opencode_dir}/bin/opencode" ]]; then
    OPENCODE_BIN="${_pai_real_opencode_dir}/bin/opencode"
fi

if [[ -z "${OPENCODE_BIN}" ]]; then
    for candidate in \
        "${HOME}/.local/bin/opencode" \
        "/opt/homebrew/bin/opencode" \
        "/usr/local/bin/opencode"; do
        if [[ -x "${candidate}" ]]; then
            OPENCODE_BIN="${candidate}"
            break
        fi
    done
fi

# Fallback: whatever is on PATH (skipping any alias that points back at us).
if [[ -z "${OPENCODE_BIN}" ]] && command -v opencode &>/dev/null; then
    OPENCODE_BIN="$(command -v opencode)"
fi

# Resolve PAI installation directory from ~/.opencode symlink
PAI_INSTALL_DIR=""
if [[ -L "${HOME}/.opencode" ]]; then
    PAI_INSTALL_DIR=$(readlink -f "${HOME}/.opencode" 2>/dev/null || readlink "${HOME}/.opencode" 2>/dev/null)
fi

# ─── Colors ────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# ─── Install Vanilla OpenCode ─────────────────────────────
install_opencode() {
    echo -e "${BLUE}[${AI_NAME}]${NC} Installing vanilla OpenCode from opencode.ai..."
    if curl -fsSL https://opencode.ai/install | bash; then
        echo -e "${GREEN}[${AI_NAME}]${NC} OpenCode installed successfully."
        echo -e "${BLUE}[${AI_NAME}]${NC} You may need to open a new shell for PATH changes to take effect."
        return 0
    else
        echo -e "${RED}[${AI_NAME}]${NC} OpenCode install failed. Try manually:"
        echo -e "  curl -fsSL https://opencode.ai/install | bash"
        return 1
    fi
}

# ─── Fix Symlink ──────────────────────────────────────────
fix_symlink() {
    echo -e "${BLUE}[${AI_NAME}]${NC} Checking ~/.opencode symlink..."

    local target_dir="${PWD}/.opencode"
    local symlink_path="${HOME}/.opencode"

    # Check if target directory exists
    if [[ ! -d "${target_dir}" ]]; then
        echo -e "${RED}[${AI_NAME}]${NC} No .opencode directory found in current directory: ${PWD}"
        echo -e "${YELLOW}[${AI_NAME}]${NC} Run the installer first to create the installation."
        return 1
    fi

    # Check current symlink status
    if [[ -L "${symlink_path}" ]]; then
        local current_target
        current_target=$(readlink -f "${symlink_path}" 2>/dev/null || readlink "${symlink_path}" 2>/dev/null)
        if [[ "${current_target}" == "${target_dir}" ]]; then
            echo -e "${GREEN}[${AI_NAME}]${NC} Symlink is already correct!"
            echo -e "${GREEN}[${AI_NAME}]${NC} ~/.opencode → ${target_dir}"
            return 0
        else
            echo -e "${YELLOW}[${AI_NAME}]${NC} Symlink points to wrong location: ${current_target}"
            echo -e "${BLUE}[${AI_NAME}]${NC} Updating to: ${target_dir}"
            rm -f "${symlink_path}"
        fi
    elif [[ -e "${symlink_path}" ]]; then
        echo -e "${RED}[${AI_NAME}]${NC} ~/.opencode exists but is not a symlink!"
        echo -e "${YELLOW}[${AI_NAME}]${NC} Please backup and remove it manually:"
        echo "  mv ~/.opencode ~/.opencode.backup-$(date +%Y%m%d)"
        return 1
    fi

    # Create symlink
    ln -s "${target_dir}" "${symlink_path}"
    echo -e "${GREEN}[${AI_NAME}]${NC} Symlink created!"
    echo -e "${GREEN}[${AI_NAME}]${NC} ~/.opencode → ${target_dir}"
    echo ""
    echo -e "${BLUE}[${AI_NAME}]${NC} You can now use ${AI_NAME} from any directory."
}

# ─── Check Symlink Health ────────────────────────────────
check_symlink_health() {
    local symlink_path="${HOME}/.opencode"

    if [[ ! -L "${symlink_path}" ]]; then
        if [[ -d "${symlink_path}" ]]; then
            echo "DIRECTORY"
        else
            echo "MISSING"
        fi
        return
    fi

    local target
    target=$(readlink -f "${symlink_path}" 2>/dev/null || readlink "${symlink_path}" 2>/dev/null)

    if [[ ! -d "${target}" ]]; then
        echo "BROKEN"
    else
        echo "OK"
    fi
}

# ─── Show Status ─────────────────────────────────────────
show_status() {
    local opencode_version="not installed"
    if [[ -n "${OPENCODE_BIN}" ]] && [[ -x "${OPENCODE_BIN}" ]]; then
        opencode_version=$("${OPENCODE_BIN}" --version 2>/dev/null || echo "unknown")
    fi
    local symlink_status
    symlink_status=$(check_symlink_health)
    local install_dir="${PAI_INSTALL_DIR:-"not detected"}"

    echo -e "${CYAN}${AI_NAME} - PAI-OpenCode Status${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "OpenCode binary:  ${OPENCODE_BIN:-"not found"}"
    echo -e "OpenCode version: ${opencode_version}"
    echo -e "Symlink:          ${symlink_status}"
    if [[ "${symlink_status}" == "BROKEN" ]]; then
        echo -e "${RED}  ⚠ Symlink is broken! Run: ${AI_NAME}-wrapper --fix-symlink${NC}"
    elif [[ "${symlink_status}" == "DIRECTORY" ]]; then
        echo -e "${YELLOW}  ⚠ ~/.opencode is a directory, not a symlink${NC}"
    elif [[ "${symlink_status}" == "MISSING" ]]; then
        echo -e "${YELLOW}  ⚠ Symlink missing! Run: ${AI_NAME}-wrapper --fix-symlink${NC}"
    else
        echo -e "  → ${install_dir}"
    fi
    echo ""
    echo -e "${BLUE}Install OpenCode:${NC} ${YELLOW}${AI_NAME}-wrapper --install${NC}"
    echo -e "${BLUE}Fix symlink:${NC}      ${YELLOW}${AI_NAME}-wrapper --fix-symlink${NC}"
}

# ─── Main ───────────────────────────────────────────────
main() {
    case "${1:-}" in
        --status)
            show_status
            exit 0
            ;;
        --install)
            install_opencode
            exit $?
            ;;
        --fix-symlink)
            fix_symlink
            exit $?
            ;;
        --help-wrapper)
            echo "${AI_NAME}-wrapper - PAI-OpenCode Launcher"
            echo ""
            echo "Runs vanilla OpenCode with PAI configuration from ~/.opencode."
            echo ""
            echo "Special commands:"
            echo "  --status        Show install info and symlink health"
            echo "  --install       Install vanilla OpenCode via opencode.ai"
            echo "  --fix-symlink   Recreate ~/.opencode symlink to current directory"
            echo "  --help-wrapper  Show this help"
            echo ""
            echo "All other arguments are passed to opencode."
            echo ""
            echo "OpenCode binary: ${OPENCODE_BIN:-"not found — run --install"}"
            echo "Install:         ${PAI_INSTALL_DIR:-"unknown (run --fix-symlink)"}"
            exit 0
            ;;
    esac

    # Check symlink health before running
    local symlink_status
    symlink_status=$(check_symlink_health)
    if [[ "${symlink_status}" != "OK" ]]; then
        echo -e "${RED}[${AI_NAME}]${NC} ~/.opencode symlink is ${symlink_status}!"
        echo -e "${YELLOW}[${AI_NAME}]${NC} Run: ${AI_NAME}-wrapper --fix-symlink"
        exit 1
    fi

    # Verify OpenCode binary exists
    if [[ -z "${OPENCODE_BIN}" ]] || [[ ! -x "${OPENCODE_BIN}" ]]; then
        echo -e "${RED}[${AI_NAME}]${NC} OpenCode binary not found."
        echo -e "${YELLOW}[${AI_NAME}]${NC} Install it: ${AI_NAME}-wrapper --install"
        echo -e "${YELLOW}[${AI_NAME}]${NC} Or manually: curl -fsSL https://opencode.ai/install | bash"
        exit 1
    fi

    # Run vanilla OpenCode
    exec "${OPENCODE_BIN}" "$@"
}

main "$@"
