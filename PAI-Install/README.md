# PAI OpenCode Installer

Terminal installer for PAI OpenCode with two modes:

- Interactive TypeScript wizard (default)
- Headless CLI installer (for CI/scripted installs)

## Quick Start

```bash
bash PAI-Install/install.sh

# Show bootstrap help (wizard + headless options)
bash PAI-Install/install.sh --help

# Headless example: fresh install (Zen)
bash PAI-Install/install.sh --headless --preset zen --name "Your Name" --ai-name "Jeremy"
```

> [!note]
> The `--cli` flag is still accepted as an alias for `--headless`.

## What This Installer Does

1. Detects install mode (fresh install, v2->v3 migration, or v3 update)
2. Checks prerequisites (git, bun)
3. Optionally builds a custom OpenCode binary (model tiers)
4. Generates/updates `opencode.json` and `~/.opencode/*`
5. Installs PAI files into `~/.opencode/`

## Directory Structure

```text
PAI-Install/
├── install.sh              # Bootstrap (Bun + CLI entrypoint)
├── cli/
│   ├── install-wizard.ts   # Interactive terminal wizard
│   └── quick-install.ts    # Headless/CLI installer
├── engine/                 # Install engine (fresh/migrate/update)
│   ├── actions.ts
│   ├── build-opencode.ts
│   ├── config-gen.ts
│   ├── detect.ts
│   ├── index.ts
│   ├── migrate.ts
│   ├── provider-models.ts
│   ├── state.ts
│   ├── steps-fresh.ts
│   ├── steps-migrate.ts
│   ├── steps-update.ts
│   ├── types.ts
│   ├── update.ts
│   └── validate.ts
└── wrapper-template.sh      # Optional OpenCode wrapper script template
```

## Notes

- GUI installer was removed. Installer stays terminal-only.
- `install.sh` runs the interactive wizard by default.
- Use `--headless` (or legacy `--cli`) to run non-interactive quick install.

## Post-Installation

After installation, you'll have:

- `~/.opencode/skills/` — PAI skills and tools
- `~/.opencode/plugins/` — Event handlers
- `~/.opencode/commands/` — Custom OpenCode commands
- `~/.opencode/MEMORY/` — Working memory and state
- `~/.opencode/opencode.json` — OpenCode config with model tiers

## Upgrade from v2.x

See [UPGRADE.md](/UPGRADE.md) for migration instructions.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Bun not found | Installer will auto-install Bun |
| Permission denied | Run with `bash` not `sh` |

## Requirements

- macOS 10.15+ or Linux
- bash 4.0+
- curl
- 500MB free disk space

---

*Part of PAI-OpenCode v3.0 — Personal AI Infrastructure*
