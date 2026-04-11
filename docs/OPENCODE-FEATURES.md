# OpenCode: Unique Features

OpenCode is an open-source AI coding assistant built by Anomaly. While many AI coding tools exist, OpenCode has distinctive features that make it particularly well-suited for PAI (Personal AI Infrastructure).

## 1. Provider Flexibility (75+ AI Providers)

Unlike tools locked to a single vendor, OpenCode supports **75+ AI providers** out of the box. But v1.3.0 goes further — you don't just switch providers for the whole session, the orchestrator routes **each agent to different providers within the same session**.

### Supported Providers (Highlights)

| Category | Providers |
|----------|-----------|
| **Enterprise** | Anthropic (Claude), OpenAI (GPT-4), Google (Gemini), AWS Bedrock, Azure OpenAI |
| **Speed-Optimized** | Groq, Together.ai, Fireworks, DeepSeek |
| **Open Source** | Mistral, Cohere, Perplexity, Meta (Llama) |
| **Local** | Ollama, LM Studio, vLLM, LocalAI |

**Why this matters for PAI:**
PAI is model-agnostic. You can run the same skills, agents, and workflows on Claude Opus, GPT-4, or a local Llama model. OpenCode makes this seamless — and v1.3.0 adds dynamic per-agent routing.

![Provider Grid](images/provider-grid.jpg)

### Agent-Based Routing

This is the key differentiator: **each agent has its own configured model, and you route work by choosing the appropriate agent for the task**.

> [!NOTE]
> **Source of truth:** actual model names per agent live in [`opencode.json`](../opencode.json) under the `agent` key, and vary per provider profile (Anthropic / Zen / OpenAI / Local). See [`docs/architecture/ToolReference.md`](architecture/ToolReference.md) for the runtime contract. The table below shows **one illustrative profile** — treat the "Example Model" column as a sample, not a contract.

| Agent | Example Model | Best For |
|-------|---------|---------|
| **Architect** | Kimi K2.5 | System design, complex architecture |
| **Engineer** | Kimi K2.5 | Implementation, debugging |
| **explore** | GLM 4.7 | Fast file lookups, codebase search |
| **Intern** | GLM 4.7 | Batch edits, simple mechanical work |
| **DeepResearcher** | GLM 4.7 | Web research, information gathering |
| **Writer** | Gemini Flash | Technical writing, documentation |
| **Pentester** | Kimi K2.5 | Security audits |

**How it works:**
1. Match the task to an appropriate agent
2. Use lightweight agents (`explore`, `Intern`) for cheap work
3. Use heavier agents (`Architect`, `Engineer`) for complex work
4. Each agent's model is configured once in `opencode.json`

**Example:**
```typescript
// Simple batch work → use a lightweight agent
Task({ subagent_type: "explore", prompt: "Find all files referencing X" })
Task({ subagent_type: "Intern", prompt: "Replace X with Y in 20 files" })

// Complex debugging → use the standard Engineer agent
Task({ subagent_type: "Engineer", prompt: "Debug this race condition" })
```

This is unique to OpenCode. Claude Code cannot do this — it's locked to Anthropic only.

### Legacy: Session-Level Provider Switching

For switching the entire session provider (v1.0 behavior):

```bash
# Use Claude Opus for everything
opencode --provider anthropic --model claude-opus-4-5

# Use Groq for blazing-fast iterations
opencode --provider groq --model llama-3.3-70b-versatile

# Use local Ollama for offline work
opencode --provider ollama --model qwen2.5-coder:32b
```

Same PAI infrastructure, different provider strategy.

## 2. Session Sharing (Real-Time Collaboration)

OpenCode pioneered **live session sharing**—multiple users can join the same AI coding session in real-time.

### How It Works

1. **Start a session** with OpenCode
2. **Share the session URL** (e.g., `opencode.dev/session/abc123`)
3. **Collaborators join** via browser, desktop, or terminal
4. **Everyone sees the same context**, messages, and code changes live

![Session Sharing](images/session-sharing-concept.jpg)

### Use Cases

- **Pair Programming**: Navigate complex refactors together
- **Code Review**: Review AI-generated code with teammates in real-time
- **Teaching**: Instructor shares session, students watch AI solve problems
- **Async Handoffs**: Share session link for context-rich handoffs

**PAI Integration:**
Share sessions with full PAI context. Your skills, agents, and memory are visible to collaborators—perfect for team environments using shared PAI configurations.

## 3. Plugin System (Extensibility)

OpenCode has a **plugin architecture** for extending functionality without modifying core code.

### Hooks vs Plugins

| Feature | PAI Hooks (Claude Code) | OpenCode Plugins |
|---------|-------------------------|------------------|
| **Scope** | PAI-specific lifecycle | OpenCode core functionality |
| **Language** | TypeScript | TypeScript/JavaScript |
| **Execution** | Subprocess (separate process) | In-process (same runtime) |
| **Purpose** | AI behavior, memory, security | UI, integrations, providers |
| **Events** | ~5 lifecycle hooks | 16+ typed Bus events |

### Full Plugin Hook Interface (OpenCode-native)

```typescript
export interface Hooks {
  event?: (input: { event: BusEvent }) => Promise<void>   // ALL 16+ events
  tool?: { [key: string]: ToolDefinition }                 // Custom tools
  auth?: AuthHook                                          // Provider auth
  "shell.env"?: (input, output) => Promise<void>          // Env per bash call
  "tool.execute.before"?: (input, output) => Promise<void> // Pre-tool hook
  "tool.execute.after"?: (input, output) => Promise<void>  // Post-tool hook
  "tool.definition"?: (input, output) => Promise<void>     // Tool desc modifier
  "permission.ask"?: (info, output) => Promise<void>       // Permission control
  "chat.parameters"?: (input, output) => Promise<void>     // LLM params
}
```

**Example plugins:**
- Custom AI provider integration
- Enhanced terminal UI widgets
- External tool integrations (Jira, Linear, Notion)
- PAI-unified.ts — all PAI behavior (security, voice, learning, memory)

PAI plugins control **what the AI does**. OpenCode plugins control **how the tool works**.

## 4. Multi-Client Architecture

OpenCode runs on **three clients** sharing the same backend:

### Terminal UI (TUI)
- Primary interface for developers
- Full keyboard shortcuts
- Vim/Emacs keybindings
- Optimized for SSH/remote work

### Desktop App
- Electron-based native app
- macOS, Windows, Linux
- System tray integration

### Web Interface
- Browser-based access
- No installation required
- Perfect for session sharing
- Mobile-friendly

![Client Architecture](images/client-architecture.jpg)

**PAI Compatibility:**
All PAI features (skills, agents, plugins) work identically across all three clients. Switch between terminal and browser mid-session without losing context.

## 5. Themes (15+ Built-In)

OpenCode ships with **15+ carefully designed themes** for the terminal UI:

- **Catppuccin** (Latte, Frappé, Macchiato, Mocha)
- **Dracula**
- **Nord**
- **Solarized** (Dark, Light)
- **Gruvbox**
- **One Dark Pro**
- **Tokyo Night**
- And more...

```bash
# Set theme via config
opencode config set theme "catppuccin-mocha"

# Or via flag
opencode --theme nord
```

## 6. CLI Mode (Scripting & Automation)

Beyond interactive mode, OpenCode has a **CLI mode** for scripting:

```bash
# Run a single prompt and exit
opencode run "Analyze this codebase for security vulnerabilities"

# Pipe input
cat requirements.txt | opencode run "Generate test cases"

# Output to file
opencode run "Document all API endpoints" > docs/API.md

# Use in CI/CD
opencode run "Review this PR for breaking changes" --context pr-diff.txt
```

**PAI Use Case:**
Trigger PAI skills from shell scripts, cron jobs, or git hooks:

```bash
# Daily security scan
opencode run "/security --scan-all" >> reports/$(date +%Y-%m-%d).log

# Pre-commit hook
opencode run "Check for secrets in staged files"
```

## 7. Native Infrastructure Features (OpenCode-exclusive)

These features work automatically — no PAI code needed:

### LSP Integration
After every `Write` or `Edit` tool call, OpenCode notifies all active Language Server Protocol servers and returns syntax errors/warnings immediately. PAI code gets code quality feedback for free.

### Git Snapshot System
Before each AI edit, OpenCode creates a Git snapshot in a hidden repository. Every change can be undone with a single click. Configured via `"snapshot": true` in `opencode.json`.

### Parcel File Watcher
OpenCode watches the entire project directory with native OS file system events (FSEvents on macOS, inotify on Linux). Plugins subscribe to `file.edited` and `file.watcher.updated` events for real-time reactions.

### 6-Level Config Hierarchy
```
1. Remote .well-known/opencode  (lowest — org defaults)
2. Global ~/.config/opencode/
3. OPENCODE_CONFIG env var
4. ./opencode.json              (project config)
5. .opencode/ directories       (skills, commands, agents, plugins)
6. Inline config                (highest — environment overrides)
```
Arrays are **concatenated** (not replaced) across levels — plugins and instructions from all levels are combined.

### Backward-Compatible Skill Loading
OpenCode reads from **both** `.claude/skills/` AND `.opencode/skills/` — PAI-OpenCode maintains full backward compatibility with Claude Code skill directories.

### ACP Server (IDE Integration)
OpenCode can run as an Agent Client Protocol server, allowing IDE integration (e.g., Zed editor) to connect to PAI as a native AI assistant.

---

## Comparison: OpenCode vs Alternatives (Updated 2026-03-06)

| Feature | OpenCode | Cursor | Copilot | Claude Code |
|---------|----------|--------|---------|-------------|
| **Provider choice** | 75+ | OpenAI only | GitHub Models | Anthropic only |
| **Session sharing** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Multi-client** | TUI + Desktop + Web | Desktop only | VS Code only | Desktop only |
| **Plugin system** | ✅ Yes (16+ events) | Limited | GitHub extensions | Hooks only (~5) |
| **Open source** | ✅ Fully | ❌ Proprietary | ❌ Proprietary | ❌ Proprietary |
| **LSP Integration** | ✅ Auto | ✅ Auto | ✅ Auto | ❌ Manual |
| **Git Snapshots** | ✅ Auto | ❌ No | ❌ No | ❌ No |
| **File Watching** | ✅ Native events | ✅ Yes | ✅ Yes | ❌ Limited |
| **Agent Swarms** | ❌ Not yet | ❌ No | ❌ No | ✅ Experimental |
| **PAI compatible** | ✅ Native support | ⚠️ Limited | ⚠️ Limited | ✅ Original |

## Why OpenCode + PAI?

OpenCode's **provider flexibility** + **plugin system** + **native infrastructure** + **agent-based routing** make it uniquely suited for PAI:

1. **Freedom**: Run PAI skills on any model (Claude, GPT-4, local)
2. **Agent-Based Routing**: Choose the right agent for each task — lightweight agents for simple work, heavier agents for complex work
3. **Native Infrastructure**: LSP, Git snapshots, file watching — free, no extra code
4. **Collaboration**: Share PAI-enhanced sessions with teammates
5. **Extensibility**: 16+ event types for plugin hooks vs ~5 in Claude Code
6. **Backward Compatibility**: Reads both `.claude/skills/` and `.opencode/skills/`

OpenCode provides the **platform**. PAI provides the **personalization**. Cost optimization via appropriate agent selection.

## Learn More

- **Official OpenCode Docs**: [docs.opencode.ai](https://docs.opencode.ai)
- **GitHub Repository**: [github.com/anomalyco/opencode](https://github.com/anomalyco/opencode)

---

**Next Steps:**
- [Install PAI-OpenCode](../INSTALL.md)
- [Understand the Plugin System](./PLUGIN-SYSTEM.md)
- [Migration from Claude Code](./MIGRATION.md)
