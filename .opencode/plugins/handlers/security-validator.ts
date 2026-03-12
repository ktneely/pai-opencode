/**
 * PAI-OpenCode Security Validator
 *
 * Validates tool executions for security threats.
 * Equivalent to PAI's security-validator.ts hook.
 *
 * Enhanced in WP-B:
 * - Comprehensive injection pattern detection (7 categories)
 * - Input sanitization before pattern matching
 * - Security audit logging to security-audit.jsonl
 * - Multi-field scanning (not just args.content)
 * - Fire-and-forget audit logging (non-blocking)
 * - Secrets redaction in audit logs
 *
 * @module security-validator
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type { PermissionInput, SecurityResult, ToolInput } from "../adapters/types";
import { DANGEROUS_PATTERNS, WARNING_PATTERNS } from "../adapters/types";
import { fileLog, fileLogError } from "../lib/file-logger";
import { detectInjections, type InjectionCategory } from "../lib/injection-patterns";
import { getStateDir } from "../lib/paths";
import { INJECTION_SCAN_FIELDS, sanitizeForSecurityCheck } from "../lib/sanitizer";

/**
 * Security audit log entry
 */
interface SecurityAuditEntry {
	timestamp: string;
	tool: string;
	action: "blocked" | "confirmed" | "allowed";
	reason: string;
	pattern?: string;
	category?: InjectionCategory;
	commandPreview?: string; // First 100 chars, sanitized
}

/**
 * Append to security audit log (non-blocking, fire-and-forget)
 *
 * @param entry - The audit entry to log
 */
function logSecurityEvent(entry: SecurityAuditEntry): void {
	// Fire-and-forget: don't await, don't block the decision path
	Promise.resolve()
		.then(async () => {
			const stateDir = getStateDir();
			const auditPath = path.join(stateDir, "security-audit.jsonl");

			// Ensure directory exists
			await fs.promises.mkdir(stateDir, { recursive: true });

			const line = `${JSON.stringify(entry)}\n`;
			await fs.promises.appendFile(auditPath, line, "utf-8");
		})
		.catch(() => {
			// Silent fail - audit logging should never block execution
			fileLog("Failed to write security audit entry", "warn");
		});
}

/**
 * Redact sensitive values from command text
 * Masks API keys, tokens, and credentials
 *
 * @param command - The command to redact
 * @returns Redacted command
 */
function redactSecrets(command: string): string {
	// API Keys and tokens
	const redacted = command
		// Anthropic API keys
		.replace(/sk-ant-[A-Za-z0-9\-_]{20,}/g, "sk-ant-[REDACTED]")
		// OpenAI API keys
		.replace(/sk-[a-zA-Z0-9]{32,}/g, "sk-[REDACTED]")
		// GitHub PATs
		.replace(/gh[pousr]_[a-zA-Z0-9]{36,}/g, "gh[REDACTED]")
		// AWS Access Keys
		.replace(/\b(AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}\b/g, "$1[REDACTED]")
		// Groq API keys
		.replace(/gsk_[a-zA-Z0-9]{52}/g, "gsk-[REDACTED]")
		// HuggingFace tokens
		.replace(/hf_[a-zA-Z0-9]{34,}/g, "hf-[REDACTED]")
		// PEM private keys (redact content between headers)
		.replace(
			/(-----BEGIN\s+(?:[A-Z0-9]+\s+)?PRIVATE\s+KEY-----)[\s\S]*?(-----END\s+(?:[A-Z0-9]+\s+)?PRIVATE\s+KEY-----)/g,
			"$1\n[REDACTED]\n$2"
		)
		// Generic high-entropy tokens ( heuristic: 40+ alphanumeric chars)
		.replace(/\b[a-zA-Z0-9_-]{40,}\b/g, "[REDACTED]");

	return redacted;
}

/**
 * Check if a command matches any dangerous pattern
 *
 * @param command - The command to check
 * @returns The matching pattern or null
 */
function matchesDangerousPattern(command: string): RegExp | null {
	for (const pattern of DANGEROUS_PATTERNS) {
		if (pattern.test(command)) {
			return pattern;
		}
	}
	return null;
}

/**
 * Check if a command matches any warning pattern
 *
 * @param command - The command to check
 * @returns The matching pattern or null
 */
function matchesWarningPattern(command: string): RegExp | null {
	for (const pattern of WARNING_PATTERNS) {
		if (pattern.test(command)) {
			return pattern;
		}
	}
	return null;
}

/**
 * Extract command from tool input
 *
 * @param input - The tool or permission input
 * @returns The extracted command or null
 */
function extractCommand(input: PermissionInput | ToolInput): string | null {
	// Normalize tool name to lowercase for comparison
	const toolName = input.tool.toLowerCase();

	// Bash tool (handles both "bash" and "Bash")
	if (toolName === "bash" && typeof input.args?.command === "string") {
		let command = input.args.command;

		// Strip env var assignment prefixes to avoid false positives (upstream #620)
		// e.g., "export AWS_SECRET=xyz" → "AWS_SECRET=xyz" so patterns match the value, not the keyword
		command = command.replace(/^(export|set|declare|readonly)\s+/gm, "");

		return command;
	}

	// Write tool - check for sensitive paths
	if (toolName === "write" && typeof input.args?.file_path === "string") {
		return `write:${input.args.file_path}`;
	}

	return null;
}

/**
 * Check all text fields in args for prompt injection patterns
 *
 * Scans all fields listed in INJECTION_SCAN_FIELDS, not just args.content.
 * Sanitizes input before pattern matching to catch obfuscated attacks.
 *
 * @param args - The tool arguments to check
 * @returns Match info if injection detected, null otherwise
 */
function checkAllFieldsForInjection(args: Record<string, unknown>): {
	field: string;
	matches: ReturnType<typeof detectInjections>;
} | null {
	for (const field of INJECTION_SCAN_FIELDS) {
		const value = args[field];
		if (typeof value !== "string") continue;

		// Sanitize before pattern matching (catches obfuscated attacks)
		const sanitized = sanitizeForSecurityCheck(value);

		// Check original and sanitized versions
		const matches = detectInjections(value);
		const sanitizedMatches = sanitized !== value ? detectInjections(sanitized) : [];

		const allMatches = [...matches, ...sanitizedMatches];
		if (allMatches.length > 0) {
			return { field, matches: allMatches };
		}
	}
	return null;
}

/**
 * Validate security for a tool execution
 *
 * @param input - The tool or permission input to validate
 * @returns SecurityResult indicating what action to take
 */
export async function validateSecurity(
	input: PermissionInput | ToolInput
): Promise<SecurityResult> {
	try {
		fileLog(`Security check for tool: ${input.tool}`);
		fileLog(`Args: ${JSON.stringify(input.args ?? {}).substring(0, 300)}`, "debug");

		const command = extractCommand(input);

		// Check for prompt injection in ALL text fields FIRST (even if no command)
		const injectionResult = input.args ? checkAllFieldsForInjection(input.args) : null;

		if (injectionResult) {
			const firstMatch = injectionResult.matches[0];
			fileLog(`BLOCKED: Prompt injection detected in field '${injectionResult.field}'`, "error");
			fileLog(`Category: ${firstMatch.category}, Pattern: ${firstMatch.pattern}`, "error");
			logSecurityEvent({
				timestamp: new Date().toISOString(),
				tool: input.tool,
				action: "blocked",
				reason: `Prompt injection in ${injectionResult.field}`,
				category: firstMatch.category,
				pattern: firstMatch.pattern.toString(),
				commandPreview: command
					? redactSecrets(command).slice(0, 100)
					: `${injectionResult.field}:${input.args?.[injectionResult.field]}`.slice(0, 100),
			});
			return {
				action: "block",
				reason: `Potential prompt injection detected in field '${injectionResult.field}'`,
				message: "Content appears to contain prompt injection patterns and has been blocked.",
			};
		}

		if (!command) {
			fileLog(`No command extracted from input`, "warn");
			// No command to validate - allow by default (injection check already passed)
			logSecurityEvent({
				timestamp: new Date().toISOString(),
				tool: input.tool,
				action: "allowed",
				reason: "No command extracted",
			});
			return {
				action: "allow",
				reason: "No command to validate",
			};
		}

		fileLog(`Extracted command: ${command}`, "info");

		// Check for dangerous patterns (BLOCK)
		const dangerousMatch = matchesDangerousPattern(command);
		if (dangerousMatch) {
			fileLog(`BLOCKED: Dangerous pattern matched: ${dangerousMatch}`, "error");
			logSecurityEvent({
				timestamp: new Date().toISOString(),
				tool: input.tool,
				action: "blocked",
				reason: `Dangerous pattern: ${dangerousMatch}`,
				pattern: dangerousMatch.toString(),
				commandPreview: redactSecrets(command).slice(0, 100),
			});
			return {
				action: "block",
				reason: `Dangerous command pattern detected: ${dangerousMatch}`,
				message:
					"This command has been blocked for security reasons. It matches a known dangerous pattern.",
			};
		}

		// Check for warning patterns (CONFIRM)
		const warningMatch = matchesWarningPattern(command);
		if (warningMatch) {
			fileLog(`CONFIRM: Warning pattern matched: ${warningMatch}`, "warn");
			logSecurityEvent({
				timestamp: new Date().toISOString(),
				tool: input.tool,
				action: "confirmed",
				reason: `Warning pattern: ${warningMatch}`,
				pattern: warningMatch.toString(),
				commandPreview: redactSecrets(command).slice(0, 100),
			});
			return {
				action: "confirm",
				reason: `Potentially dangerous command: ${warningMatch}`,
				message: "This command may have unintended consequences. Please confirm.",
			};
		}

		// Check for sensitive file writes
		if (input.tool.toLowerCase() === "write") {
			const filePath = input.args?.file_path as string;
			const sensitivePaths = [
				/\/etc\//,
				/\/var\/log\//,
				/\.ssh\//,
				/\.aws\//,
				/\.env$/,
				/credentials/i,
				/secret/i,
			];

			for (const pattern of sensitivePaths) {
				if (pattern.test(filePath)) {
					fileLog(`CONFIRM: Sensitive file write: ${filePath}`, "warn");
					logSecurityEvent({
						timestamp: new Date().toISOString(),
						tool: input.tool,
						action: "confirmed",
						reason: `Sensitive file write: ${filePath}`,
						pattern: pattern.toString(),
						commandPreview: `write:${filePath}`.slice(0, 100),
					});
					return {
						action: "confirm",
						reason: `Writing to sensitive path: ${filePath}`,
						message: "Writing to a potentially sensitive location. Please confirm.",
					};
				}
			}
		}

		// All checks passed - allow
		fileLog("Security check passed", "debug");
		logSecurityEvent({
			timestamp: new Date().toISOString(),
			tool: input.tool,
			action: "allowed",
			reason: "All security checks passed",
			commandPreview: redactSecrets(command).slice(0, 100),
		});
		return {
			action: "allow",
			reason: "All security checks passed",
		};
	} catch (error) {
		fileLogError("Security validation error", error);
		// Fail-open: on error, allow the operation
		// This is a design decision - fail-closed would be safer but more disruptive
		logSecurityEvent({
			timestamp: new Date().toISOString(),
			tool: input.tool,
			action: "allowed",
			reason: "Security check error - fail-open",
		});
		return {
			action: "allow",
			reason: "Security check error - allowing by default",
		};
	}
}
