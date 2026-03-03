# CI/CD Setup Guide for PAI-OpenCode

> Professional development workflows: CI/CD, CodeRabbit AI Review, Branch Protection, and automatic upstream monitoring

## Overview

This setup implements the same professionalism standard as Warrior AI Solutions (Weston):

| Component | Status | Purpose |
|-----------|--------|---------|
| **CI Workflow** | ✅ Active | Lint, Typecheck, Secret Scan on every PR |
| **CodeRabbit** | ⚙️ Configured | AI Code Review on all PRs |
| **OpenCode Action** | ✅ Active | `/opencode` commands in Issues/PRs |
| **Upstream Sync** | ✅ Active | Daily monitoring of forks |
| **Branch Protection** | 🔧 Manual | To be activated in GitHub Settings |

---

## Quick Start

### 1. Install CodeRabbit (One-Time)

1. Go to https://app.coderabbit.ai
2. Log in with your GitHub Account
3. Install CodeRabbit on your GitHub Account
4. Select the `Steffen025/pai-opencode` repository

**CodeRabbit is now active** — it automatically reviews all PRs based on `.coderabbit.yaml`.

### 2. Configure GitHub Secrets

Go to **Settings → Secrets and variables → Actions** and add:

| Secret | Value | Required for |
|--------|-------|--------------|
| `UPSTREAM_SYNC_TOKEN` | GitHub Personal Access Token | Upstream Sync Workflows |

**Create Token:**
1. https://github.com/settings/tokens → Generate new token (classic)
2. Scopes: `repo` (full control) + `issues` (write)
3. Copy the token and save as `UPSTREAM_SYNC_TOKEN`

**Optional (for OpenCode Agent):**
| Secret | Value | Required for |
|--------|-------|--------------|
| `OPENCODE_API_KEY` | Your OpenCode/Zen API Key | OpenCode Action |

### 3. Activate Branch Protection (Manual)

Go to **Settings → Branches → Branch protection rules**:

#### For `dev` Branch:
```
☑️ Require a pull request before merging
☑️ Require status checks to pass
   - Search for: "CI — Lint, Typecheck, Secrets"
☑️ Restrict pushes that create files larger than 100 MB
☐ Do not allow bypassing the above settings (leave unchecked for now)
```

#### For `main` Branch:
```
☑️ Require a pull request before merging
☑️ Require approvals: 1 (or 0 if you work alone)
☑️ Require status checks to pass
   - Search for: "CI — Lint, Typecheck, Secrets"
☑️ Dismiss stale PR approvals when new commits are pushed
☑️ Do not allow force pushes
☑️ Do not allow deletions
```

---

## Workflows in Detail

### CI Workflow (`.github/workflows/ci.yml`)

**Trigger:** PRs to `dev`/`main`, pushes to `dev`/`main`

**Jobs:**
1. **Bun Setup** — `oven-sh/setup-bun@v2` (⚠️ **NOT npm!**)
2. **Dependencies** — `bun install`
3. **Typecheck** — `bunx tsc --noEmit` (only if `tsconfig.json` exists)
4. **Biome Check** — `bunx @biomejs/biome check .` (only if `biome.json` exists)
5. **Secret Scan** — grep for `sk-*, api_key, client_secret, password, token`
6. **Tests** — `bun test` (only if `.test.ts` files exist)

**Constraint Check:** No `npm install`, `npm ci`, or `npm run` in this workflow!

### CodeRabbit (`.coderabbit.yaml`)

**Configuration:**
- **Profile:** `chill` (not too aggressive for AI-generated code)
- **Language:** English
- **Auto-Review:** On PRs targeting `dev` or `main`
- **Path Instructions:** Specific rules for:
  - `.opencode/skills/**` — PAI Skills Format
  - `.opencode/agents/**` — Agent Definitions
  - `Tools/**` — CLI Tools (Bun-only)
  - `skill-packs/**` — Modular Skill Packs
  - `docs/**` — Documentation

### OpenCode Action (`.github/workflows/opencode.yml`)

**Trigger:** Comments containing `/opencode` or `/oc`

**Usage:**
```
# In an Issue or PR comment:
/opencode Update the README with new features

# Or short:
/oc Fix the broken link in docs
```

### Upstream Sync Workflows

#### PAI Sync (`.github/workflows/upstream-sync-pai.yml`)

**Schedule:** Daily at 08:00 UTC

**Monitors:** `danielmiessler/Personal_AI_Infrastructure`

**Actions:**
1. Compares your fork with upstream
2. Creates issue when new commits available:
   - Label: `upstream-sync`, `pai`, `automated`
   - Contains: Commit list, links, action checkboxes
3. Creates issue when new release:
   - Label: `upstream-sync`, `pai`, `release`, `automated`
   - Contains: Release notes, links, breaking changes check

#### OpenCode Sync (`.github/workflows/upstream-sync-opencode.yml`)

**Schedule:** Daily at 08:30 UTC (30min after PAI)

**Monitors:** `anomalyco/opencode`

**Actions:** Same pattern as PAI Sync, but:
- Label: `upstream-sync`, `opencode`
- Additional hints for SDK/Action changes

---

## Development Workflow

### For you (Steffen):

```bash
# 1. Create feature branch (from dev)
git checkout -b feature/new-feature origin/dev

# 2. Make changes
# ... edit files ...

# 3. Commit (Conventional Commits)
git commit -m "feat(skills): Add new Cloudflare skill

- Add Cloudflare Workers deployment skill
- Include wrangler.toml templates

Closes #42"

# 4. Push
git push origin feature/new-feature

# 5. Create PR (target: dev)
# - CI runs automatically
# - CodeRabbit reviews automatically
# - When CI green → Merge to dev

# 6. Release (manual)
# When dev is stable: create PR dev→main
# - Self review + Approval
# - Merge triggers no deployment (PAI is a template, not a service)
```

### For OpenCode AI Agent:

```
# In a PR comment:
/opencode Review this PR for PAI v3.0 compliance

# Or:
/oc Add error handling to the migration tool
```

---

## Anti-Patterns (WHAT SHOULD NOT happen)

| ❌ Anti-Pattern | ✅ Correct |
|----------------|----------|
| `npm install` in workflows | `bun install` |
| `eslint` or `prettier` | `biome check .` |
| Direct commits to `main` | PR via `dev` branch |
| Force push to protected branches | Never allowed |
| Manual upstream checking | Automatic issues |

---

## Troubleshooting

### CI fails: "No tsconfig.json"
→ Normal if no TypeScript configured yet. Add `tsconfig.json` or workflow adapts.

### CodeRabbit doesn't review
→ Check:
1. CodeRabbit App installed? (https://app.coderabbit.ai)
2. `.coderabbit.yaml` in root?
3. PR target is `dev` or `main`?

### Upstream Sync doesn't create issues
→ Check:
1. `UPSTREAM_SYNC_TOKEN` secret set?
2. Token has `repo` and `issues` scopes?
3. Manually trigger workflow (Actions Tab → workflow_dispatch)

### Secret scan false positives
→ If legitimate strings are matched (e.g., `sk-` in filenames):
1. Comment with `# pragma: allowlist secret`
2. Or: Adjust scan regex in CI

---

## Comparison: Warrior AI Solutions vs. PAI-OpenCode

| Feature | Warrior AI (Weston) | PAI-OpenCode |
|---------|---------------------|--------------|
| **CI** | ✅ Lint, Typecheck, Test, Secrets | ✅ Same pattern |
| **CodeRabbit** | ✅ Pro Tier (2 seats) | ✅ Free Tier |
| **OpenCode Action** | ✅ Self-hosted runner | ✅ GitHub-hosted |
| **Branch Protection** | 2 approvers (dev+main) | 1 approver (personal) |
| **Self-hosted Runner** | ✅ Vultr | ❌ Not needed |
| **Upstream Sync** | ❌ Not implemented | ✅ Automatic |

**Key Difference:** Warrior AI has enterprise features (self-hosted, 2 approvers), PAI-OpenCode is optimized for personal/OSS usage.

---

## Next Steps

1. ✅ Install CodeRabbit
2. ✅ Configure secrets
3. ✅ Activate branch protection
4. ⏳ Wait for first upstream sync (tomorrow 08:00/08:30 UTC)
5. ⏳ Optional: Add `biome.json` and `tsconfig.json` for full CI usage

---

*Documentation created: 2026-03-03*
*Based on Warrior AI Solutions patterns*
