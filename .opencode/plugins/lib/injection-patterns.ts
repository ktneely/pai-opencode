/**
 * PAI-OpenCode Injection Pattern Detection
 *
 * Comprehensive prompt injection pattern library.
 * Categorized by attack vector for maintainability.
 *
 * @module injection-patterns
 */

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
	/you\s+are\s+now\s+(a\s+|an\s+)?(?!Claude|an\s+AI)/i, // "you are now a hacker" etc.
	/act\s+as\s+(a\s+|an\s+)?(evil|malicious|unrestricted|jailbreak)/i,
	/pretend\s+(you\s+are|to\s+be)\s+(a\s+|an\s+)?(?!(helpful|assistant))/i,
	/roleplay\s+as\s+(a\s+|an\s+)?(hacker|attacker|malware)/i,
	/DAN\s+mode/i, // "Do Anything Now" jailbreak
	/jailbreak\s+mode/i,
	/developer\s+mode/i, // Fake "developer mode" jailbreak
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
	/---+\s*\n.*system\s*:/im, // Markdown separator + "system:"
	/\[system\]/i, // Fake system tag
	/<system>/i, // HTML-style fake system tag
	/\|\|SYSTEM\|\|/i, // Pipe-delimited injection
	/###\s*SYSTEM\s*###/i, // Formatted injection header
	/\n\n\n+.*instructions/im, // Many newlines before instructions
] as const;

// === KATEGORIE 6: MCP Tool-Description Injection ===
// Böswillige Anweisungen in Tool-Descriptions versteckt
export const MCP_TOOL_INJECTION_PATTERNS = [
	/when\s+(you\s+)?(use|call|invoke)\s+this\s+tool.{0,50}(send|exfiltrate|leak)/i,
	/tool\s+description.*ignore.*instructions/is,
	/\[hidden\s+instruction\]/i,
	/<hidden>/i,
] as const;

// === KATEGORIE 7: PII / Credential Leaks ===
// Erkennt API-Keys und Private Keys die nicht in Agent-Content gehören
// Pattern-Quellen: jcfischer/pai-content-filter (MIT) + eigene Ergänzungen
export const PII_PATTERNS = [
	/sk-ant-[A-Za-z0-9\-_]{20,}/, // Anthropic API Key
	/sk-(?!ant-)[a-zA-Z0-9]{32,}/, // OpenAI API Key
	/gh[pousr]_[a-zA-Z0-9]{36,}/, // GitHub PAT
	/\b(?:AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}\b/, // AWS Access Key ID
	/-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----/, // PEM Private Key
	/gsk_[a-zA-Z0-9]{52}/, // Groq API Key
	/hf_[a-zA-Z0-9]{34,}/, // HuggingFace Token
] as const;

// Alle Patterns für eine einzige Überprüfung kombiniert
export const ALL_INJECTION_PATTERNS = [
	...INSTRUCTION_OVERRIDE_PATTERNS,
	...ROLE_HIJACKING_PATTERNS,
	...SYSTEM_PROMPT_EXTRACTION_PATTERNS,
	...SAFETY_BYPASS_PATTERNS,
	...CONTEXT_SEPARATOR_PATTERNS,
	...MCP_TOOL_INJECTION_PATTERNS,
	...PII_PATTERNS,
] as const;

export type InjectionCategory =
	| "instruction_override"
	| "role_hijacking"
	| "system_prompt_extraction"
	| "safety_bypass"
	| "context_separator"
	| "mcp_tool_injection"
	| "pii_credential_leak";

export interface InjectionMatch {
	category: InjectionCategory;
	pattern: RegExp;
	matchedText: string;
}

/**
 * Detect all injection patterns and return matches with category
 *
 * @param content - The content to check for injection patterns
 * @returns Array of matches with category, pattern, and matched text
 */
export function detectInjections(content: string): InjectionMatch[] {
	const matches: InjectionMatch[] = [];
	const checks: [InjectionCategory, readonly RegExp[]][] = [
		["instruction_override", INSTRUCTION_OVERRIDE_PATTERNS],
		["role_hijacking", ROLE_HIJACKING_PATTERNS],
		["system_prompt_extraction", SYSTEM_PROMPT_EXTRACTION_PATTERNS],
		["safety_bypass", SAFETY_BYPASS_PATTERNS],
		["context_separator", CONTEXT_SEPARATOR_PATTERNS],
		["mcp_tool_injection", MCP_TOOL_INJECTION_PATTERNS],
		["pii_credential_leak", PII_PATTERNS],
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
