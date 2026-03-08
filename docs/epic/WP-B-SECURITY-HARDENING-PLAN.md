---
title: WP-B — Security Hardening Plan
status: active
branch: feature/wp-b-security-hardening
depends-on: WP-A (PR #42, merged)
target-pr: PR #B
date: 2026-03-06
effort: 0.5–1 Tag
---

# WP-B: Security Hardening Plan

> [!note]
> **Abhängigkeit:** WP-A (PR #42) wurde erfolgreich gemerged.
> WP-B baut direkt auf `security-validator.ts` und `adapters/types.ts` auf.

---

## Analyse: Was bereits existiert

```
security-validator.ts (196 Zeilen) — VORHANDEN ✅
├── DANGEROUS_PATTERNS (15 Patterns in types.ts)
│   ├── Destructive: rm -rf /, mkfs, dd
│   ├── Reverse Shells: bash -i >&, nc -e /bin/sh
│   ├── RCE: curl|sh, wget|sh
│   └── Credential Theft: cat .ssh/id_, cat .env
├── WARNING_PATTERNS (6 Patterns in types.ts)
│   ├── Git: push --force, reset --hard
│   ├── Package: npm install -g, pip install
│   └── Docker: rm, rmi
├── checkPromptInjection() — 5 Patterns (inline, nicht exportiert)
│   ├── "ignore all previous instructions"
│   ├── "you are now"
│   ├── "system: you are"
│   ├── "override security"
│   └── "disable safety"
└── Sensitive path detection für Write tool
```

```
LÜCKEN — WP-B schließt diese:
❌ Prompt Injection: nur 5 Basis-Patterns, inline, nicht getestet
❌ Kein lib/injection-patterns.ts (Patterns extern pflegbar)
❌ Kein lib/sanitizer.ts (Input-Normalisierung vor Pattern-Match)
❌ Fehlende moderne Angriffsvektoren in DANGEROUS_PATTERNS
❌ Security Audit Log fehlt (wer geblockt, wann, warum)
❌ Prompt Injection prüft nur args.content — nicht args.text, args.prompt
❌ Kein Rate-Limiting bei wiederholten Block-Versuchen
❌ MCP Tool Description Injection nicht geprüft
```

---

## Scope: 3 Themenblöcke

```
BLOCK 1 — lib/injection-patterns.ts (NEU)
├── Alle Prompt-Injection-Patterns zentralisiert
├── Kategorisiert, kommentiert, testbar
└── Importiert von security-validator.ts

BLOCK 2 — lib/sanitizer.ts (NEU)
├── Input-Normalisierung vor Pattern-Matching
├── Erkennt obfuskierte Payloads
└── Erweiterung für MCP Tool-Description Checks

BLOCK 3 — Erweiterungen an bestehenden Dateien
├── adapters/types.ts: DANGEROUS_PATTERNS erweitern
├── security-validator.ts: Überarbeitung + Audit Log
└── docs/architecture/adr/ADR-011-security-hardening.md (NEU)
```

---

## Block 1: `lib/injection-patterns.ts` (NEU)

**Zweck:** Alle Prompt-Injection-Muster zentral, pflegbar, kategorisiert.

```typescript
// .opencode/plugins/lib/injection-patterns.ts

// === KATEGORIE 1: Direkte Instruktions-Übernahme ===
// Versuche, dem Modell neue Anweisungen zu geben die vorherige überschreiben
export const INSTRUCTION_OVERRIDE_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /disregard\s+(all\s+)?(previous|prior|above)\s+instructions/i,
  /forget\s+(all\s+)?(previous|prior)\s+instructions/i,
  /new\s+instructions?\s*:/i,
  /override\s+(your\s+)?(previous|prior|current)\s+instructions/i,
  /from\s+now\s+on\s+you\s+(will|must|should)/i,
  /your\s+new\s+(task|goal|objective|purpose)\s+is/i,
] as const;

// === KATEGORIE 2: Rollen-Übernahme ===
// Versuche, dem Modell eine neue Identität zu geben
export const ROLE_HIJACKING_PATTERNS = [
  /you\s+are\s+now\s+(a\s+|an\s+)?(?!Claude|an\s+AI)/i,  // "you are now a hacker" etc.
  /act\s+as\s+(a\s+|an\s+)?(evil|malicious|unrestricted|jailbreak)/i,
  /pretend\s+(you\s+are|to\s+be)\s+(a\s+|an\s+)?(?!(helpful|assistant))/i,
  /roleplay\s+as\s+(a\s+|an\s+)?(hacker|attacker|malware)/i,
  /DAN\s+mode/i,          // "Do Anything Now" jailbreak
  /jailbreak\s+mode/i,
  /developer\s+mode/i,    // Fake "developer mode" jailbreak
  /god\s+mode/i,
] as const;

// === KATEGORIE 3: System-Prompt-Extraktion ===
// Versuche, den System-Prompt auszulesen
export const SYSTEM_PROMPT_EXTRACTION_PATTERNS = [
  /reveal\s+your\s+(system\s+prompt|instructions|configuration)/i,
  /print\s+your\s+(system\s+prompt|initial\s+instructions)/i,
  /what\s+(are|were)\s+your\s+(exact\s+)?(system\s+)?instructions/i,
  /show\s+me\s+your\s+(raw\s+)?(system\s+prompt|full\s+prompt)/i,
  /repeat\s+(everything\s+)?(above|before|prior)/i,
  /output\s+the\s+(contents\s+of\s+)?your\s+(context|system\s+prompt)/i,
] as const;

// === KATEGORIE 4: Sicherheitsmechanismus-Umgehung ===
// Versuche, Safety-Filter zu deaktivieren
export const SAFETY_BYPASS_PATTERNS = [
  /disable\s+(your\s+)?(safety|security|filter|restriction)/i,
  /override\s+(security|safety)\s+(measure|check|filter)/i,
  /bypass\s+(the\s+)?(filter|restriction|security|safety)/i,
  /without\s+(any\s+)?(restriction|filter|safety|limit)/i,
  /no\s+(ethical|moral|safety)\s+(constraint|restriction|filter)/i,
] as const;

// === KATEGORIE 5: Kontexttrenner-Injektion ===
// Versuche durch Kontexttrenner neuen System-Kontext einzuschleusen
export const CONTEXT_SEPARATOR_PATTERNS = [
  /---+\s*\n.*system\s*:/im,        // Markdown separator + "system:"
  /\[system\]/i,                    // Fake system tag
  /<system>/i,                      // HTML-style fake system tag
  /\|\|SYSTEM\|\|/i,                // Pipe-delimited injection
  /###\s*SYSTEM\s*###/i,            // Formatted injection header
  /\n\n\n+.*instructions/im,        // Many newlines before instructions
] as const;

// === KATEGORIE 6: MCP Tool-Description Injection ===
// Böswillige Anweisungen in Tool-Descriptions versteckt
export const MCP_TOOL_INJECTION_PATTERNS = [
  /when\s+(you\s+)?(use|call|invoke)\s+this\s+tool.{0,50}(send|exfiltrate|leak)/i,
  /tool\s+description.*ignore.*instructions/is,
  /\[hidden\s+instruction\]/i,
  /<hidden>/i,
] as const;

// Alle Patterns für eine einzige Überprüfung kombiniert
export const ALL_INJECTION_PATTERNS = [
  ...INSTRUCTION_OVERRIDE_PATTERNS,
  ...ROLE_HIJACKING_PATTERNS,
  ...SYSTEM_PROMPT_EXTRACTION_PATTERNS,
  ...SAFETY_BYPASS_PATTERNS,
  ...CONTEXT_SEPARATOR_PATTERNS,
  ...MCP_TOOL_INJECTION_PATTERNS,
] as const;

export type InjectionCategory =
  | "instruction_override"
  | "role_hijacking"
  | "system_prompt_extraction"
  | "safety_bypass"
  | "context_separator"
  | "mcp_tool_injection";

export interface InjectionMatch {
  category: InjectionCategory;
  pattern: RegExp;
  matchedText: string;
}

/** Detect all injection patterns and return matches with category */
export function detectInjections(content: string): InjectionMatch[] {
  const matches: InjectionMatch[] = [];
  const checks: [InjectionCategory, readonly RegExp[]][] = [
    ["instruction_override", INSTRUCTION_OVERRIDE_PATTERNS],
    ["role_hijacking", ROLE_HIJACKING_PATTERNS],
    ["system_prompt_extraction", SYSTEM_PROMPT_EXTRACTION_PATTERNS],
    ["safety_bypass", SAFETY_BYPASS_PATTERNS],
    ["context_separator", CONTEXT_SEPARATOR_PATTERNS],
    ["mcp_tool_injection", MCP_TOOL_INJECTION_PATTERNS],
  ];
  for (const [category, patterns] of checks) {
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        matches.push({ category, pattern, matchedText: match[0] });
        break; // One match per category is enough
      }
    }
  }
  return matches;
}
```

---

## Block 2: `lib/sanitizer.ts` (NEU)

**Zweck:** Input-Normalisierung BEVOR Pattern-Matching läuft — verhindert Obfuskierung.

```typescript
// .opencode/plugins/lib/sanitizer.ts

/**
 * Decode base64-encoded strings within content
 * Attackers often use: eval $(echo "aWdub3JlIHByZXZpb3VzIGluc3RydWN0aW9ucw==" | base64 -d)
 */
export function decodeBase64Payloads(content: string): string {
  return content.replace(/[A-Za-z0-9+/]{20,}={0,2}/g, (match) => {
    try {
      const decoded = atob(match);
      // Only replace if decoded result is printable ASCII (avoid binary noise)
      if (/^[\x20-\x7E\n\r\t]+$/.test(decoded)) return `${match}[decoded:${decoded}]`;
    } catch { /* Not valid base64 */ }
    return match;
  });
}

/**
 * Normalize Unicode lookalikes to ASCII
 * "іgnore" (Cyrillic і) → "ignore" to prevent Unicode bypass
 */
export function normalizeUnicode(content: string): string {
  return content.normalize("NFKD").replace(/[^\x00-\x7F]/g, (char) => {
    // Map common Cyrillic/Greek lookalikes to ASCII
    const lookalikes: Record<string, string> = {
      "а": "a", "е": "e", "і": "i", "о": "o", "р": "p", "с": "c",
      "ѕ": "s", "у": "y", "х": "x", "А": "A", "В": "B", "Е": "E",
    };
    return lookalikes[char] ?? char;
  });
}

/**
 * Collapse excessive whitespace to detect patterns split by spaces
 * "i g n o r e   a l l   p r e v i o u s" → "ignore all previous"
 */
export function collapseObfuscatedSpacing(content: string): string {
  // Detect letter-space-letter pattern (obfuscated words)
  if (/^(\w\s){4,}/.test(content.trim())) {
    return content.replace(/(\w)\s(?=\w)/g, "$1");
  }
  return content;
}

/**
 * Strip HTML/XML tags that might wrap injection attempts
 * "<system>ignore instructions</system>" → "ignore instructions"
 */
export function stripHtmlTags(content: string): string {
  return content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Full sanitization pipeline — all transforms in order
 */
export function sanitizeForSecurityCheck(content: string): string {
  let sanitized = content;
  sanitized = decodeBase64Payloads(sanitized);
  sanitized = normalizeUnicode(sanitized);
  sanitized = collapseObfuscatedSpacing(sanitized);
  sanitized = stripHtmlTags(sanitized);
  return sanitized;
}

/**
 * Fields to check for injection in tool args
 * Extends beyond just args.content to cover all text inputs
 */
export const INJECTION_SCAN_FIELDS = [
  "content",
  "text",
  "prompt",
  "message",
  "query",
  "description",
  "instruction",
  "input",
  "command",   // Bash commands can contain injections too
] as const;
```

---

## Block 3: Erweiterungen bestehender Dateien

### 3a: `adapters/types.ts` — DANGEROUS_PATTERNS erweitern

**Fehlende moderne Angriffsvektoren hinzufügen:**

```typescript
// Zu DANGEROUS_PATTERNS hinzufügen:

// Obfuskierte RCE
/eval\s*\$\(\s*(echo|printf|cat)\s+.*\|\s*base64\s+-d/,  // base64 decode + exec
/\$\(curl\s+.*\)\s*\|\s*(ba)?sh/,                         // command substitution + pipe

// Environment variable exfiltration
/printenv\s*.*\|\s*(curl|wget|nc)/,                       // env dump + exfiltration
/env\s*\|?\s*grep\s+.*KEY.*\|\s*(curl|wget)/,             // API key theft via grep

// Python/Node RCE one-liners  
/python[23]?\s+-c\s+["'].*__import__.*os.*system/,       // python -c "import os; os.system()"
/node\s+-e\s+["'].*require.*child_process/,               // node -e "require('child_process')"

// SSH key theft / identity compromise
/cat\s+~\/\.ssh\/known_hosts/,
/ssh-keyscan/,
```

### 3b: `security-validator.ts` — Audit Log + erweiterte Injection-Checks

**Key changes:**
1. `checkPromptInjection()` → importiert `detectInjections()` aus `lib/injection-patterns.ts`
2. Input durch `sanitizeForSecurityCheck()` aus `lib/sanitizer.ts` laufen lassen
3. Alle Text-Felder scannen (nicht nur `args.content`), via `INJECTION_SCAN_FIELDS`
4. **Security Audit Log** in `MEMORY/STATE/security-audit.jsonl`

```typescript
// Security Audit Log entry
interface SecurityAuditEntry {
  timestamp: string;
  tool: string;
  action: "blocked" | "confirmed" | "allowed";
  reason: string;
  pattern?: string;
  category?: InjectionCategory;
  commandPreview?: string;  // First 100 chars, sanitized
}

// Append to security audit log (non-blocking)
async function logSecurityEvent(entry: SecurityAuditEntry): Promise<void> {
  const auditPath = path.join(getStateDir(), "security-audit.jsonl");
  const line = JSON.stringify(entry) + "\n";
  await fs.promises.appendFile(auditPath, line, "utf-8").catch(() => {});
}
```

---

## Block 4: `ADR-011-security-hardening.md` (NEU)

Dokumentiert:
- Warum Prompt Injection Patterns extern in lib/ statt inline
- Sanitizer Pipeline — warum Normalisierung vor Pattern-Match
- Security Audit Log — Zweck, Format, Retention
- Fail-Open vs Fail-Closed Entscheidung (dokumentiert in ADR-001 Basis, hier erweitert)
- MCP Tool Description Injection als neues Threat-Model

---

## Vollständige File-Übersicht

```
NEUE DATEIEN:
├── .opencode/plugins/lib/injection-patterns.ts    (~120 Zeilen)
│   ├── 6 Kategorien, ~30 Patterns
│   ├── detectInjections() mit Match-Kategorie
│   └── Alle exportiert für externe Tests
│
├── .opencode/plugins/lib/sanitizer.ts             (~80 Zeilen)
│   ├── decodeBase64Payloads()
│   ├── normalizeUnicode()
│   ├── collapseObfuscatedSpacing()
│   ├── stripHtmlTags()
│   ├── sanitizeForSecurityCheck() (Pipeline)
│   └── INJECTION_SCAN_FIELDS constant
│
└── docs/architecture/adr/ADR-011-security-hardening.md

GEÄNDERTE DATEIEN:
├── .opencode/plugins/handlers/security-validator.ts
│   ├── Import detectInjections() statt inline patterns
│   ├── Import sanitizeForSecurityCheck() + INJECTION_SCAN_FIELDS
│   ├── Alle Text-Felder scannen (nicht nur args.content)
│   ├── Security Audit Log (MEMORY/STATE/security-audit.jsonl)
│   └── logSecurityEvent() helper
│
└── .opencode/plugins/adapters/types.ts
    └── DANGEROUS_PATTERNS: +6 neue Angriffsvektoren
```

---

## Aufwandsschätzung

| Task | Aufwand |
|------|---------|
| `lib/injection-patterns.ts` erstellen | ~45 min |
| `lib/sanitizer.ts` erstellen | ~30 min |
| `security-validator.ts` refactorn | ~45 min |
| `adapters/types.ts` erweitern | ~15 min |
| `ADR-011` schreiben | ~20 min |
| Biome + Tests | ~15 min |
| **Gesamt** | **~2.5h** |

---

## Was WP-B NICHT tut (explizit außerhalb Scope)

| Feature | Warum nicht in WP-B |
|---------|---------------------|
| Rate Limiting | Braucht persistenten State zwischen Calls — komplexer, WP-C |
| MCP Tool Validation vor Load | Braucht OpenCode Plugin-Hook der noch nicht existiert |
| Security Dashboard | Teil des Observability-Systems — WP-C |
| Full SAST scanning | Zu weit über PAI-Scope hinaus |

---

## Verifikationskriterien (ISC Preview)

- [ ] `detectInjections("ignore all previous instructions")` gibt `{ category: "instruction_override" }` zurück
- [ ] `sanitizeForSecurityCheck('eval $(echo "aWdub3Jl" | base64 -d)')` enthält dekodierten String
- [ ] `validateSecurity({ tool: "Write", args: { content: "ignore all previous instructions" }})` gibt `action: "block"` zurück
- [ ] Alle 6 Injection-Kategorien haben mindestens 2 Patterns
- [ ] `security-audit.jsonl` enthält Entry nach jedem Block
- [ ] `biome check` ohne Errors
- [ ] Keine `console.log` in neuen Dateien

---

## Nächste Schritte

Wenn du bereit bist mit der Implementierung:
```
"Jeremy, starte WP-B Implementierung"
```

Branch ist bereits erstellt: `feature/wp-b-security-hardening`

---

*Plan erstellt: 2026-03-06*  
*Branch: feature/wp-b-security-hardening (von dev)*  
*Estimierter PR: PR #B*
