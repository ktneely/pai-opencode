# Local-Only Setup Guide

For users running PAI-OpenCode with Ollama or other local models without external API access.

---

## Quick Start

PAI OpenCode's installer currently supports cloud providers only (`zen`, `anthropic`, `openrouter`, `openai`).

For a local-only (Ollama) setup you must configure `opencode.json` manually.

1. Make sure Ollama is running:
   ```bash
   ollama serve
   ```

2. Disable external tools (see below)

3. Start OpenCode:
   ```bash
   opencode
   ```

---

## Disable External Tools

Some tools require external APIs that won't work in a local-only setup. Disable them in your `opencode.json`:

```json
{
  "tools": {
    "websearch": { "enabled": false },
    "browser": { "enabled": false }
  }
}
```

This prevents the model from attempting to call tools that would fail without internet or API access.

---

## Skills Compatibility

### Works Locally (No External APIs)
- **PAI** — Core Algorithm (7-phase ISC cycle)
- **FirstPrinciples** — Fundamental decomposition analysis
- **BeCreative** — Extended thinking and divergent ideation
- **WriteStory** — Creative writing workflows
- **RedTeam** — Adversarial analysis (uses local model reasoning)
- **Council** — Multi-perspective debate (uses local agents)

### Requires External APIs
- **Research** — Needs websearch or external API keys (Perplexity, etc.)
- **OSINT** — Needs web access for intelligence gathering
- **Browser** — Needs Playwright and browser automation
- **ContactEnrichment** — Needs external enrichment APIs
- **BrightData** — Needs BrightData API subscription

### Partially Works
- **Agents** — Work if model routing is configured for local models. May fail if a workflow references a specific external model (e.g., `anthropic/claude-sonnet-4-5`)
- **Fabric** — Pattern library works locally, but some patterns reference web sources

---

## Agent YAML Frontmatter

Since v1.3.0 / v2.0.0, agent `.md` files contain metadata fields (`voiceId`, `color`, `voice` settings) that are **not** sent to the LLM API when using our patched OpenCode build.

If you use a strict local provider that rejects unknown fields, you may need to remove unsupported metadata from agent files or update your OpenCode build.

---

## Auditing for Invalid References

Find skills or workflows that reference external services:

```bash
# Skills referencing external services
grep -r "websearch\|Perplexity\|ClaudeResearch" .opencode/skills/ --include="*.md" -l

# Agent files with hardcoded model references (should be none after v2.0)
grep -r "^model:" .opencode/agents/ --include="*.md" -l

# Workflows referencing external APIs
grep -r "api\.perplexity\|api\.anthropic\|api\.openai" .opencode/ --include="*.ts" -l
```

If any results appear, those files reference services that won't work in a local-only setup. You can:
- **Ignore them** — they only activate if the skill/workflow is explicitly invoked
- **Remove them** — delete the skill directory if you don't need it
- **Modify them** — replace external model references with your local model name

---

## Model Configuration

The `local.yaml` profile configures all agents to use Ollama models. After setup, you can customize models in `opencode.json`:

```json
{
  "model": "ollama/llama3.1:70b",
  "agent": {
    "Algorithm": {
      "model": "ollama/llama3.1:70b"
    },
    "Engineer": {
      "model": "ollama/llama3.1:70b"
    },
    "Intern": {
      "model": "ollama/llama3.1:8b"
    }
  }
}
```

Adjust model names to match what you have pulled in Ollama (`ollama list` to see available models).

---

## Troubleshooting

### "Tool not found" or "websearch" errors
Add `"websearch": { "enabled": false }` to `opencode.json` under `tools`.

### "Sub-agent not found" errors
Ensure you're running the dev build of OpenCode (built via the installer). The stable release may not handle agent metadata correctly.

### Model refuses to respond / API errors
Check that Ollama is running (`ollama serve`) and the model is pulled (`ollama pull llama3.1:70b`).

### Skills reference unavailable services
Run the audit commands above. Remove or modify skills that reference services you don't have.

---

*Added in v2.0.1 — addressing [#15](https://github.com/Steffen025/pai-opencode/issues/15)*
