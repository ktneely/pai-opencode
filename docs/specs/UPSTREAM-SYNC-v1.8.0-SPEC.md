# Upstream Sync Specification: PAI v3.0 → PAI-OpenCode v2.0

**Target:** Sync 14 upstream commits (a5622ad through Feb 2026) into PAI-OpenCode 2.0 staging
**Algorithm Version Progression:** v1.2.0 (current) → v1.8.0 (target, skipping 1.3-1.7)
**Upstream Repository:** `/Users/steffen/workspace/github.com/danielmiessler/Personal_AI_Infrastructure`
**Target Repository:** `/Users/steffen/workspace/github.com/Steffen025/pai-opencode` (staging/v2.0 branch)
**Date:** 2026-02-19
**Author:** Jeremy (Architect Agent)

---

## Executive Summary

This spec evaluates 14 upstream commits and 6 Algorithm versions (v1.3.0 through v1.8.0) for porting to OpenCode. It identifies **MUST-PORT**, **SHOULD-PORT**, **SKIP**, and **DEFER** items based on platform compatibility (ADR-001), architectural decisions (ADR-003, ADR-006), and value to OpenCode users.

**Key Finding:** The 6 Algorithm version increments (v1.3.0 → v1.8.0) are **platform-agnostic** and must be ported as a single jump. Voice notification changes and some tool features are Claude Code-specific and require adaptation.

**Implementation Risk:** MEDIUM - Complex Algorithm changes but well-defined. Biggest risk is voice_id handling.

---

## Table of Contents

1. [Change Classification Summary](#1-change-classification-summary)
2. [Algorithm Version Analysis (v1.3-1.8)](#2-algorithm-version-analysis-v13-18)
3. [Upstream Commit Evaluation](#3-upstream-commit-evaluation)
4. [MUST-PORT Items](#4-must-port-items)
5. [SHOULD-PORT Items](#5-should-port-items)
6. [SKIP Items](#6-skip-items)
7. [DEFER Items](#7-defer-items)
8. [Risk Assessment](#8-risk-assessment)
9. [Implementation Order](#9-implementation-order)
10. [Validation Checklist](#10-validation-checklist)

---

## 1. Change Classification Summary

| Classification | Count | Description |
|----------------|-------|-------------|
| **MUST-PORT** | 9 | Platform-agnostic, high-value features essential for v2.0 |
| **SHOULD-PORT** | 4 | Useful improvements that enhance OpenCode experience |
| **SKIP** | 2 | Claude Code-only features with no OpenCode equivalent |
| **DEFER** | 0 | (Wisdom Frames promoted to MUST-PORT per Steffen 2026-02-19) |

**Total Upstream Changes:** 16 items evaluated
**Porting Effort:** ~10-14 hours total (includes Wisdom Frames full port)

---

## 2. Algorithm Version Analysis (v1.3-1.8)

### Version Progression

| Version | Key Feature | Portable? | Notes |
|---------|------------|-----------|-------|
| **v1.3.0** | Constraint Extraction, Self-Interrogation, Build Drift Prevention, Verification Rehearsal, Mechanical Verification | **YES** | All platform-agnostic, foundational quality improvements |
| **v1.4.0** | (Not found in upstream - version number skipped) | N/A | |
| **v1.5.0** | (Not found in upstream - version number skipped) | N/A | |
| **v1.6.0** | **Verify Completion Gate** (mandatory reconciliation before LEARN) | **YES** | Critical: prevents "PASS" claims without TaskUpdate |
| **v1.7.0** | Hardcoded voice_id in curl payloads | **ADAPT** | Claude Code voice server integration - needs OpenCode voice handling |
| **v1.8.0** | Template variable `{DAIDENTITY.ALGORITHMVOICEID}`, Wisdom Frames, BUILD capability execution | **ADAPT** | Voice template needs OpenCode daidentity.json integration |

### Recommended Porting Strategy

**Port as single jump: v1.2.0 → v1.8.0**

Rationale:
- Intermediate versions (v1.3-v1.7) are **cumulative** - each builds on the prior
- Porting incrementally = 6x the integration work for zero added safety
- v1.8.0 is the **stable target** - it incorporates all prior fixes
- Our SKILL.md already references "v1.2.0" - single version string update

---

## 3. Upstream Commit Evaluation

### Commit-by-Commit Analysis

| Commit | Feature | Classification | Reason |
|--------|---------|----------------|--------|
| **a5622ad** | Algorithm v1.7.0 & v1.8.0 specs, voice_id in RebuildPAI, CLAUDE_DIR→PAI_DIR | **MUST-PORT (voice adapt)** | Core Algorithm updates, path rename aligns with our $PAI_DIR |
| **db32eb6** | Kitty socket remote control | **SKIP** | Claude Code terminal-specific - we have no Kitty integration |
| **f93f9a4** | Merge PR #696 | **INVESTIGATE** | Unknown content - need to read PR |
| **1d2fcb5** | Symlink support in GenerateSkillIndex.ts | **MUST-PORT** | Skill discovery improvement, platform-agnostic |
| **84bbce8** | Stop noise learning files for neutral ratings (5/10) | **MUST-PORT** | Learning system enhancement, affects rating-capture.ts |
| **95d65cc** | 7 community fixes: security, voice, cross-platform | **MUST-PORT (partial)** | SecurityValidator fixes portable, VoiceGate terminal detection skipped |
| **011c545** | VoiceServer camelCase, hardcoded voice_id fixes | **MUST-PORT (adapt)** | Voice notification quality improvements, need OpenCode voice integration |
| **0820852** | GenerateSkillIndex.ts symlink follow | **MUST-PORT** | Duplicate of 1d2fcb5 - same fix |
| **821f08b** | Stop 5/10 rating noise files | **MUST-PORT** | Duplicate of 84bbce8 - same fix |
| **ebccb81** | Respect CLAUDE_CONFIG_DIR in installer | **SKIP** | Installer script - we don't have one yet |
| **7ae82dd** | PRD auto-creation via AutoWorkCreation hook + CLI | **SHOULD-PORT (adapt)** | PRD template useful, hook→plugin, CLI needs OpenCode tool integration |
| **c2c5d0d** | Algorithm v1.6.0 - Verify Completion Gate | **MUST-PORT** | Critical: fixes completion verification failure mode |
| **fae1e52** | Read Algorithm version dynamically from LATEST file | **SHOULD-PORT** | Dynamic versioning - reduces manual updates |
| **ed06d22** | Kitty socket enforcement | **SKIP** | Claude Code terminal-specific |

---

## 4. MUST-PORT Items

### 4.1 Algorithm v1.6.0 - Verify Completion Gate

**Priority:** CRITICAL
**Upstream Commit:** c2c5d0d
**File Changes:** `.opencode/skills/PAI/SKILL.md` (VERIFY phase)

**What It Is:**
Mandatory reconciliation step before LEARN phase. After writing evidence, the Algorithm MUST:
1. Invoke TaskList to see all criteria
2. For each criterion where evidence shows PASS but status ≠ completed → invoke TaskUpdate(completed) NOW
3. Invoke TaskList again to confirm all reconciled

**Why Critical:**
Fixes the "completion gate failure mode" - AI writes "PASS" in prose but never calls TaskUpdate. The task stays pending. User sees unchecked criteria despite claimed completion.

**Porting Requirements:**
- **File:** `.opencode/skills/PAI/SKILL.md` line ~408 (VERIFY phase, after mechanical verification)
- **Add Section:**
  ```markdown
  🔒 **VERIFY COMPLETION GATE (v1.6.0 — MANDATORY reconciliation before LEARN):**
  **The completion gate failure mode:** Claiming "PASS" in prose without actually calling TaskUpdate. The model writes evidence, says "verified", but never fires the tool call. The task stays pending. The user sees unchecked criteria despite confirmed completion.

  [INVOKE TaskList — this is NOT a display step, it is an ACTIVE RECONCILIATION]
  For EACH criterion in the list:
    IF your evidence above shows PASS but task status ≠ completed → INVOKE TaskUpdate(completed) NOW
    IF task status = completed → confirmed, no action needed
    IF your evidence shows FAIL → task must remain in_progress or pending with failure reason

  **This gate runs at ALL effort levels. It is NON-NEGOTIABLE. Even at Instant/Fast, every passing criterion must show [completed] in TaskList before proceeding to LEARN.**

  [INVOKE TaskList again to confirm all reconciled — every PASS criterion must now show completed]
  ```
- **Placement:** After mechanical verification rules, before PRD UPDATE section
- **Version Update:** Algorithm version string `v1.2.0` → `v1.6.0` (or directly to v1.8.0 if porting all)

**Validation:**
- [ ] Section appears in VERIFY phase
- [ ] Non-optional wording ("NON-NEGOTIABLE", "MUST")
- [ ] Applies to ALL effort levels (including Instant/Fast)
- [ ] Two TaskList invocations documented (before reconciliation, after reconciliation)

---

### 4.2 Symlink Support in GenerateSkillIndex.ts

**Priority:** HIGH
**Upstream Commits:** 1d2fcb5, 0820852 (duplicate)
**File Changes:** `.opencode/skills/PAI/Tools/GenerateSkillIndex.ts`

**What It Is:**
Skill discovery now follows symlinked skill directories when scanning for SKILL.md files. Allows users to create skill symlinks from other repos without breaking skill indexing.

**Current Behavior:** OpenCode GenerateSkillIndex.ts skips symlinked directories
**New Behavior:** Follow symlinks during directory traversal

**Porting Requirements:**
- **File:** `.opencode/skills/PAI/Tools/GenerateSkillIndex.ts` line ~46-77 (findSkillFiles function)
- **Change:** Add symlink following to directory traversal
- **Upstream Implementation:**
  ```typescript
  async function findSkillFiles(dir: string): Promise<string[]> {
    const skillFiles: string[] = [];

    try {
      const entries = await readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);

        // Follow symlinks to directories
        let isDirectory = entry.isDirectory();
        if (entry.isSymbolicLink()) {
          const stats = await stat(fullPath);
          isDirectory = stats.isDirectory();
        }

        if (isDirectory) {
          // Skip hidden directories and node_modules
          if (entry.name.startsWith('.') || entry.name === 'node_modules') {
            continue;
          }

          // Check for SKILL.md in this directory
          const skillMdPath = join(fullPath, 'SKILL.md');
          if (existsSync(skillMdPath)) {
            skillFiles.push(skillMdPath);
          }

          // Recurse into subdirectories (including symlinked ones)
          const nestedFiles = await findSkillFiles(fullPath);
          skillFiles.push(...nestedFiles);
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dir}:`, error);
    }

    return skillFiles;
  }
  ```
- **Import Add:** `import { stat } from 'fs/promises';` at top of file

**Validation:**
- [ ] Symlinked skill directories are followed
- [ ] SKILL.md files inside symlinked dirs are indexed
- [ ] Non-directory symlinks are ignored
- [ ] Error handling preserved

---

### 4.3 Stop Noise Learning Files for Neutral Ratings (5/10)

**Priority:** MEDIUM
**Upstream Commits:** 84bbce8, 821f08b (duplicate)
**File Changes:** `.opencode/plugins/handlers/rating-capture.ts`

**What It Is:**
Neutral ratings (5/10) should NOT create learning files in MEMORY/LEARNING/. Only low ratings (<7) or high ratings (>7) are meaningful signals. 5/10 is "meh" - creates noise.

**Current Behavior:** Any rating with a comment creates a learning file
**New Behavior:** Skip learning file creation for ratings == 5

**Porting Requirements:**
- **File:** `.opencode/plugins/handlers/rating-capture.ts` line ~160-165 (captureRating function)
- **Change:** Add condition to skip neutral ratings
  ```typescript
  // For low ratings (< 7) AND not neutral (≠ 5), create a learning file
  let learned = false;
  if (rating.score < 7 && rating.score !== 5 && rating.comment) {
    learned = await createLearningFromRating(rating);
  }
  ```
- **Rationale:** 5/10 = neutral, no actionable feedback. Prevents LEARNING/ directory from filling with "okay, nothing special" entries.

**Alternative Implementation (if ratings >7 should also create learnings):**
  ```typescript
  // Create learning for actionable ratings (< 5 or > 7), skip neutral (5-7)
  let learned = false;
  if (rating.comment && (rating.score < 5 || rating.score > 7)) {
    learned = await createLearningFromRating(rating);
  }
  ```
  (Upstream uses < 7, we match that initially)

**Validation:**
- [ ] 5/10 ratings append to ratings.jsonl (still tracked)
- [ ] 5/10 ratings do NOT create learning files in LEARNING/ALGORITHM/ or LEARNING/GENERAL/
- [ ] Low ratings (1-4, 6) still create learning files
- [ ] Comment-less ratings never create learning files (existing behavior)

---

### 4.4 Security Validator Improvements (95d65cc subset)

**Priority:** HIGH
**Upstream Commit:** 95d65cc (7 fixes - extract 2 security-related)
**File Changes:** `.opencode/plugins/handlers/security-validator.ts`

**Relevant Fixes from Upstream:**
1. **#620:** Strip env var prefixes before pattern matching
2. **#452:** Streaming stdin reader with hard process.exit timeout

**Fix #620 - Env Var Prefix Stripping:**

**Problem:** Security patterns check for env var leaks like `AWS_SECRET_ACCESS_KEY=`. But if command contains `export AWS_SECRET_ACCESS_KEY=xyz`, the pattern matches the variable NAME, not the VALUE. False positive.

**Solution:** Strip common env var prefixes (`export `, `set `, etc.) before pattern matching.

**Porting:**
- **File:** `.opencode/plugins/handlers/security-validator.ts` line ~43-60 (extractCommand function)
- **Add preprocessing step:**
  ```typescript
  function extractCommand(input: PermissionInput | ToolInput): string | null {
    const toolName = input.tool.toLowerCase();

    if (toolName === "bash" && typeof input.args?.command === "string") {
      let command = input.args.command;
      
      // Strip env var assignment prefixes to avoid false positives
      command = command.replace(/^(export|set|declare|readonly)\s+/gm, '');
      
      return command;
    }

    // ... rest of function unchanged
  }
  ```

**Fix #452 - Streaming Stdin (NOT APPLICABLE TO OPENCODE):**
This fix addresses stdin blocking in Claude Code's subprocess hook execution. OpenCode uses in-process plugins (ADR-001) - no stdin, no blocking. **SKIP this fix.**

**Validation:**
- [ ] Commands with `export AWS_SECRET=xyz` are flagged on `xyz`, not `AWS_SECRET`
- [ ] Commands with `set PASSWORD=secret` are flagged on `secret`, not `PASSWORD`
- [ ] False positives from env var declarations eliminated

---

### 4.5 Hardcoded Voice_ID Removal (011c545)

**Priority:** HIGH (voice quality)
**Upstream Commit:** 011c545
**File Changes:** `.opencode/skills/PAI/SKILL.md` (all voice curl commands)

**What It Is:**
Upstream had hardcoded placeholder `"YOUR_VOICE_ID_HERE"` in voice notification curls. This was replaced with actual voice_id values from settings.json.

**Current State in PAI-OpenCode:**
- Our SKILL.md uses `"YOUR_VOICE_ID_HERE"` (placeholder from original PAI port)
- Voice notifications likely fail or use wrong voice

**Upstream Fix (v1.7.0):**
- Each curl includes `"voice_id": "gJx1vCzNCD1EQHT212Ls"` (hardcoded Jade voice)
- Not ideal - still hardcoded, but at least functional

**Upstream Fix (v1.8.0 - current):**
- Template variable: `"voice_id": "{DAIDENTITY.ALGORITHMVOICEID}"`
- Resolved at runtime from daidentity.json

**OpenCode Adaptation:**
We have a voice server at `localhost:8888` (confirmed in SERVERARCHITECTURE.md). But:
- Do we have daidentity.json in `~/.opencode/`?
- Do we have a DAIDENTITY system like Claude Code?
- If not, what's our voice_id source?

**Recommended Approach:**
1. **Check for daidentity.json:** `~/.opencode/daidentity.json` or `~/.opencode/settings.json` voice configuration
2. **If exists:** Use `{DAIDENTITY.ALGORITHMVOICEID}` template (like v1.8.0)
3. **If not exists:** Use OpenCode's default voice or skip voice_id parameter (voice server may have default)

**Porting Requirements:**
- **File:** `.opencode/skills/PAI/SKILL.md` - ALL voice curl commands (8 locations)
- **Find:** `"voice_id": "YOUR_VOICE_ID_HERE"`
- **Replace with:** `"voice_id": "{DAIDENTITY.ALGORITHMVOICEID}"` (if daidentity.json exists)
- **Alternative:** `"voice_id": "default"` or remove parameter if OpenCode voice server doesn't need it

**Decision Point for Engineer:**
Test voice server behavior:
```bash
# Test 1: With voice_id
curl -s -X POST http://localhost:8888/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Test", "voice_id": "some_id"}'

# Test 2: Without voice_id
curl -s -X POST http://localhost:8888/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Test"}'
```

If Test 2 works (server has default), we can **omit voice_id entirely**.

**Validation:**
- [ ] Voice notifications use correct voice (not placeholder)
- [ ] All 8 curl commands updated consistently
- [ ] Voice server receives valid voice_id or defaults gracefully

---

### 4.6 GenerateSkillIndex.ts camelCase vs PascalCase (011c545 - code quality)

**Priority:** LOW (consistency)
**Upstream Commit:** 011c545
**File Changes:** `.opencode/skills/PAI/Tools/GenerateSkillIndex.ts`

**What It Is:**
Code style consistency - function names follow camelCase convention.

**Changes:**
- `SkillEntry` interface → `skillEntry` (wait, that's wrong - interfaces are PascalCase)
- Actually: variable names `skillEntry` vs `SkillEntry` consistency
- (Need to read actual diff - this is minor)

**Recommendation:** DEFER to code review during GenerateSkillIndex.ts update for symlinks. Combine with 4.2.

---

### 4.7 CLAUDE_DIR → PAI_DIR Rename (a5622ad)

**Priority:** MEDIUM (alignment)
**Upstream Commit:** a5622ad
**File Changes:** Multiple tools and documentation

**What It Is:**
Environment variable rename for platform agnosticism. `CLAUDE_DIR` implies Claude Code-specific. `PAI_DIR` is platform-neutral.

**Current State:**
- PAI-OpenCode uses `$PAI_DIR` in some places, `~/.opencode` hardcoded in others
- No consistent environment variable usage

**Upstream Changes:**
- RebuildPAI.ts: `CLAUDE_DIR` → `PAI_DIR`
- Tools: Read from `PAI_DIR` environment variable
- Fallback: `~/.opencode` (for OpenCode) or `~/.claude` (for Claude Code)

**Porting Requirements:**
- **Review:** All tools in `.opencode/skills/PAI/Tools/` for path construction
- **Standardize:** Use `process.env.PAI_DIR || join(process.env.HOME!, '.opencode')`
- **Files to check:**
  - RebuildPAI.ts (if it exists in OpenCode - **NOTE: We don't have this tool yet**)
  - GenerateSkillIndex.ts
  - SessionHarvester.ts
  - Any other tools reading from `~/.opencode`

**Current SessionHarvester.ts (line 28-31):**
```typescript
const CLAUDE_DIR = path.join(process.env.HOME!, ".opencode");
const USERNAME = process.env.USER || require("os").userInfo().username;
const PROJECTS_DIR = path.join(CLAUDE_DIR, "projects", `-Users-${USERNAME}--claude`);
const LEARNING_DIR = path.join(CLAUDE_DIR, "MEMORY", "LEARNING");
```

**Should become:**
```typescript
const PAI_DIR = process.env.PAI_DIR || path.join(process.env.HOME!, ".opencode");
const USERNAME = process.env.USER || require("os").userInfo().username;
const PROJECTS_DIR = path.join(PAI_DIR, "projects", `-Users-${USERNAME}--opencode`); // Note: --opencode, not --claude
const LEARNING_DIR = path.join(PAI_DIR, "MEMORY", "LEARNING");
```

**Validation:**
- [ ] All tools use `PAI_DIR` environment variable with `~/.opencode` fallback
- [ ] No hardcoded `~/.claude` references
- [ ] No hardcoded `~/.opencode` (use PAI_DIR)
- [ ] Path construction consistent across all tools

---

### 4.8 Algorithm v1.8.0 - Context Recovery Modes (a5622ad)

**Priority:** MEDIUM (Context Recovery enhancement)
**Upstream Commit:** a5622ad (v1.8.0 spec file)
**File Changes:** `.opencode/skills/PAI/SKILL.md` (OBSERVE phase, CONTEXT RECOVERY section)

**What It Is:**
Three distinct recovery modes for handling session context loss:

1. **SAME-SESSION:** Task worked on earlier THIS session → Use working memory directly, skip search
2. **POST-COMPACTION:** Context compressed mid-session → Audit env vars, auth tokens, working directory
3. **COLD-START:** New session referencing prior work → Execute SEARCH + READ phases

**Current State in v1.2.0:**
- Context recovery is single-mode: always search if prior work detected
- No distinction between same-session memory vs cold-start search
- No post-compaction env validation

**New Section (v1.8.0):**
```markdown
**Recovery Mode Detection (check FIRST — before searching):**
- **SAME-SESSION:** Task was worked on earlier THIS session (in working memory) → Skip search entirely. Use working memory context directly.
- **POST-COMPACTION:** Context was compressed mid-session → Run env var/shell state audit: verify auth tokens, API keys, working directory, running processes. Persist critical env vars to `.env` BEFORE any deployment commands.
- **COLD-START:** New session referencing prior work → Execute SEARCH + READ phases below.
```

**Porting Requirements:**
- **File:** `.opencode/skills/PAI/SKILL.md` line ~139 (CONTEXT RECOVERY section, before SEARCH phase)
- **Add:** Recovery Mode Detection block (verbatim from v1.8.0)
- **Placement:** Immediately after HARD SPEED GATE table, before SEARCH phase

**Rationale:**
- SAME-SESSION: Working memory is active - no need to search disk
- POST-COMPACTION: OpenCode may compress context mid-session (unknown if this happens, but defensive)
- COLD-START: Existing behavior - load from disk

**Validation:**
- [ ] Three modes documented
- [ ] SAME-SESSION mode skips search (efficiency)
- [ ] POST-COMPACTION mode validates environment state
- [ ] COLD-START mode executes full SEARCH + READ

---

### 4.9 Wisdom Frames System (v1.8.0) — PROMOTED from DEFER

**Priority:** HIGH (compounding knowledge system)
**Upstream Commit:** a5622ad (v1.8.0 spec)
**Reclassified:** 2026-02-19 — Steffen decided full port, including CLI tool.
**File Changes:** SKILL.md (OBSERVE + LEARN phases), new WisdomFrameUpdater.ts tool, MEMORY/WISDOM/ directory

**What It Is:**
Dual-loop learning system that compounds knowledge across sessions:
- **OBSERVE reads:** Before ISC creation, read applicable Wisdom Frames → better criteria from past experience
- **LEARN writes:** After Algorithm Reflection, extract domain-relevant observations → knowledge accumulates

**Why It's MUST-PORT (not DEFER):**
1. The core system is platform-agnostic — it's Markdown files read/written by the Algorithm
2. "Need data first" is circular — the system CREATES data through use
3. The CLI tool is optional comfort; the Algorithm instructions are the core value
4. Aligns with PAI's "continuously improving" philosophy (Principle #2)

**Components (4):**

| Component | Effort | Description |
|-----------|--------|-------------|
| `MEMORY/WISDOM/` directory | 1 min | Directory structure with initial domain frames |
| SKILL.md OBSERVE addition | 15 min | Wisdom Injection step before ISC creation |
| SKILL.md LEARN addition | 15 min | Wisdom Frame Update step after Algorithm Reflection |
| `WisdomFrameUpdater.ts` CLI tool | 2-3 hours | CLI for managing frames (port from upstream pattern) |

**Porting Requirements:**

**Step 1: Create MEMORY/WISDOM/ directory structure:**
```
.opencode/MEMORY/WISDOM/
├── development.md        # Code patterns, build tools, testing
├── deployment.md         # Infrastructure, CI/CD, environments
├── security.md           # Auth, secrets, vulnerability patterns
├── communication.md      # User interaction, documentation
├── architecture.md       # System design, integration patterns
└── README.md             # Wisdom Frame format documentation
```

Each frame follows format:
```markdown
# Wisdom Frame: {domain}

## Anti-Patterns
- {observation} (source: session {date}, type: anti-pattern)

## Contextual Rules
- {observation} (source: session {date}, type: contextual-rule)

## Predictions
- {observation} (source: session {date}, type: prediction)

## Principles
- {observation} (source: session {date}, type: principle)
```

**Step 2: Add WISDOM INJECTION to OBSERVE phase in SKILL.md:**
- **Placement:** After CONSTRAINT EXTRACTION gate (OUTPUT 1.5), before ISC creation (OUTPUT 2)
- **Section:**
  ```markdown
  **OUTPUT 1.75 — 🧠 WISDOM INJECTION** (v1.8.0 — Standard+ effort level only):

  [READ applicable wisdom frames from MEMORY/WISDOM/ based on task domain]
  [Apply relevant heuristics, anti-patterns, and success patterns to inform ISC generation]
  [Example: If task involves deployment → read WISDOM/deployment.md for known pitfalls]
  [Instant/Fast: SKIP. Standard+: Scan domain frames relevant to reverse-engineered request.]
  ```
- **Gate modification:** Update OUTPUT 2 header to include "WISDOM INJECTION reads" in allowed tools list

**Step 3: Add WISDOM FRAME UPDATE to LEARN phase in SKILL.md:**
- **Placement:** After ALGORITHM REFLECTION, before final voice line
- **Section:**
  ```markdown
  🧠 **WISDOM FRAME UPDATE** (v1.8.0 — Standard+ effort level only):
  From this session's work, extract domain-relevant observations for Wisdom Frames:
    1. **Identify domain(s):** Which Frame(s) does this work touch? (development, deployment, security, etc.)
    2. **Extract observations:** What did this session teach?
       - New anti-patterns discovered? (type: anti-pattern)
       - New contextual rules learned? (type: contextual-rule)
       - New predictions about request patterns? (type: prediction)
       - Principles confirmed or refined? (type: principle)
    3. **Update Frame:** Append to MEMORY/WISDOM/{domain}.md or use WisdomFrameUpdater.ts
    4. **Skip if nothing learned:** Not every session teaches something new. Only update when genuine insight emerges.

  [This is the WRITE side of the dual loop. OBSERVE reads Frames → LEARN writes Frames. Together they make PAI compound knowledge across sessions.]
  ```

**Step 4: Port WisdomFrameUpdater.ts:**
- **Target:** `.opencode/skills/PAI/Tools/WisdomFrameUpdater.ts`
- **CLI interface:**
  ```bash
  bun WisdomFrameUpdater.ts --domain development --observation "Bun test requires --experimental-vm-modules for ES modules" --type contextual-rule
  bun WisdomFrameUpdater.ts --domain security --observation "env var prefixes can bypass SecurityValidator pattern matching" --type anti-pattern
  bun WisdomFrameUpdater.ts --list                    # Show all frames and entry counts
  bun WisdomFrameUpdater.ts --domain deployment --show # Show specific frame
  ```
- **Implementation notes:**
  - Read/write to `MEMORY/WISDOM/{domain}.md`
  - Append observation with timestamp and type
  - Use `PAI_DIR` environment variable (per 4.7)
  - File logging only (per ADR-004)
  - Create domain frame file if it doesn't exist

**Step 5: Seed initial Wisdom Frames from our own experience:**
- `development.md`: "Bun over npm always. TypeScript for everything. Biome over ESLint+Prettier."
- `deployment.md`: "Wrangler hangs without stdin close. File permissions must be 644/755."
- `security.md`: "env var prefix stripping needed for SecurityValidator. Fail-open on plugin errors."
- `architecture.md`: "Hooks → plugin handlers per ADR-001. Skills port 1:1 per ADR-003."

**Validation:**
- [ ] `MEMORY/WISDOM/` directory exists with 5+ domain frames
- [ ] Each frame has correct format (sections: Anti-Patterns, Contextual Rules, Predictions, Principles)
- [ ] SKILL.md OBSERVE phase has OUTPUT 1.75 WISDOM INJECTION section
- [ ] SKILL.md LEARN phase has WISDOM FRAME UPDATE section
- [ ] WisdomFrameUpdater.ts CLI works: `bun WisdomFrameUpdater.ts --list`
- [ ] WisdomFrameUpdater.ts appends correctly: verify entry appears in frame file
- [ ] Wisdom Injection gated by effort level (Standard+, skip for Instant/Fast)
- [ ] Initial seed frames populated with our existing knowledge

**Risk:** LOW — This is file reads/writes. No external dependencies. The CLI tool is the most complex part but follows existing PAI Tool patterns.

---

## 5. SHOULD-PORT Items

### 5.1 PRD Auto-Creation via AutoWorkCreation Hook (7ae82dd)

**Priority:** MEDIUM
**Upstream Commit:** 7ae82dd
**File Changes:** New hook, new template file, algorithm.ts CLI subcommand

**What It Is:**
Two PRD creation mechanisms:
1. **Auto via Hook:** After ISC Quality Gate passes in OBSERVE, create PRD stub alongside ISC.json/THREAD.md
2. **Manual via CLI:** `bun algorithm.ts new <project-name>` bootstraps PRD with frontmatter

**Upstream Implementation:**
- **Hook:** `hooks/AutoWorkCreation.hook.ts` (PostToolExecution trigger after TaskCreate)
- **Template:** `hooks/lib/prd-template.ts` (113 lines - exports generatePRDFromTask)
- **CLI:** `algorithm.ts` gains `new` subcommand

**OpenCode Adaptation:**
- **Hook → Plugin Handler:** Per ADR-001, create `.opencode/plugins/handlers/auto-work-creation.ts`
- **Trigger:** After TaskCreate tool completes (tool.execute.after event)
- **Template:** Port prd-template.ts to `.opencode/plugins/lib/prd-template.ts` (platform-agnostic)
- **CLI:** OpenCode doesn't have algorithm.ts CLI - **DEFER CLI subcommand**, keep template for future

**Porting Requirements:**

**Step 1: Port PRD Template**
- **Source:** `upstream:Releases/v3.0/.claude/hooks/lib/prd-template.ts`
- **Target:** `.opencode/plugins/lib/prd-template.ts`
- **Changes:**
  - Replace `~/.claude/` → `~/.opencode/` in path construction
  - Replace `CLAUDE.md` → `AGENTS.md` references
  - Update file path constants to use `PAI_DIR`

**Step 2: Create AutoWorkCreation Plugin Handler**
- **Target:** `.opencode/plugins/handlers/auto-work-creation.ts`
- **Event:** `tool.execute.after` (after TaskCreate)
- **Logic:**
  ```typescript
  // Pseudocode
  if (tool.name === 'TaskCreate' && isISCCriterion(result)) {
    const taskCount = await countISCTasks();
    if (taskCount >= 4) { // Minimum ISC count met
      const prdPath = await generatePRD(taskContext);
      logToFile(`PRD auto-created: ${prdPath}`);
    }
  }
  ```

**Step 3: Register in pai-unified.ts**
- Add handler registration for `tool.execute.after` event

**Validation:**
- [ ] PRD stub created automatically after 4+ ISC criteria exist
- [ ] PRD includes frontmatter, STATUS, CONTEXT, PLAN, ISC sections
- [ ] PRD file written to `~/.opencode/MEMORY/WORK/{session-slug}/PRD-{date}-{slug}.md`
- [ ] No duplicate PRD creation on subsequent TaskCreate calls

**Risk:** MEDIUM - Hook→Plugin translation may have edge cases. Thorough testing required.

---

### 5.2 Dynamic Algorithm Version Reading (fae1e52)

**Priority:** LOW (developer experience)
**Upstream Commit:** fae1e52
**File Changes:** RebuildPAI.ts, add Algorithm/LATEST file

**What It Is:**
Instead of hardcoding Algorithm version in RebuildPAI.ts, read from `Algorithm/LATEST` pointer file.

**Current Behavior:**
- RebuildPAI.ts hardcodes `const ALGORITHM_VERSION = "v1.2.0";`
- When updating Algorithm, must update both Components/Algorithm/vX.Y.Z.md AND RebuildPAI.ts

**New Behavior:**
- `Algorithm/LATEST` contains just the version string: `v1.8.0`
- RebuildPAI.ts reads this file: `const version = fs.readFileSync(LATEST_FILE).toString().trim();`

**Porting Requirements:**

**NOTE:** PAI-OpenCode does NOT have RebuildPAI.ts tool yet. This is a **future enhancement**.

If we port RebuildPAI.ts later:
- Create `skills/PAI/Components/Algorithm/LATEST` file containing `v1.8.0`
- RebuildPAI.ts reads this file instead of hardcoding
- Benefits: Single source of truth for Algorithm version

**Decision:** DEFER until RebuildPAI.ts is ported. Current SKILL.md has hardcoded `v1.2.0` in line 73 - that's fine for manual updates.

**Validation (future):**
- [ ] `Algorithm/LATEST` file exists
- [ ] RebuildPAI.ts reads version dynamically
- [ ] Version string appears correctly in generated SKILL.md

---

### ~~5.3 Wisdom Frames System (v1.8.0)~~ → PROMOTED TO MUST-PORT (4.9)

**RECLASSIFIED:** Moved from DEFER to **MUST-PORT** per Steffen's decision (2026-02-19).

See **Section 4.9** for full porting specification.

---

### 5.4 Community Fixes: Cross-Platform Support (95d65cc subset)

**Priority:** LOW (nice-to-have)
**Upstream Commit:** 95d65cc
**File Changes:** VoiceGate plugin (terminal detection)

**Fixes from 95d65cc:**
- **#683:** VoiceGate detects iTerm2, Warp, Alacritty, Apple Terminal

**What It Is:**
Terminal detection for voice notification routing. Some terminals support audio, some don't. VoiceGate checks `$TERM_PROGRAM` to route notifications.

**OpenCode Relevance:**
We have a voice server at localhost:8888. Do we need terminal detection? Probably not - our voice server is HTTP-based, not terminal-dependent.

**Decision:** **SKIP** - Claude Code-specific terminal integration. Our voice notifications use HTTP server, not terminal audio APIs.

---

### 5.5 Installer CLAUDE_CONFIG_DIR Respect (ebccb81)

**Priority:** N/A
**Upstream Commit:** ebccb81
**File Changes:** install.sh (installer script)

**What It Is:**
PAI installer script respects `CLAUDE_CONFIG_DIR` environment variable for custom config locations.

**OpenCode Relevance:**
We don't have an installer script yet. When we create one, use `PAI_DIR` instead of `CLAUDE_CONFIG_DIR`.

**Decision:** **SKIP** for v2.0 (no installer). Document for future when we create OpenCode installer.

---

## 6. SKIP Items

### 6.1 Kitty Socket-Based Remote Control (db32eb6, ed06d22)

**Priority:** N/A (Claude Code terminal-specific)
**Upstream Commits:** db32eb6, ed06d22
**File Changes:** Kitty remote control plugin

**What It Is:**
Claude Code integration with Kitty terminal emulator for remote control commands (split panes, send text, etc.) via Unix socket.

**Why SKIP:**
- Kitty terminal-specific - not a platform feature
- OpenCode has no terminal integration layer
- Socket-based remote control is Kitty API, not portable
- No OpenCode equivalent exists

**Consequence:** OpenCode users cannot remote-control Kitty from AI. Acceptable - this was a niche Claude Code feature.

---

### 6.2 StatusLine (referenced in v1.8.0 but not in commit list)

**Priority:** N/A (Claude Code UI-specific)
**File Changes:** None (already documented as non-portable in MIGRATION-V3.md)

**What It Is:**
Claude Code UI feature showing Algorithm state in sidebar.

**Why SKIP:**
- Claude Code UI extension, not available in OpenCode
- Requires Claude Code-specific API
- No OpenCode equivalent

**Consequence:** OpenCode users don't see visual Algorithm state tracker. Acceptable - Algorithm still runs, just no GUI indicator.

---

## 7. DEFER Items

**None.** All deferred items have been promoted or skipped.

- ~~Wisdom Frames System~~ → **Promoted to MUST-PORT (4.9)** per Steffen's decision (2026-02-19)
  - Rationale: Core concept is platform-agnostic (Markdown files), "need data first" is circular, system creates data through use

---

## 8. Risk Assessment

### Risk Matrix

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Voice_id breaks voice notifications** | MEDIUM | HIGH | Test voice server behavior first. Fallback: omit voice_id parameter if server defaults work. |
| **Algorithm v1.8.0 format breaks existing workflows** | LOW | HIGH | Thorough testing with real tasks. v1.2.0 → v1.8.0 is evolutionary, not revolutionary. |
| **PRD auto-creation duplicates or fails** | MEDIUM | MEDIUM | Implement with idempotency checks. Test with multiple ISC counts. |
| **Symlink following breaks on non-Unix systems** | LOW | LOW | Error handling already exists. Windows users rare in target audience. |
| **Context Recovery modes misidentify state** | LOW | MEDIUM | Conservative defaults - if unsure, use COLD-START mode. |
| **Rating noise filter breaks learning** | LOW | LOW | 5/10 ratings still logged to JSONL, just no learning files. Reversible. |
| **Security validator regression** | LOW | CRITICAL | Preserve existing patterns 1:1 per ADR-006. Only ADD stripping, don't modify existing patterns. |

### Highest Risk Items

1. **Voice_id handling (4.5)** - Needs investigation of OpenCode daidentity.json existence
2. **PRD auto-creation (5.1)** - Hook→Plugin translation may have edge cases
3. **Algorithm format changes** - Cumulative changes across 6 versions

### Mitigation Strategy

- **Voice:** Test localhost:8888 behavior before porting
- **PRD:** Implement with feature flag, enable after testing
- **Algorithm:** Port incrementally (OBSERVE first, then THINK, etc.), validate each phase

---

## 9. Implementation Order

### Phase 1: Foundational (Critical Path) - 3 hours

Priority: MUST-PORT items that other changes depend on

1. **CLAUDE_DIR → PAI_DIR rename (4.7)** - 30 mins
   - Update SessionHarvester.ts
   - Update GenerateSkillIndex.ts (preparation for next step)
   
2. **Symlink support in GenerateSkillIndex.ts (4.2)** - 30 mins
   - Implement symlink following
   - Test with symlinked skill directory

3. **Algorithm v1.6.0 - Verify Completion Gate (4.1)** - 1 hour
   - Add gate section to SKILL.md VERIFY phase
   - Update version string to v1.6.0 (intermediate) or skip to v1.8.0
   
4. **Security Validator env var stripping (4.4)** - 30 mins
   - Add prefix stripping to extractCommand
   - Test with `export AWS_SECRET=xyz` commands

### Phase 2: Quality Improvements - 2 hours

Priority: Fixes that enhance reliability/UX

5. **Stop 5/10 rating noise files (4.3)** - 15 mins
   - Add condition to rating-capture.ts
   - Test with neutral ratings

6. **Voice_id handling (4.5)** - 1 hour
   - **Decision point:** Test voice server, choose approach
   - Update all 8 curl commands in SKILL.md
   - Validate voice notifications work

7. **Context Recovery Modes (4.8)** - 30 mins
   - Add Recovery Mode Detection section to SKILL.md
   - Update CONTEXT RECOVERY documentation

### Phase 3: Algorithm v1.8.0 Completion - 2 hours

Priority: Finalize Algorithm parity

8. **Algorithm v1.8.0 full upgrade** - 2 hours
   - Read v1.7.0 and v1.8.0 spec files completely
   - Identify any changes not captured in above commits
   - Update SKILL.md version string to v1.8.0
   - Update all format references
   - Validate all 7 phases updated

### Phase 4: Wisdom Frames System (MUST-PORT) - 3-4 hours

Priority: MUST-PORT — compounding knowledge system

9. **MEMORY/WISDOM/ directory + seed frames (4.9 Step 1+5)** - 30 mins
   - Create directory structure
   - Write 5 initial domain frames from our experience

10. **SKILL.md Wisdom sections (4.9 Step 2+3)** - 30 mins
    - Add OUTPUT 1.75 WISDOM INJECTION to OBSERVE
    - Add WISDOM FRAME UPDATE to LEARN

11. **WisdomFrameUpdater.ts CLI tool (4.9 Step 4)** - 2-3 hours
    - Port from upstream pattern to OpenCode tool conventions
    - CLI: --domain, --observation, --type, --list, --show
    - Test with real observations

### Phase 5: PRD System (Optional) - 2-3 hours

Priority: SHOULD-PORT enhancement

12. **PRD auto-creation (5.1)** - 2-3 hours
    - Port prd-template.ts
    - Create auto-work-creation.ts plugin handler
    - Register in pai-unified.ts
    - Test with multi-ISC tasks

### Phase 6: Validation & Documentation - 1 hour

13. **Run validation checklist (Section 10)** - 30 mins
14. **Update documentation** - 30 mins
    - PAI-TO-OPENCODE-MAPPING.md
    - CHANGELOG.md (v2.0 entry)
    - MIGRATION-V3.md (mark as complete)

**Total Estimated Effort:** 10-14 hours (10 without Phase 5, 13-14 with Phase 5 included)

---

## 10. Validation Checklist

### Pre-Implementation

- [ ] `staging/v2.0` branch exists and is clean
- [ ] Upstream repository synced to commit a5622ad
- [ ] Current OpenCode SKILL.md is v1.2.0 confirmed

### Phase 1 Validation

- [ ] All tools use `PAI_DIR` environment variable
- [ ] No hardcoded `~/.claude` or `~/.opencode` in tools
- [ ] Symlinked skill directories are indexed correctly
- [ ] GenerateSkillIndex.ts follows symlinks without errors
- [ ] Verify Completion Gate appears in VERIFY phase (SKILL.md line ~408)
- [ ] Security validator strips env var prefixes correctly

### Phase 2 Validation

- [ ] 5/10 ratings don't create learning files
- [ ] 5/10 ratings still append to ratings.jsonl
- [ ] Voice notifications use correct voice (not placeholder)
- [ ] All 8 curl commands updated with voice_id or omitted
- [ ] Context Recovery Modes documented in SKILL.md

### Phase 3 Validation

- [ ] Algorithm version reads v1.8.0 (line 73 in SKILL.md)
- [ ] All v1.6.0, v1.7.0, v1.8.0 changes integrated
- [ ] No `YOUR_VOICE_ID_HERE` placeholders remain
- [ ] All 7 Algorithm phases updated to v1.8.0 format

### Phase 4 Validation (if ported)

- [ ] PRD template creates valid PRD files
- [ ] PRD frontmatter includes all v1.0.0 fields
- [ ] AutoWorkCreation handler fires after TaskCreate
- [ ] No duplicate PRD creation
- [ ] PRD files written to correct directory

### Final Validation

- [ ] Algorithm runs end-to-end on test task
- [ ] ISC Quality Gates all pass
- [ ] TaskList/TaskUpdate/TaskCreate work correctly
- [ ] Voice notifications audible (if implemented)
- [ ] Learning files created correctly (respecting 5/10 rule)
- [ ] Security validator blocks dangerous commands
- [ ] No regressions in existing skills
- [ ] PAI-TO-OPENCODE-MAPPING.md updated for v1.8.0
- [ ] CHANGELOG.md has v2.0.0 entry

### Documentation Validation

- [ ] All MUST-PORT items documented in CHANGELOG
- [ ] All SKIP items documented in MAPPING file
- [ ] DEFER items tracked in GitHub issues or future roadmap
- [ ] README.md reflects v2.0 capabilities
- [ ] No broken internal links in updated docs

---

## Appendix A: Algorithm Version Changelog (v1.3.0 → v1.8.0)

### v1.3.0 (MUST-PORT)
- Constraint Extraction System (OUTPUT 1.5)
- Self-Interrogation (OBSERVE phase)
- Build Drift Prevention (BUILD phase)
- Verification Rehearsal (THINK phase)
- Mechanical Verification rules (VERIFY phase)

### v1.6.0 (MUST-PORT - CRITICAL)
- **Verify Completion Gate** - mandatory reconciliation before LEARN
- Fixes: completion verification failure mode

### v1.7.0 (ADAPT)
- Hardcoded voice_id in curl payloads
- Changed from `"YOUR_VOICE_ID_HERE"` to `"gJx1vCzNCD1EQHT212Ls"`

### v1.8.0 (ADAPT)
- Template variable `{DAIDENTITY.ALGORITHMVOICEID}` for voice_id
- **Wisdom Frames System** (DEFER - see 5.3)
- **BUILD Capability Execution** - new substep in BUILD phase
- **Context Recovery Modes** - SAME-SESSION, POST-COMPACTION, COLD-START

---

## Appendix B: File Change Summary

### Files Modified (MUST-PORT)

```
.opencode/skills/PAI/SKILL.md
├─ Line 73: v1.2.0 → v1.8.0
├─ Line ~85-247: Voice curls - add voice_id
├─ Line ~139: Add Context Recovery Modes
├─ Line ~408: Add Verify Completion Gate
└─ Throughout: All v1.3.0, v1.6.0, v1.8.0 changes

.opencode/plugins/handlers/security-validator.ts
├─ Line ~43: Add env var prefix stripping
└─ Function: extractCommand()

.opencode/plugins/handlers/rating-capture.ts
├─ Line ~162: Add neutral rating filter
└─ Function: captureRating()

.opencode/skills/PAI/Tools/GenerateSkillIndex.ts
├─ Line ~46-77: Add symlink following
└─ Function: findSkillFiles()

.opencode/skills/PAI/Tools/SessionHarvester.ts
├─ Line 28: CLAUDE_DIR → PAI_DIR
└─ Line 30: --claude → --opencode
```

### Files Created (MUST-PORT - Phase 4: Wisdom Frames)

```
.opencode/MEMORY/WISDOM/development.md (seeded with existing knowledge)
.opencode/MEMORY/WISDOM/deployment.md (seeded)
.opencode/MEMORY/WISDOM/security.md (seeded)
.opencode/MEMORY/WISDOM/architecture.md (seeded)
.opencode/MEMORY/WISDOM/communication.md (seeded)
.opencode/MEMORY/WISDOM/README.md (format docs)
.opencode/skills/PAI/Tools/WisdomFrameUpdater.ts (CLI tool)
```

### Files Created (SHOULD-PORT - Phase 5 only)

```
.opencode/plugins/lib/prd-template.ts (ported from upstream)
.opencode/plugins/handlers/auto-work-creation.ts (new)
```

### Files Updated (plugin registration)

```
.opencode/plugins/pai-unified.ts
└─ Add: auto-work-creation handler registration (if Phase 4 implemented)
```

---

## Appendix C: Upstream References

**Upstream Repository:**
`/Users/steffen/workspace/github.com/danielmiessler/Personal_AI_Infrastructure`

**Commit Range:**
`ed06d22..a5622ad` (14 commits, Feb 2026)

**Algorithm Spec Files:**
- `Releases/v3.0/.claude/skills/PAI/Components/Algorithm/v1.6.0.md`
- `Releases/v3.0/.claude/skills/PAI/Components/Algorithm/v1.8.0.md`
- `Releases/v3.0/.claude/skills/PAI/Components/Algorithm/LATEST` (points to v1.8.0)

**Key Upstream Files:**
- `Releases/v3.0/.claude/hooks/lib/prd-template.ts` (113 lines)
- `Releases/v3.0/.claude/hooks/AutoWorkCreation.hook.ts`
- `Releases/v3.0/.claude/skills/PAI/Tools/GenerateSkillIndex.ts`
- `Releases/v3.0/.claude/hooks/SecurityValidator.hook.ts`
- `Releases/v3.0/.claude/hooks/RatingCapture.hook.ts`

---

## Appendix D: Decision Matrix

Quick reference for Engineer implementing this spec.

| Item | Port? | Why | Complexity |
|------|-------|-----|------------|
| Verify Completion Gate | **YES** | Critical bug fix | LOW - add section |
| Symlink Support | **YES** | Useful feature | LOW - small code change |
| 5/10 Rating Filter | **YES** | Reduces noise | LOW - one condition |
| Security Env Stripping | **YES** | Fixes false positives | LOW - preprocessing step |
| Voice_id Handling | **YES** | Fixes broken voice | MEDIUM - needs investigation |
| Context Recovery Modes | **YES** | Algorithm enhancement | LOW - add docs |
| PAI_DIR Rename | **YES** | Platform consistency | LOW - search-replace |
| Algorithm v1.8.0 | **YES** | Upstream parity | MEDIUM - cumulative changes |
| Wisdom Frames | **YES** | Compounding knowledge | MEDIUM - files + CLI tool |
| PRD Auto-Creation | **MAYBE** | Nice-to-have | HIGH - hook→plugin translation |
| Kitty Integration | **NO** | Claude Code only | N/A |
| StatusLine | **NO** | Claude Code UI only | N/A |

---

**End of Specification**
**Next Action:** Review with Steffen, then hand off to Engineer for implementation
**Estimated Implementation Time:** 8-12 hours (phases 1-3 = 8 hrs, phase 4 optional +3 hrs)
**Target Completion:** Within 1 week of approval
