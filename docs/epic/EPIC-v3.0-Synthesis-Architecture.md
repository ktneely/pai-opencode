# Epic: PAI-OpenCode v3.0 — The Synthesis Architecture

**Status:** Planning  
**Branch:** `v3.0-rearchitecture`  
**Target:** PAI-OpenCode v3.0.0 Release  
**Philosophy:** Not a port, but a synthesis — PAI's principles merged with OpenCode's unique capabilities

---

## 🎯 Vision Statement

> *"Take the concept of the PAI system — the Algorithm, lazy loading, Euphoric Surprise — and synthesize it with the capabilities and possibilities that OpenCode as a software platform brings us."*

**PAI-OpenCode v3.0** is not a clone of Daniel Miessler's PAI. It is a **new synthesis** that:
- Preserves PAI's core philosophy (Algorithm, Skills, Euphoric Surprise)
- Leverages OpenCode's unique strengths (Dynamic Model Tiers, Lazy Loading, MCP Ecosystem)
- Establishes its own identity as an OpenCode-First Ambient AI System
- Integrates with the broader Jeremiah Nexus ecosystem (Warrior App, Server instances, OMI)

---

## 📊 Research Summary: What We Learned

### 1. Agent Swarms — VERDICT: Not for 3.0

| Platform | Status | Details |
|----------|--------|---------|
| **Claude Code** | ✅ Released Feb 2026 | `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`, TeammateTool |
| **OpenCode** | ❌ Not implemented | GitHub issues #12661 (59 👍), #12711 (Design Proposal), PR #7756 (open) |

**Decision:** Agent Swarms is a **Claude-Code-only feature**. We will NOT chase this for v3.0. OpenCode's `Task` tool with sequential subagents is sufficient.

**Future:** Monitor PR #7756 for "subagent-to-subagent delegation" — if merged, we can revisit.

---

### 🔥 CRITICAL: Model Tiers ALREADY IN PRODUCTION

**Status:** ✅ Battle-tested in daily use  
**Location:** `/Users/steffen/.opencode/opencode.json`  
**Fork:** `anomalyco/opencode` (feature/model-tiers branch)  
**Commits:** 4 commits, including `8ae919675`  
**Binary:** Custom build running in production

**What we have TODAY:**
- ✅ 15+ agents with model_tiers configured
- ✅ quick/standard/advanced tiers per agent
- ✅ Algorithm-controlled tier selection
- ✅ Production use for months

**Agent Model Tier Matrix (Production):**
```
┌─────────────────┬──────────────────┬──────────────────┬──────────────────┐
│ Agent           │ Quick            │ Standard         │ Advanced         │
├─────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ Engineer        │ Qwen3 Coder      │ Kimi K2.5        │ GPT-5.3 Codex    │
│ Architect       │ Kimi K2.5        │ Kimi K2.5        │ Claude Sonnet 4.6│
│ Pentester       │ Qwen3 Coder      │ Kimi K2.5        │ Claude Sonnet 4.6│
│ Intern          │ MiniMax M2.1     │ Kimi K2          │ Kimi K2.5        │
│ QATester        │ Qwen3 Coder      │ Kimi K2.5        │ Kimi K2.5        │
│ Designer        │ Gemini 3 Flash   │ Gemini 3 Flash   │ Gemini 3 Pro     │
│ Artist          │ Gemini 3 Flash   │ Gemini 3 Flash   │ Gemini 3 Pro     │
│ Writer          │ Gemini 3 Flash   │ Gemini 3 Flash   │ Gemini 3 Pro     │
│ Perplexity      │ Sonar            │ Sonar Pro        │ Sonar Deep       │
│ Grok            │ Grok-4-1-Fast    │ Grok-4-1-Fast    │ Grok-4-1         │
│ ...             │ ...              │ ...              │ ...              │
└─────────────────┴──────────────────┴──────────────────┴──────────────────┘
```

**Usage in PAI Algorithm:**
```typescript
// Algorithm analyzes complexity
const complexity = analyzeTask(task);
const tier = complexity > 0.7 ? "advanced" : 
             complexity > 0.4 ? "standard" : "quick";

// Task with automatic model selection
Task({
  subagent_type: "Engineer",
  model_tier: tier,  // ← Proprietary feature
  prompt: "Implement authentication system"
});
```

**Strategic Note:**
> "local dev only, not for upstream"

This is our **competitive advantage**. While others wait for OpenCode to implement model tiers natively, we have:
- ✅ Working solution TODAY
- ✅ Cost optimization (60x savings)
- ✅ Quality optimization (right model for right task)
- ✅ Full control over routing logic

**Implication for v3.0:**
- PAI-OpenCode 3.0 = Custom OpenCode binary + PAI Core
- Users get Model Tiers out of the box
- This is a **premium feature** not available in standard OpenCode

---

### 2. OpenCode's Native Capabilities — Underutilized Gold

Based on [opencode.ai/docs](https://opencode.ai/docs/) and GitHub research:

| Feature | Current Usage | Potential | Implementation |
|---------|--------------|-----------|----------------|
| **Dynamic Model Tiers** | ✅ **IMPLEMENTED** in OpenCode Fork | 🚀 **READY** | `Task({ model_tier: "quick" })` per agent task |
| **Lazy Loading** | ⚠️ Native in OpenCode, not used in PAI | 🚀 HIGH | Native skill discovery + on-demand loading |
| **Native Skill System** | ⚠️ Partial | ✅ Native since v1.0.190 | `skill` tool with pattern-based permissions |
| **MCP Server Ecosystem** | ✅ Used | 🚀 HIGH | Dynamic skill discovery via MCP |
| **Plugin Events** | ⚠️ Basic | 🚀 HIGH | Replace hooks with native OpenCode events |
| **Context Compaction** | ✅ Automatic | ✅ Already works | Auto-compaction when context full |
| **Agent System** | ✅ Used | ✅ Flexible | Primary + Subagent architecture |

**Key Insight:** OpenCode has evolved BEYOND what PAI was designed for. We should ride this wave, not fight it.

---

### 3. DeepWiki Research Findings (March 3, 2026)

**Repository analyzed:** `anomalyco/opencode` via DeepWiki API (fast mode)  
**Questions asked:** 6 critical architecture questions  
**Success rate:** 6/6 (100%)  
**Duration:** 7-11 seconds per query

#### Key Findings:

| Topic | Finding | Impact on PAI-OpenCode 3.0 |
|-------|---------|---------------------------|
| **Lazy Loading** | ✅ Native via `skill` tool. Skills discovered in `.opencode/skills/`, loaded on-demand | Remove static 233KB context, use native lazy loading |
| **Model Tiers** | ⚠️ DeepWiki says "not implemented" — BUT WE HAVE IT IN FORK | Use custom binary with Model Tier support |
| **Agent System** | ✅ Primary (Build/Plan) + Subagents (General/Explore). Tab switching, @ mentioning | Align our agent definitions with OpenCode's system |
| **Plugin Events** | ✅ 20+ events (session, tool, file, etc.). Event-driven architecture | Migrate PAI Hooks to native OpenCode events |
| **MCP Integration** | ✅ Centralized in `packages/opencode/src/mcp/`. Config in `opencode.json` | Skills as MCP servers is viable |
| **Context Management** | ✅ Auto-compaction at token limit. SQLite storage. `experimental.session.compacting` hook | Don't build our own compaction |

#### Actionable Insights:

1. **Lazy Loading:** OpenCode's native skill system already does what PAI tries to do with static context. We should:
   - Reduce bootstrap context to ~20KB (Algorithm + Identity only)
   - Use native `skill` tool for on-demand loading
   - Remove our custom context loader

2. **Event System:** PAI Hooks can be replaced with OpenCode's native plugin events:
   - `session.created` → Load minimal context
   - `tool.execute.before` → Security validation
   - `session.compacted` → Extract learnings
   - `message.updated` → Work tracking

3. **MCP-First Architecture:** Instead of static skills, use MCP servers:
   ```typescript
   // opencode.json
   {
     "mcp": {
       "research-skill": {
         "type": "local",
         "command": "bun ~/.opencode/mcp/research/server.ts"
       }
     }
   }
   ```

4. **Context Compaction:** Don't fight OpenCode's auto-compaction. Use it:
   - Configure `compaction.reserved` tokens in `opencode.json`
   - Use `experimental.session.compacting` hook if needed
   - Trust the built-in system

---

### 4. Fabric Video Analysis: Daniel Miessler on PAI Philosophy & v4.0

**Method:** Fabric `extract_wisdom` + `youtube_summary` patterns applied to:
- Video 1: "The Great Transition" (6pP8x8sXoaM) — PAI v4.0 Release
- Video 2: "How and Why I Built PAI" (vvXC7sqso4w) — Interview with Nathan Labenz
- Source Material: PAI v4.0.2/v4.0.3 Release Notes, Blog Posts, GitHub

#### Core Philosophy (Extracted)

> **"PAI is designed to magnify human capabilities. It is a general problem-solving system that uses the PAI Algorithm."**

> **"Nothing escapes the Algorithm. The only variable is depth."**

> **"The trick is to capture what the user wishes they would have told us if they had all the intelligence, knowledge, and time in the world."**

> **"YOUR GOAL IS 9-10 implicit or explicit ratings for every response. EUPHORIC SURPRISE."**

#### Key Insights from Video Analysis

| Insight | Source | Implication for PAI-OpenCode 3.0 |
|---------|--------|----------------------------------|
| **PAI is Infrastructure, not a Tool** | Interview | Position as "Life OS" not "AI Assistant" |
| **Algorithm is THE Core** | Release v4.0 | 7 phases + ISC = Non-negotiable foundation |
| **Human 3.0 Vision** | Interview | Bridge to AGI, augment not replace |
| **Verification-First** | Release v4.0 | ISC as Verification Criteria, not planning |
| **Loop Mode = Autonomous** | Release v3.0 | Self-improving system via parallel workers |
| **Constraint Fidelity** | Algorithm v3.7.0 | Mechanical extraction prevents abstraction |
| **Build Drift Prevention** | v3.7.0 | Anti-criteria checking during implementation |
| **Skill Categories** | v4.0 | 11 categories solve "flat explosion" |
| **TELOS = Context** | Interview | Personal identity makes AI meaningful |
| **Fabric = Community** | Release | 240+ patterns are shared knowledge base |

#### PAI v4.0 Feature Matrix (Fabric Analysis)

| Feature | v4.0 Status | PAI-OpenCode 3.0 Status | Action |
|---------|-------------|-------------------------|--------|
| **Algorithm v3.7.0** | ✅ Released | ✅ Port | Core DNA |
| **Hierarchical Skills (11 cat)** | ✅ Released | ✅ Adopt | Better organization |
| **Full Installer (Electron)** | ✅ Released | ✅ Create | OpenCode-native |
| **Loop Mode** | ✅ v3.0+ | ✅ Implement | Parallel workers |
| **Constraint Extraction** | ✅ v3.7.0 | ✅ Integrate | Quality gate |
| **Build Drift Prevention** | ✅ v3.7.0 | ✅ Implement | Anti-criteria |
| **Verification Rehearsal** | ✅ v3.7.0 | ✅ Add | Pre-flight test |
| **MCP Support** | ✅ Released | ✅ Use native | External tools |
| **Voice Notifications** | ✅ Released | ✅ Enhance | Local TTS ready |
| **TELOS Integration** | ✅ Core | ✅ Keep | Identity system |
| **40 Skills** | ✅ Released | ✅ Port all | Full ecosystem |
| **240+ Fabric Patterns** | ✅ Community | ✅ Keep | Knowledge base |
| **StatusLine** | ✅ Released | ❌ DROP | TUI limitation |
| **Agent Swarms** | ❌ Not in PAI | ❌ N/A | Claude-only |
| **Euphoric Surprise** | ✅ Philosophy | ✅ Preserve | 9-10 ratings |

#### Daniel's Workflow Habits (Extracted)

1. **ISC-First** — Define success before work begins
2. **Algorithm for Everything** — Every task runs through 7 phases
3. **Continuous Verification** — Test against criteria during build
4. **Memory Capture** — Automatic learning extraction post-session
5. **Skill Modularization** — Reusable patterns in SKILL.md
6. **Security Pre-Flight** — Dangerous pattern detection
7. **Voice Ambient** — TTS for awareness during deep work
8. **Three-Layer Sovereignty** — Self-hosted > API > SaaS
9. **Documentation as Code** — PRDs, ADRs versioned
10. **Event-Driven** — Hooks over manual processes

#### ONE-SENTENCE TAKEAWAY (Fabric)

> **PAI v4.0 is the maturation of a Personal AI Infrastructure that systematically magnifies human capabilities through a 7-phase Algorithm with verifiable Ideal State Criteria, positioning itself as essential infrastructure for the Human 3.0 transition to AGI.**

#### REFERENCES (from Content)

- **The Algorithm** — 7-Phase Problem Solving Framework
- **Fabric** — 240+ Prompt Patterns
- **TELOS** — Life OS for Personal Context
- **Human 3.0** — AI-Augmented Humanity Vision
- **Unsupervised Learning** — Daniel's Newsletter
- **The Cognitive Revolution** — Nathan Labenz Interview
- **GitHub** — github.com/danielmiessler/Personal_AI_Infrastructure
- **Cognitive Revolution Podcast** — Interview Source
- **Bun** — JavaScript Runtime
- **Electron** — Cross-platform GUI

---

| PAI Feature | OpenCode Compatible | Status for 3.0 |
|-------------|---------------------|----------------|
| **Algorithm (7 Phases, ISC)** | ✅ Yes | CORE — Must port v3.7.0 |
| **Skills (SKILL.md, Tools, Workflows)** | ✅ Yes | CORE — Hierarchical structure |
| **Memory (WORK, LEARNING, STATE)** | ✅ Yes | CORE — Integrate with OMI |
| **Agents (Personalities)** | ✅ Yes | ADAPT — Use OpenCode's agent system |
| **Hooks** | ⚠️ Adapted | DONE — Already plugins |
| **Fabric Patterns** | ✅ Yes | KEEP — 240+ patterns |
| **Voice Notifications** | ✅ Yes | KEEP — Enhanced with local TTS |
| **StatusLine** | ❌ No | DROP — TUI limitation |
| **Agent Swarms** | ❌ No | DROP — Not available |
| **Euphoric Surprise Goal** | ✅ Yes | CORE — Philosophy preserved |

---

## 🏗️ The Synthesis Architecture

### Core Principles

1. **Algorithm-First** — The 7-phase ISC system is PAI's DNA. Preserve at all costs.
2. **OpenCode-Native** — Use what's there: Model tiers, lazy loading, events.
3. **MCP-Extensible** — Skills as MCP servers, dynamic discovery.
4. **Minimal Context** — Only load what's needed (Algorithm + TELOS = ~20KB, not 233KB).
5. **Voice-Ready** — Architecture for future Voice-to-Voice (WebSocket streaming).
6. **Ambient AI** — Integration with OMI, Warrior App, Jeremiah Nexus.

---

### The New Structure

```
.opencode/
├── PAI/                          # Core PAI system (modular, not monolithic)
│   ├── Algorithm/
│   │   └── v3.7.0.md             # Algorithm as living document
│   ├── Core/                     # Minimal context (~20KB)
│   │   ├── Algorithm.md          # 7 phases, ISC system
│   │   ├── Identity.md          # TELOS + Identity
│   │   └── Routing.md           # Model tier routing logic
│   └── SYSTEM/                  # System documentation (lazy loaded)
│       ├── Architecture/
│       ├── Memory/
│       └── Agents/
│
├── skills/                       # Hierarchical (from PAI v4.0.3)
│   ├── Core/                     # Algorithm-supporting skills
│   ├── Thinking/                 # Cognitive skills
│   ├── Research/                 # Information gathering
│   ├── Security/                 # Infosec skills
│   └── ...                       # Other categories
│
├── agents/                       # OpenCode-native agents
│   ├── build.md                  # Default with model_tier routing
│   ├── plan.md                   # Planning agent
│   └── custom/                   # PAI-specific agents
│
├── plugins/
│   └── pai-core.ts              # Unified plugin (simplified)
│
└── mcp/                         # MCP server configs
    ├── skills/                  # Skills as MCP servers
    └── discovery/               # Dynamic skill discovery
```

---

## 🔥 Key Innovations for v3.0

### 1. Dynamic Model Tier Routing ✅ ALREADY WORKING

**Status:** Implemented and battle-tested in production  
**Location:** `~/.opencode/opencode.json` (agent configuration)  
**Fork:** Custom OpenCode binary with Model Tier support

**How it works:**
```json
{
  "agent": {
    "Engineer": {
      "model": "opencode/qwen3-coder",
      "model_tiers": {
        "quick": { "model": "opencode/qwen3-coder" },
        "standard": { "model": "opencode/kimi-k2.5" },
        "advanced": { "model": "opencode/gpt-5.3-codex" }
      }
    },
    "Architect": {
      "model": "opencode/kimi-k2.5",
      "model_tiers": {
        "quick": { "model": "opencode/kimi-k2.5" },
        "standard": { "model": "opencode/kimi-k2.5" },
        "advanced": { "model": "opencode/claude-sonnet-4-6" }
      }
    }
  }
}
```

**Algorithm Integration:**
```typescript
// PAI Algorithm decides tier based on task complexity
const tier = analyzeComplexity(task) > 0.7 ? "advanced" : 
             analyzeComplexity(task) > 0.4 ? "standard" : "quick";

Task({ 
  subagent_type: "Engineer", 
  model_tier: tier,  // ← CUSTOM FORK FEATURE
  prompt: "..." 
});
```

**Production Agents with Tiers:**
| Agent | Quick | Standard | Advanced |
|-------|-------|----------|----------|
| **Engineer** | Qwen3 Coder | Kimi K2.5 | GPT-5.3 Codex |
| **Architect** | Kimi K2.5 | Kimi K2.5 | Claude Sonnet 4.6 |
| **Pentester** | Qwen3 Coder | Kimi K2.5 | Claude Sonnet 4.6 |
| **Researcher** | Kimi K2 | Kimi K2.5 | Claude Sonnet 4.6 |
| **Designer** | Gemini 3 Flash | Gemini 3 Flash | Gemini 3 Pro |

**Benefit:** 60x cost savings ($1.25/M vs $75/M) with same quality.  
**Requirement:** PAI-OpenCode v3.0 requires custom OpenCode binary.

---

### 2. Lazy Context Loading

**Current:** 233KB static context at session start.  
**Target:** ~20KB initial, rest loaded on-demand.

```typescript
// Minimal bootstrap
const MINIMAL_CONTEXT = [
  "PAI/Core/Algorithm.md",    // ~5KB
  "PAI/Core/Identity.md",     // ~10KB
  "PAI/Core/Routing.md"       // ~5KB
];

// Everything else via skill_find
// Skills loaded: on trigger, via MCP, or explicit request
```

**Implementation:** Use OpenCode's native `skill` tool + MCP discovery.

---

### 3. MCP-First Skill System

**Vision:** Skills as MCP servers, not static files.

```typescript
// MCP server as skill
{
  "mcp": {
    "research-skill": {
      "type": "local",
      "command": "bun ~/.opencode/mcp/research/server.ts",
      "enabled": true
    }
  }
}

// Discovery
const availableSkills = await mcp.discover();
// Use
await mcp.call("research-skill", "deepResearch", { topic: "AI" });
```

**Benefit:** Dynamic skill loading, version management, external contributions.

---

### 4. Event-Driven Architecture

**Replace:** PAI Hooks → OpenCode Plugin Events

```typescript
// Instead of: hooks/LoadContext.hook.ts (Claude-style)
// Use: plugins/pai-core.ts (OpenCode-native)

export default {
  name: "pai-core",
  
  onSessionStart: async (context) => {
    // Inject minimal context
    context.inject(MINIMAL_CONTEXT);
  },
  
  onToolCall: async (tool, args) => {
    // Security validation
    if (isDangerous(tool, args)) {
      return { blocked: true, reason: "..." };
    }
  },
  
  onSessionEnd: async (context) => {
    // Extract learnings
    await extractLearnings(context);
  }
};
```

---

### 5. Voice-to-Voice Foundation

**Not for 3.0, but architecture-ready:**

```typescript
// Future: WebSocket streaming
interface VoiceConfig {
  mode: "text-to-speech" | "voice-to-voice";
  provider: "local-macos" | "google-tts" | "elevenlabs" | "local-websocket";
  localModel?: "speecht5" | "coqui" | "mimic3";  // For M4 MacBooks
}

// Current: Text-to-Speech with Google TTS (cheap)
// Future: Local TTS on M4 (free), Voice-to-Voice with WebSocket
```

---

## 📋 Work Packages (Revised post-Research)

> **Critical Insight from Research:**
> - Model Tiers: ✅ **Production-ready** (no dev needed, just use)
> - Lazy Loading: ✅ **OpenCode-native** (use skill tool, don't build)
> - Context Compaction: ✅ **OpenCode-native** (auto-handled, don't build)
> - MCP Skills: ✅ **OpenCode-native** (configure, don't implement)
> - Plugin Events: ✅ **OpenCode-native** (migrate hooks → events)
> - Agent Swarms: ❌ **Not available** (skip entirely)

### WP1: Algorithm v3.7.0 Core + Model Tier Integration
**Status:** CRITICAL PATH  
**Effort:** 8-12 hours  
**Dependencies:** None  
**Branch:** `v3.0-wp1-algorithm`

**Goal:** Port Algorithm v3.7.0 and integrate with EXISTING Model Tier system

**Tasks:**
1. Port `Algorithm/v3.7.0.md` from PAI v4.0.3 → `.opencode/PAI/Algorithm/v3.7.0.md`
2. Create minimal bootstrap context (Algorithm + TELOS only = ~20KB)
3. **Integrate Model Tier routing into Algorithm logic**
   - Algorithm decides tier: `complexity > 0.7 ? "advanced" : complexity > 0.4 ? "standard" : "quick"`
   - Pass tier to Task tool: `Task({ model_tier: tier })`
   - Leverage EXISTING `~/.opencode/opencode.json` config
4. Port core PAI system files (modular structure)

**Key Insight:** Don't build Model Tiers - they're already production-ready in custom binary!

**Output:** 
- `.opencode/PAI/Algorithm/v3.7.0.md`
- `.opencode/PAI/Core/` (minimal bootstrap)
- Algorithm with integrated Model Tier routing

**Verification:**
- Algorithm runs 7 phases
- Model Tier routing works (15+ agents configured)
- Bootstrap context <25KB

---

### WP2: Context System Modernization (Lazy Loading)
**Status:** HIGH PRIORITY  
**Effort:** 6-8 hours  
**Dependencies:** WP1 (Algorithm provides structure)  
**Branch:** `v3.0-wp2-context`

**Goal:** Replace 233KB static context with OpenCode-native lazy loading

**Tasks:**
1. **REMOVE static context loading**
   - Current: 233KB loaded at session start
   - Target: ~20KB minimal bootstrap
2. **USE OpenCode-native `skill` tool for lazy loading**
   - Don't build custom loader!
   - Use OpenCode's discovery: `.opencode/skills/<name>/SKILL.md`
   - Use native `skill_find` and `skill_use`
3. Define `MINIMAL_BOOTSTRAP`:
   - Algorithm (5KB)
   - TELOS/Identity (10KB)
   - Routing/Config (5KB)
4. Remove `context-loader.ts` and related custom code

**Key Insight:** OpenCode already has lazy loading - we just need to stop fighting it!

**Output:**
- <25KB session startup
- Native skill tool usage
- Deleted: custom context loader

**Verification:**
- Session starts in <3 seconds
- Skills load on-demand via `skill` tool
- No static context bloat

---

### WP3: Event-Driven Plugin Architecture
**Status:** HIGH PRIORITY  
**Effort:** 5-7 hours  
**Dependencies:** WP2 (context system ready)  
**Branch:** `v3.0-wp3-plugins`

**Goal:** Migrate PAI Hooks → OpenCode native Plugin Events

**Tasks:**
1. **Consolidate 6 existing plugins into 1 unified plugin**
   - Current: pai-context-loader, pai-security, pai-work-tracking, etc.
   - Target: Single `plugins/pai-core.ts`
2. **USE OpenCode native events:**
   - `session.created` → Load minimal bootstrap context
   - `tool.execute.before` → Security validation + **Prompt Injection detection**
   - `session.compacted` → Extract learnings to MEMORY
   - `message.updated` → Work tracking / ratings
3. **ADD Prompt Injection Protection:**
   - Detect common injection patterns (ignore previous instructions, system prompt leaks, etc.)
   - Sanitize user input before processing
   - Use `tool.execute.before` to validate prompts
   - Log suspicious patterns for review
4. **REMOVE hook emulation layer**
   - Delete hook compatibility code
   - Use native TypeScript events
5. Update `plugins/pai-core.ts` with event handlers

**Key Insight:** Don't emulate hooks - use native OpenCode events! Add Prompt Injection defense as core security feature.

**Output:**
- `plugins/pai-core.ts` (unified, ~300 lines)
- Deleted: 5 separate plugins, hook emulation

**Verification:**
- Security validation runs on tool calls
- Context loads at session start
- Learnings extracted on compaction

---

### WP3.5: Security Hardening (Prompt Injection Protection)
**Status:** HIGH PRIORITY (Security Critical)  
**Effort:** 4-6 hours  
**Dependencies:** WP3 (plugin system ready)  
**Branch:** `v3.0-wp3-security`

**Goal:** Harden PAI-OpenCode against Prompt Injection and adversarial attacks

**Context:**
PAI-OpenCode processes user input and executes system commands. Without protection, malicious prompts could:
- Extract system prompts (prompt leaking)
- Override instructions (ignore previous commands)
- Trigger dangerous tool executions
- Manipulate context and memory

**Tasks:**
1. **Implement Prompt Injection Detection:**
   ```typescript
   const INJECTION_PATTERNS = [
     /ignore previous (instructions|commands)/i,
     /ignore all (prior|previous|above) (instructions|commands|context)/i,
     /system prompt|system instructions/i,
     /you are (now|from now on) \w+/i,
     /new (role|personality|identity):/i,
     /(pretend|act as if|imagine) you (are|were)/i,
     /DAN|jailbreak|\"mode\"/i,
     /<\|system|assistant|user\|>/i,  // Role markers
   ];
   
   function detectPromptInjection(input: string): {
     detected: boolean;
     confidence: number;
     pattern: string;
   }
   ```

2. **Add Input Sanitization Layer:**
   - Sanitize before LLM processing
   - Escape special characters
   - Remove/replace dangerous sequences
   - Maintain audit log of sanitization

3. **Implement Output Guardrails:**
   - Detect system prompt leakage in responses
   - Block responses containing sensitive patterns
   - Alert on suspicious output patterns

4. **Use PromptInjection Skill for Testing:**
   - Regular penetration testing with PromptInjection skill
   - Test against known jailbreak techniques
   - Validate defenses with red-team exercises

5. **Security Event Logging:**
   - Log all injection attempts
   - Track sanitization actions
   - Generate security reports

**Integration:**
- Add to `plugins/pai-core.ts` as `promptInjectionGuard(event)`
- Hook into `tool.execute.before` and `message.received` events
- Configure sensitivity levels in settings

**Key Insight:** Defense in depth - detect + sanitize + log + test regularly!

**Output:**
- Prompt injection detection module
- Input sanitization layer
- Security logging system
- Regular testing protocol

**Verification:**
- PromptInjection skill tests pass (blocked)
- Known jailbreaks fail
- No false positives on legitimate input
- Audit logs complete

---

### WP4: Hierarchical Skill Structure (PAI v4.0.3)
**Status:** MEDIUM PRIORITY  
**Effort:** 8-10 hours  
**Dependencies:** None (can run parallel to WP1-3)  
**Branch:** `v3.0-wp4-skills`

**Goal:** Migrate 39 skills to PAI v4.0.3's 11-category structure

**Tasks:**
1. Create 11 category directories:
   - Agents/, ContentAnalysis/, Investigation/, Media/, Research/, Scraping/, Security/, Telos/, Thinking/, USMetrics/, Utilities/
2. **Migrate existing 39 skills** (reorganize, not rebuild)
   - Move files to new structure
   - Adapt paths: `.claude/` → `.opencode/`
   - Update internal references
3. **Don't change skill logic** - only structure
4. Port any new v4.0.3 skills (if applicable)

**Key Insight:** Reorganize, don't reinvent. Skills work, structure improves.

**Output:**
- 11 category directories
- 39 skills reorganized
- No path issues (`.claude/` fully replaced)

**Verification:**
- All skills load without errors
- Biome check passes
- Skill discovery works

---

### WP5: MCP-First Skills (Configuration, not Implementation)
**Status:** MEDIUM PRIORITY  
**Effort:** 4-6 hours  
**Dependencies:** WP4 (skills organized)  
**Branch:** `v3.0-wp5-mcp`

**Goal:** Configure 3-5 core skills as MCP servers (use OpenCode-native MCP)

**Tasks:**
1. **SELECT 3-5 core skills** for MCP conversion:
   - Research (API-heavy)
   - Security (tool-heavy)
   - One more (to be decided)
2. **CONFIGURE in `opencode.json`**:
   ```json
   {
     "mcp": {
       "research-skill": {
         "type": "local",
         "command": "bun ~/.opencode/mcp/research/server.ts"
       }
     }
   }
   ```
3. **Don't build MCP server framework** - use OpenCode's native MCP!
4. Create simple TypeScript servers for selected skills
5. Document skill discovery via MCP

**Key Insight:** OpenCode has MCP built-in - just configure, don't implement!

**Output:**
- 3-5 skills as MCP servers
- `opencode.json` MCP configuration
- Documentation

**Verification:**
- MCP tools appear in OpenCode
- Skills work via MCP
- Dynamic discovery functional

---

### WP6: Voice & Ambient AI Foundation
**Status:** LOW-MEDIUM PRIORITY  
**Effort:** 4-6 hours  
**Dependencies:** WP1 (core working)  
**Branch:** `v3.0-wp6-voice`

**Goal:** Architecture for future Voice-to-Voice (NOT full implementation)

**Tasks:**
1. **Refactor VoiceServer for WebSocket-ready architecture**
   - Current: HTTP-based TTS
   - Add WebSocket endpoints (prep for streaming)
   - Don't implement full V2V yet!
2. **Design OMI integration points**
   - Document how PAI-OpenCode ↔ OMI integration works
   - Define message formats
3. **Create Voice-to-Voice roadmap** (document, not code)
   - Phase 1: WebSocket TTS (immediate)
   - Phase 2: Local TTS on M4 Macs (future)
   - Phase 3: Full V2V (distant future)
4. Ensure VoiceServer works with current setup

**Key Insight:** Prepare architecture, don't build full V2V yet!

**Output:**
- WebSocket-ready VoiceServer
- OMI integration design doc
- V2V roadmap (3 phases)

**Verification:**
- Voice notifications work (existing)
- WebSocket endpoints ready
- Architecture documented

---

### WP7: Migration & Installer
**Status:** MEDIUM PRIORITY  
**Effort:** 6-8 hours  
**Dependencies:** WP1-5 complete  
**Branch:** `v3.0-wp7-migration`

**Goal:** Smooth upgrade from v2.x + new installer

**Tasks:**
1. **Create migration script** `v2-to-v3.ts`:
   - Backup existing `.opencode/`
   - Move skills to new structure
   - Update path references
   - Preserve USER/ customizations
2. **Create installer** for custom OpenCode binary:
   - Download custom binary (with Model Tiers)
   - Install PAI-OpenCode core
   - Configure `opencode.json` with Model Tiers
3. **Documentation:**
   - `UPGRADE.md` (for existing users)
   - `INSTALL.md` (for new users)
   - `ARCHITECTURE.md` (technical overview)

**Output:**
- `migration-v2-to-v3.ts` script
- Installer for custom binary
- Complete documentation

**Verification:**
- Migration tested on 3+ environments
- New install works clean
- No data loss

---

### WP8: Testing & v3.0.0 Release
**Status:** CRITICAL PATH (Final)  
**Effort:** 6-10 hours  
**Dependencies:** ALL WPs complete  
**Branch:** `v3.0-rearchitecture` (integration)

**Goal:** Stable release

**Tasks:**
1. **Full test suite:**
   - Algorithm tests (all 7 phases)
   - Model Tier routing tests
   - Lazy loading tests
   - Plugin event tests
   - Skill hierarchy tests
2. **Integration testing:**
   - End-to-end workflows
   - Migration testing
   - Custom binary compatibility
3. **Beta release:**
   - Tag `v3.0.0-beta.1`
   - Limited user testing
   - Feedback collection
4. **Final release:**
   - Tag `v3.0.0`
   - Release notes
   - Announcement

**Output:**
- All tests passing
- `v3.0.0` release
- Release notes

**Verification:**
- 100% test pass rate
- Beta feedback positive
- CI/CD green

---

## 🔄 Revised Work Package Dependencies

```
WP1 (Algorithm + Model Tiers)
    │
    ├──► WP2 (Lazy Context) ──► WP3 (Event Plugins) ──► WP3.5 (Security) ──► WP8 (Testing/Release)
    │                                                         │
    │                                                         └──► Security logging integration
    │
    ├──► WP4 (Skills) ──► WP5 (MCP Config)
    │
    └──► WP6 (Voice) ──► WP7 (Migration) ──► WP8
```

**Critical Path:** WP1 → WP2 → WP3 → **WP3.5** → WP8  
**Security is Critical:** WP3.5 added to critical path  
**Parallel Work:** WP4, WP5, WP6 (after WP1)  
**Final Steps:** WP7 → WP8

---

## 📊 Revised Effort & Timeline

| WP | Effort | Cumulative | Deliverable |
|----|--------|------------|-------------|
| WP1 | 8-12h | 8-12h | Algorithm v3.7.0 + Model Tiers |
| WP2 | 6-8h | 14-20h | Lazy Context (~20KB) |
| WP3 | 5-7h | 19-27h | Event-Driven Plugins |
| **WP3.5** | **4-6h** | **23-33h** | **Prompt Injection Protection** |
| WP4 | 8-10h | 31-43h (parallel) | Skill Hierarchy |
| WP5 | 4-6h | 35-49h (parallel) | MCP Configuration |
| WP6 | 4-6h | 39-55h (parallel) | Voice Foundation |
| WP7 | 6-8h | 45-63h | Migration & Installer |
| WP8 | 6-10h | 51-73h | Testing & Release |

**Total Critical Path:** 51-73 hours  
**With Parallel Work:** 6-9 weeks (1 person)  
**With Multiple Agents:** 3-4 weeks

---

## 🛡️ Security-First Architecture

| Feature | Source | Value |
|---------|--------|-------|
| **Dynamic Model Tiers** | OpenCode-native | 60x cost optimization |
| **Lazy Context Loading** | OpenCode-native | Fast session start |
| **MCP Skill Discovery** | OpenCode-native | Dynamic extensibility |
| **Event-Driven Architecture** | OpenCode-native | Cleaner code |
| **Prompt Injection Protection** | **Security Layer** | Defense against adversarial attacks |
| **Input Sanitization** | **Security Layer** | Pre-processing protection |
| **Security Event Logging** | **Security Layer** | Audit trail & monitoring |
| **Voice-to-Voice Ready** | Future | Ambient AI foundation |
| **OMI Integration** | Jeremiah Nexus | Wearable AI companion |

---

## 🎯 Success Criteria

1. ✅ Algorithm v3.7.0 fully functional with ISC
2. ✅ Initial context <25KB (vs. 233KB current)
3. ✅ Dynamic Model Tier routing working
4. ✅ 3+ skills as MCP servers
5. ✅ Unified event-driven plugin
6. ✅ All 39 skills in hierarchical structure
7. ✅ Migration script tested
8. ✅ Documentation complete
9. ✅ Biome zero errors
10. ✅ CI/CD passing

---

## 📚 References

- **PAI Original:** `/Users/steffen/workspace/github.com/danielmiessler/Personal_AI_Infrastructure/`
- **PAI v4.0.3:** `Releases/v4.0.3/.claude/`
- **OpenCode Docs:** [opencode.ai/docs](https://opencode.ai/docs/)
- **OpenCode GitHub:** [github.com/anomalyco/opencode](https://github.com/anomalyco/opencode)
- **Agent Teams Issue:** [#12661](https://github.com/anomalyco/opencode/issues/12661)
- **Lazy Loading Discussion:** [#7269](https://github.com/anomalyco/opencode/issues/7269)
- **PAI-OpenCode Current:** `/Users/steffen/workspace/github.com/Steffen025/pai-opencode/`
- **Handoff Document:** `MEMORY/WORK/2026-02-14_PAI-OpenCode-ReArchitecture_HANDOFF.md`

---

## 🚀 Next Actions

1. **Approve this Epic** — Confirm synthesis approach
2. **Start WP1** — Algorithm v3.7.0 with Model Tier integration
3. **DeepWiki Research** — Query OpenCode architecture specifics
4. **YouTube Analysis** — Daniel's PAI v4.0 videos for feature extraction

---

**This is not a port. This is a synthesis.**  
**This is PAI-OpenCode v3.0.**

---

*Epic created: 2026-03-03*  
*Status: Ready for implementation*  
*Decision pending: Approve synthesis approach*
