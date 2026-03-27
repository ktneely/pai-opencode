---
prd: true
id: PRD-20260327-install-docs-cleanup
status: COMPLETE
mode: interactive
effort_level: Extended
created: 2026-03-27
updated: 2026-03-27
iteration: 0
maxIterations: 128
loopStatus: null
last_phase: VERIFY
failing_criteria: []
verification_summary: "13/13"
parent: null
children: []
---

# pai-opencode install + docs cleanup (v3)

Delete retired install artifacts (wizard + GUI), make CLI installer canonical, and update all docs accordingly.

## STATUS

| What | State |
|---|---|
| Progress | 13/13 criteria passing |
| Phase | COMPLETE |
| Next action | None |
| Blocked by | Nothing |

## CONTEXT

### Problem Space
The repo currently documents multiple install paths (wizard vs PAI-Install) and includes GUI components that are not desired. The goal is a single CLI-only install flow and docs that match reality.

### Key Files
- `PAI-Install/install.sh` - Installer bootstrap entrypoint
- `PAI-Install/cli/quick-install.ts` - Headless installer implementation
- `README.md` - Project overview + quick start
- `INSTALL.md` - Canonical installation guide
- `docs/` - Supporting documentation

### Constraints
- Remove GUI installer (Electron/web/public).
- Remove `.opencode/PAIOpenCodeWizard.ts` wizard.
- Documentation must not reference removed entrypoints.

## PLAN

- Make `PAI-Install/install.sh` CLI-only (no GUI path).
- Delete GUI directories and broken GUI entrypoint (`PAI-Install/main.ts`).
- Delete wizard (`.opencode/PAIOpenCodeWizard.ts`).
- Update `README.md`, `INSTALL.md`, and `docs/` to reference `PAI-Install/install.sh --cli`.
- Verify via grep checks + running installer help paths.

## IDEAL STATE CRITERIA (Verification Criteria)

- [x] ISC-C1: GUI installer directories are removed from PAI-Install | Verify: CLI: test ! -d PAI-Install/electron
- [x] ISC-C2: Web/GUI assets are removed from PAI-Install | Verify: CLI: test ! -d PAI-Install/web
- [x] ISC-C3: PAI-Install entrypoint no longer references electron | Verify: Grep: "electron" has 0 matches in PAI-Install/install.sh
- [x] ISC-C4: Wizard file is removed from .opencode | Verify: CLI: test ! -f .opencode/PAIOpenCodeWizard.ts
- [x] ISC-C5: README quick start uses PAI-Install/install.sh CLI flow | Verify: Read: README.md install commands updated
- [x] ISC-C6: INSTALL.md uses only PAI-Install/install.sh CLI flow | Verify: Read: INSTALL.md contains no wizard invocation
- [x] ISC-C7: docs/ contain no references to removed wizard path | Verify: Grep: PAIOpenCodeWizard has 0 matches in docs/
- [x] ISC-C8: docs/ contain no instructions to run removed GUI mode | Verify: Grep: "--mode gui" has 0 matches in docs/
- [x] ISC-C12: Root docs exclude wizard/GUI installer instructions | Verify: Grep: patterns have 0 matches in *.md excluding .prd/
- [x] ISC-C9: PAI-Install/README.md matches actual directory structure | Verify: Read: PAI-Install/README.md list is accurate
- [x] ISC-C10: CLI installer help runs without throwing | Verify: CLI: bun PAI-Install/cli/quick-install.ts --help
- [x] ISC-C11: install.sh CLI mode works and forwards args | Verify: CLI: bash PAI-Install/install.sh --cli --help
- [x] ISC-A1: Docs never recommend bun run .opencode/PAIOpenCodeWizard.ts | Verify: Grep: pattern has 0 matches

## LOG

### Iteration 0 — 2026-03-27
- Phase reached: VERIFY
- Criteria progress: 13/13
- Work done: CLI-only installer enforced, GUI/wizard artifacts deleted, docs updated repo-wide
