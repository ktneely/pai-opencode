# PAI-OpenCode Roadmap

This roadmap outlines the development path from v1.0 to v2.0 and beyond.

![Roadmap Timeline](docs/images/roadmap-timeline.jpg)

## Current Release

### v2.0.0 - PAI v3.0 / Algorithm v1.8.0 (February 2026)

**Status:** ✅ Released

**Major Feature:** Full upstream sync to Algorithm v1.8.0 with Wisdom Frames, Verify Completion Gate, and 10 new skills

**What's New in v2.0:**

#### Algorithm v1.2.0 Base
- **8 Effort Levels** — Instant, Fast, Standard, Extended, Advanced, Deep, Comprehensive, Loop
- **25-Capability Full Scan Audit** — Replaces Two-Pass capability selection
- **Constraint Extraction** — Mechanical [EX-N] extraction before ISC
- **Self-Interrogation** — 5 structured questions before BUILD
- **7 Quality Gates** — QG1-QG7 must pass before proceeding
- **PRD System** — Persistent Requirements Documents for cross-session tracking
- **Start Symbol ♻︎** — Replaces 🤖

#### Algorithm v1.3.0–v1.8.0 Upstream Sync (14 commits)
- **Verify Completion Gate (v1.6.0)** — Prevents "PASS" claims without TaskUpdate calls
- **Phase Separation Enforcement (v1.6.0)** — "STOP" markers on every phase
- **Zero-Delay Output (v1.6.0)** — Instant output before processing
- **Effort-Scaled Gates (v1.3.0)** — Self-Interrogation, Constraint Extraction, QG6/QG7 scale by effort
- **Wisdom Frames (v1.8.0)** — Domain knowledge accumulation across sessions (`MEMORY/WISDOM/`)
- **Wisdom Injection (v1.8.0)** — OUTPUT 1.75 injects domain wisdom before ISC creation
- **BUILD Capability Execution (v1.8.0)** — Explicit substep within BUILD phase

#### New Skills & Handlers
- **10 New Skills** — Cloudflare, ExtractWisdom, IterativeDepth, Science, Parser, Remotion, Sales, USMetrics, WorldThreatModelHarness, WriteStory
- **6 New/Updated Handlers** — algorithm-tracker, agent-execution-guard, skill-guard, check-version, integrity-check, format-reminder (updated)
- **WisdomFrameUpdater.ts** — CLI tool for managing wisdom frames

#### Infrastructure
- **5 Seed Wisdom Frames** — development, deployment, security, architecture, communication
- **Security Validator fix** — env var prefix stripping (upstream #620)
- **Rating Capture fix** — 5/10 noise filter
- **Symlink support** — GenerateSkillIndex follows symlinks
- **SessionHarvester** — PAI_DIR variable rename

**Documentation:**
- [CHANGELOG.md](CHANGELOG.md) — Full release notes
- [docs/specs/UPSTREAM-SYNC-v1.8.0-SPEC.md](docs/specs/UPSTREAM-SYNC-v1.8.0-SPEC.md) — Porting specification

---

## Previous Releases

### v1.3.0 - Multi-Provider Agent System (February 2026)

**Status:** ✅ Released

**Major Feature:** 16 specialized agents with model tier routing and 3 provider presets

**What's New in v1.3:**
- **16 Agents** - Expanded from ~11 to 16 specialized agents
- **Model Tiers** - `quick`/`standard`/`advanced` routing per agent via `opencode.json`
- **3 Presets** - Anthropic Max, ZEN PAID, ZEN FREE (replaces 8 provider system)
- **Rewritten Wizard** - Prerequisites → Dev build → 3 presets → Identity → Config
- **Researcher Renames** - `ClaudeResearcher` → `DeepResearcher`, `PerplexityProResearcher` removed
- **Profile YAML** - New format: `default_model:` + `agents:` with optional `tiers:`

---

### v1.2.0 - Observability Dashboard (February 2026)

**Status:** ✅ Released

**Major Feature:** Real-time event streaming, SQLite persistence, Vue 3 dashboard

---

### v1.1.0 - PAI 2.5 + Voice/Sentiment Handlers (February 2026)

**Status:** ✅ Released

**Major Upgrade:** Full PAI 2.5 Algorithm + 5 new handlers

**What's New in v1.1:**
- **PAI 2.5 Algorithm** (v0.2.25) - Full 7-phase format with ISC tracking
- **Voice Notification Handler** - ElevenLabs + Google TTS + macOS say fallback
- **Implicit Sentiment Handler** - Automatic satisfaction detection from user messages
- **Tab State Handler** - Kitty terminal tab title/color updates
- **Update Counts Handler** - Skill/workflow counting at session end
- **Response Capture Handler** - ISC extraction and learning capture

---

### v1.0.0 - Core PAI on OpenCode (January 2026)

**Status:** ✅ Released

**What's Included:**
- Skills system with 29 skills (CORE, Algorithm, Fabric, Research, etc.)
- Plugin system (security validator, context loader)
- Memory system (projects, sessions, learning)
- Agent system (14 agents, PascalCase naming)
- Skill search and indexing tools
- Full TypeScript tooling with Bun runtime

---

## Upcoming Releases

### v2.1.0 - SHOULD-PORT Completions (Q1 2026)

**Goal:** Complete remaining upstream items and polish

**Features:**
- PRD auto-creation via AutoWorkCreation plugin handler
- Dynamic Algorithm version reading via LATEST file
- Enhanced Wisdom Frames with auto-population from session learnings

---

### v2.5.0 - Enhanced Setup & Health Monitoring (Q2 2026)

**Goal:** Advanced setup options and system health

**Features:**
- Skill selection UI (enable/disable individual skills)
- System health checks and diagnostics
- Configuration validation
- Migration assistant from Claude Code PAI (interactive)

---

## Future Vision

### v3.0.0 - Full PAI Parity & Auto-Migration (Q3 2026)

**Goal:** Complete feature parity with latest upstream PAI + seamless migration

**Major Features:**

1. **Auto-Migration System**
   - One-command migration from Claude Code PAI
   - Skill mapping and compatibility layer
   - Memory import (sessions, projects, learning)

2. **Advanced Skill Orchestration**
   - Skill dependencies and auto-loading
   - Parallel skill execution
   - Community skill marketplace

3. **Enhanced Security**
   - Sandboxed skill execution
   - Granular permission system
   - Audit logging

4. **MCP Server Adapters**
   - deepwiki-enhanced (GitHub repo Q&A via Devin API)
   - Community MCP server integrations

![v3.0 Architecture](docs/images/v2-architecture.jpg)

---

## How to Influence the Roadmap

We value community input! Here's how to shape PAI-OpenCode's future:

1. **Vote on Features**: Comment on [roadmap issues](https://github.com/Steffen025/pai-opencode/labels/roadmap)
2. **Propose Ideas**: Open a [discussion](https://github.com/Steffen025/pai-opencode/discussions)
3. **Contribute Code**: Tackle items from the roadmap ([CONTRIBUTING.md](CONTRIBUTING.md))
4. **Share Use Cases**: Tell us how you use PAI-OpenCode

---

## Version History

| Version | Release Date | Highlights |
|---------|-------------|------------|
| **v2.0.0** | **February 2026** | **PAI v3.0 / Algorithm v1.8.0, Wisdom Frames, Verify Completion Gate, 39 skills** |
| v1.3.0  | February 2026 | Multi-Provider Agent System with Model Tiers |
| v1.2.0  | February 2026 | Observability Dashboard + 14 handlers |
| v1.1.0  | February 2026 | PAI 2.5 upgrade + Voice/Sentiment handlers |
| v1.0.1  | February 2026 | Anthropic API fix, ISCValidator improvements |
| v1.0.0  | January 2026 | Initial release - core PAI on OpenCode |

---

**Stay Updated:**
- Watch this repo for releases
- Follow [Discussions](https://github.com/Steffen025/pai-opencode/discussions) for announcements
