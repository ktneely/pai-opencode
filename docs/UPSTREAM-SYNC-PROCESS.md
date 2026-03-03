# Upstream Sync Process for PAI-OpenCode

> Complete guide for porting Daniel Miessler's PAI updates to PAI-OpenCode

## 🎯 Philosophy

**PAI-OpenCode is an architecture port, not a fork.**

This means:
- We **cannot simply merge** like normal forks
- We must **selectively port** based on architecture compatibility
- We preserve **OpenCode-specific adaptations** (Plugins, Dual-Config, .opencode/)

---

## 🔄 The Sync Process Overview

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. DETECT UPSTREAM                                               │
│    GitHub Actions Workflow runs daily at 08:00 UTC              │
│    → Checks danielmiessler/Personal_AI_Infrastructure           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. INFORM (no auto-sync!)                                        │
│    → Creates GitHub Issue with:                                 │
│      * List of new commits                                      │
│      * Analysis of changed components                           │
│      * Porting checklist                                        │
│      * Warning: No automatic merging!                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. MANUAL ANALYSIS                                               │
│    Maintainer checks:                                          │
│    * Which skills are new/updated?                              │
│    * Are there algorithm updates?                               │
│    * New tools or security patterns?                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. SELECTIVE PORTING                                             │
│    Only compatible components:                                   │
│    ✅ Skills (directly copyable)                               │
│    ✅ Tools (directly copyable)                                │
│    ⚠️  Algorithm (manual review)                                │
│    ❌ Hooks (not portable - we have plugins)                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. ADAPT PATHS                                                   │
│    Automatically via script:                                     │
│    .claude/ → $PAI_DIR (=$HOME/.opencode)                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. TEST & COMMIT                                                 │
│    → Biome lint check                                           │
│    → Local test with opencode                                   │
│    → PR with upstream-sync/ branch                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 Component Matrix: What to port?

| Component | Port? | Effort | Process | Files |
|-----------|-------|--------|---------|-------|
| **Skills** | ✅ Yes | 🟢 Low | Direct copy + path adaptation | `.claude/skills/*` → `.opencode/skills/*` |
| **Algorithm (SKILL.md)** | ✅ Yes | 🔴 High | Manual review, preserve OpenCode adaptations | `.claude/skills/PAI/SKILL.md` |
| **Agents** | ⚠️ Check | 🟡 Medium | Only new agent types, otherwise use OpenCode agents | `.claude/agents/*` |
| **Tools** | ✅ Yes | 🟢 Low | Direct copy + path adaptation | `.claude/Tools/*` → `Tools/*` |
| **Hooks** | ❌ No | — | **Not portable** - we have plugins (ADR-001) | — |
| **Memory** | ⚠️ Check | 🟡 Medium | Only new features, structure identical (ADR-007) | `.claude/MEMORY/*` |
| **Security** | ✅ Yes | 🟡 Medium | Adopt patterns in plugin | `plugins/handlers/security-validator.ts` |
| **Config** | ⚠️ Check | 🟡 Medium | Only PAI-relevant fields | `.claude/settings.json` |
| **Plugins** | ❌ No | — | OpenCode-specific, not upstream | `.opencode/plugins/*` |
| **opencode.json** | ❌ No | — | Platform-specific | `opencode.json` |

---

## 🔧 Automated Porting Tools

### Tool 1: Skill Port Helper

```bash
# Copies skills from PAI fork to PAI-OpenCode
# and adapts paths automatically
bun Tools/port-skills-from-upstream.ts \
  --upstream /Users/steffen/workspace/github.com/danielmiessler/Personal_AI_Infrastructure \
  --target /Users/steffen/workspace/github.com/Steffen025/pai-opencode \
  --skills "Research,Science,ExtractWisdom"
```

**What it does:**
1. Copies specified skills
2. Replaces `.claude/` → `${process.env.PAI_DIR}`
3. Replaces hardcoded paths to `$PAI_DIR`
4. Validates SKILL.md format

### Tool 2: Algorithm Diff Viewer

```bash
# Shows differences in Algorithm (SKILL.md)
bun Tools/compare-algorithm-versions.ts \
  --upstream-skill /Users/steffen/workspace/github.com/danielmiessler/Personal_AI_Infrastructure/.claude/skills/PAI/SKILL.md \
  --local-skill /Users/steffen/workspace/github.com/Steffen025/pai-opencode/.opencode/skills/PAI/SKILL.md
```

**Output:**
- Line-by-line diff
- Marks OpenCode-specific sections (must stay)
- Suggestions for new features to port

### Tool 3: Auto-Path-Replacer

```bash
# One-time replacement of all paths in a directory
find .opencode/skills/NEW_SKILL -type f \
  -exec sed -i '' 's|~/.claude|${process.env.PAI_DIR}|g' {} \;

# Or via tool with more features:
bun Tools/adapt-paths-for-opencode.ts \
  --dir .opencode/skills/Research \
  --validate
```

---

## 📊 Practical Workflow: Porting PAI 4.0.x

### Step 1: Identify Upstream Changes

```bash
# Update local PAI fork
cd /Users/steffen/workspace/github.com/danielmiessler/Personal_AI_Infrastructure
git fetch upstream
git log --oneline HEAD..upstream/main

# Filter skill changes
git log --name-only HEAD..upstream/main -- .claude/skills/ | grep -E "\.md$|\.ts$"

# Check algorithm changes
git diff HEAD..upstream/main -- .claude/skills/PAI/SKILL.md | head -100
```

### Step 2: Identify New Skills

```bash
# List all upstream skills
ls /Users/steffen/workspace/github.com/danielmiessler/Personal_AI_Infrastructure/.claude/skills/

# List all local skills
ls /Users/steffen/workspace/github.com/Steffen025/pai-opencode/.opencode/skills/

# Compare (missing skills = new upstream skills)
comm -23 <(ls upstream_skills | sort) <(ls local_skills | sort)
```

### Step 3: Port Skills (for each new/updated skill)

```bash
# Example: "Evals" skill from PAI 4.0.x

# 1. Copy
cp -r /Users/steffen/workspace/github.com/danielmiessler/Personal_AI_Infrastructure/.claude/skills/Evals \
      /Users/steffen/workspace/github.com/Steffen025/pai-opencode/.opencode/skills/

# 2. Adapt paths (automatically)
find .opencode/skills/Evals -type f -name "*.ts" -o -name "*.md" | \
  xargs sed -i '' \
    -e 's|~/.claude|${process.env.PAI_DIR}|g' \
    -e 's|\$HOME/.claude|\${process.env.PAI_DIR}|g' \
    -e 's|/Users/[^/]*/.claude|\${process.env.PAI_DIR}|g'

# 3. Validate
bunx @biomejs/biome check .opencode/skills/Evals

# 4. Test
cd /Users/steffen/workspace/github.com/Steffen025/pai-opencode
opencode  # Short test run
```

### Step 4: Update Algorithm (if changed)

```bash
# Compare SKILL.md files
diff -u \
  /Users/steffen/workspace/github.com/Steffen025/pai-opencode/.opencode/skills/PAI/SKILL.md \
  /Users/steffen/workspace/github.com/danielmiessler/Personal_AI_Infrastructure/.claude/skills/PAI/SKILL.md \
  > /tmp/algorithm_diff.txt

# Manual review:
# - Adopt new phases/features
# - Preserve OpenCode-specific sections (e.g., plugin architecture hints)
# - Update version
```

**OpenCode-specific sections that must stay:**
- Plugin system explanation (instead of hooks)
- Dual-config documentation
- `PAI_DIR` environment variable
- File logging (instead of console.log)

### Step 5: Check Security Patterns

```bash
# New security patterns in upstream?
grep -A5 "DANGEROUS_PATTERNS" \
  /Users/steffen/workspace/github.com/danielmiessler/Personal_AI_Infrastructure/.claude/hooks/PreToolUse.ts

# Adopt in PAI-OpenCode (if new patterns):
# Edit: .opencode/plugins/handlers/security-validator.ts
```

### Step 6: Commit & PR

```bash
# Create branch
git checkout -b upstream-sync/pai-4.0.3

# Commit changes
git add .opencode/skills/Evals
git add .opencode/skills/PAI/SKILL.md
git commit -m "feat(sync): Port PAI v4.0.3 skills + algorithm updates

Ported from upstream danielmiessler/Personal_AI_Infrastructure:
- New skill: Evals (evaluation framework)
- Updated: PAI SKILL.md Algorithm v3.7.0
- Updated: Research skill with new workflows

OpenCode-specific adaptations preserved:
- Plugin architecture maintained
- Dual-config structure unchanged
- File logging (not console.log)

Refs: PAI v4.0.3 release"

# Push & PR
git push origin upstream-sync/pai-4.0.3
```

---

## 🚨 Automatic Merging FORBIDDEN

### Why no `git merge upstream/main`?

| What happens | Consequence |
|--------------|-------------|
| `.claude/` renamed to `.opencode/` | ✅ OK (we want that) |
| `.opencode/` doesn't exist upstream | ❌ **Will be deleted!** |
| Hooks become plugins | ❌ **Architecture conflict** |
| `settings.json` format | ⚠️ **Must merge with `opencode.json`** |
| Hardcoded paths to `.claude/` | ❌ **Break in OpenCode** |

**Result:** Automatic merging destroys PAI-OpenCode.

---

## 📝 Checklist for every Sync

- [ ] Upstream changes identified (via GitHub issue or locally)
- [ ] New skills listed
- [ ] Updated skills identified
- [ ] Algorithm changes checked (SKILL.md diff)
- [ ] Security patterns compared
- [ ] For each new skill:
  - [ ] Copied from upstream
  - [ ] Paths adapted (.claude/ → $PAI_DIR)
  - [ ] Biome lint passed
  - [ ] Locally tested
- [ ] Algorithm (if changed):
  - [ ] Diff checked
  - [ ] New features ported
  - [ ] OpenCode-specific sections preserved
- [ ] Commit with `upstream-sync/pai-vX.X.X` branch
- [ ] PR with reference to upstream release

---

## 🎓 Learning from past Syncs

**Successful ports:**
- PAI v2.4 → v3.0: Algorithm v1.4.0 features (Constraint extraction)
- New skills: Evals, USMetrics, WorldThreatModelHarness

**Failed approaches (and why):**
- ❌ Tried auto-merge → Destroyed `.opencode/`
- ❌ Only copied files without adapting paths → Runtime errors
- ❌ Copied algorithm 1:1 → Lost OpenCode-specific features

---

## 📚 References

- **ADRs:** `docs/architecture/adr/`
  - ADR-001: Hooks → Plugins (why not portable)
  - ADR-002: Directory Structure (.claude → .opencode)
  - ADR-003: Skills Unchanged (directly portable)
- **Migration Guide:** `docs/MIGRATION.md`
- **Converter Tool:** `Tools/pai-to-opencode-converter.ts`
- **CI/CD:** `.github/workflows/upstream-sync-pai.yml`

---

## 💡 Tips & Tricks

**For quick ports:**
```bash
# Check all skills at once
for skill in $(ls upstream/.claude/skills/); do
  if [ ! -d "local/.opencode/skills/$skill" ]; then
    echo "NEW SKILL: $skill"
  fi
done
```

**For safe paths:**
```bash
# Always use $PAI_DIR, never hardcoded
# ✅ Good:
const skillDir = `${process.env.PAI_DIR}/skills/Research`;

# ❌ Bad:
const skillDir = `/Users/daniel/.claude/skills/Research`;
```

**For Algorithm updates:**
- Always use side-by-side diff
- Mark OpenCode-specific sections (search for "OpenCode", "plugin", "fileLog")
- Append new upstream features at the bottom (don't replace)

---

*Documentation created: 2026-03-03*  
*Valid for: PAI-OpenCode v2.0+ → PAI v4.0+*  
*Maintainer: Steffen025*
