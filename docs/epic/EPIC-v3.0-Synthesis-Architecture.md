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

### 2. OpenCode's Native Capabilities — Underutilized Gold

Based on [opencode.ai/docs](https://opencode.ai/docs/) and GitHub research:

| Feature | Current Usage | Potential | Implementation |
|---------|--------------|-----------|----------------|
| **Dynamic Model Tiers** | ❌ Unused | 🚀 HIGH | `Task({ model_tier: "quick" })` per agent task |
| **Lazy Loading** | ❌ No (233KB static) | 🚀 HIGH | Native skill discovery + on-demand loading |
| **Native Skill System** | ⚠️ Partial | ✅ Native since v1.0.190 | `skill` tool with pattern-based permissions |
| **MCP Server Ecosystem** | ✅ Used | 🚀 HIGH | Dynamic skill discovery via MCP |
| **Plugin Events** | ⚠️ Basic | 🚀 HIGH | Replace hooks with native OpenCode events |
| **Context Compaction** | ✅ Automatic | ✅ Already works | Auto-compaction when context full |
| **Agent System** | ✅ Used | ✅ Flexible | Primary + Subagent architecture |

**Key Insight:** OpenCode has evolved BEYOND what PAI was designed for. We should ride this wave, not fight it.

---

### 3. PAI Features vs. OpenCode Compatibility

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

### 1. Dynamic Model Tier Routing

**What:** Every Task gets the optimal model tier based on complexity.

```typescript
// Algorithm decides model tier
const taskComplexity = analyzeComplexity(prompt);
const modelTier = taskComplexity > 0.7 ? "advanced" : 
                  taskComplexity > 0.4 ? "standard" : "quick";

Task({ 
  subagent_type: "Engineer", 
  model_tier: modelTier,  // ← OpenCode-native
  prompt: "..." 
});
```

**Benefit:** 60x cost savings ($1.25/M vs $75/M) with same quality.

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

## 📋 Work Packages (Revised for Synthesis)

### WP1: Core Algorithm v3.7.0 Port
**Goal:** Port Algorithm, but OpenCode-native.
- Port `Algorithm/v3.7.0.md` from PAI v4.0.3
- Create `PAI/Core/` minimal context structure
- Integrate Model Tier routing into Algorithm

**Output:** Algorithm + Dynamic Model Routing

---

### WP2: Lazy Context System
**Goal:** 233KB → 20KB initial context.
- Define `MINIMAL_CONTEXT` (Algorithm + Identity + Routing)
- Implement lazy loading via `skill` tool
- Remove static context bloat

**Output:** Fast session start, on-demand skill loading

---

### WP3: MCP-First Skills
**Goal:** Skills as MCP servers.
- Port 3-5 core skills to MCP server architecture
- Implement skill discovery
- Create skill registry

**Output:** Dynamic skill system

---

### WP4: Event-Driven Plugins
**Goal:** Simplified plugin architecture.
- Consolidate 6 plugins into 1 event-driven plugin
- Use OpenCode native events
- Remove hook emulation layer

**Output:** `plugins/pai-core.ts` (unified)

---

### WP5: Hierarchical Skill Migration
**Goal:** Move 39 skills to PAI v4.0.3 structure.
- Create 11 categories (Agents, Thinking, Security, etc.)
- Migrate existing skills
- Adapt paths (`.claude/` → `.opencode/`)

**Output:** Organized skill hierarchy

---

### WP6: Voice & Ambient AI Foundation
**Goal:** Architecture for future voice integration.
- Refactor VoiceServer for WebSocket-ready architecture
- Design OMI integration hooks
- Document Voice-to-Voice roadmap

**Output:** Voice-ready foundation

---

### WP7: Integration & Migration
**Goal:** Smooth upgrade from v2.x.
- Migration script for existing users
- Installer for new users
- Documentation (UPGRADE.md, ARCHITECTURE.md)

**Output:** Migration path + installer

---

### WP8: Testing & Release
**Goal:** Stable v3.0.0 release.
- Full test suite
- Beta testing
- Release notes

**Output:** PAI-OpenCode v3.0.0

---

## 🚫 What We're DROPPING

| Feature | Reason | Alternative |
|---------|--------|-------------|
| **StatusLine** | OpenCode TUI limitation | Voice notifications |
| **Agent Swarms** | Not in OpenCode | Task tool with subagents |
| **Static 233KB Context** | Inefficient | Lazy loading |
| **Skill Packs** | Legacy structure | MCP-first skills |
| **Fixed Model per Agent** | Suboptimal | Dynamic Model Tiers |
| **Hook Emulation** | Technical debt | Native OpenCode events |

---

## 🎓 What We're ADDING (New)

| Feature | Source | Value |
|---------|--------|-------|
| **Dynamic Model Tiers** | OpenCode-native | 60x cost optimization |
| **Lazy Context Loading** | OpenCode-native | Fast session start |
| **MCP Skill Discovery** | OpenCode-native | Dynamic extensibility |
| **Event-Driven Architecture** | OpenCode-native | Cleaner code |
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
