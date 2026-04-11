#!/usr/bin/env bun
/**
 * Legacy Config Migration — PAI-OpenCode v3.0 Vanilla Migration (WP-M1)
 *
 * Converts legacy `opencode.json` files that contain `model_tiers` blocks
 * into the new flat format where each agent has exactly one `model` field.
 *
 * Policy:
 *   - For each agent block that has `model_tiers`, preserve the `standard`
 *     tier model as the new canonical `model` field.
 *   - If no `standard` tier exists, fall back to the top-level `model` field
 *     that was already present.
 *   - If neither exists, fall back to `quick`, then `advanced`, then skip.
 *   - The original `opencode.json` is backed up to `opencode.json.pre-v3.0.bak`
 *     before any changes are written.
 *
 * Usage:
 *   bun run PAI-Install/engine/migrate-legacy-config.ts [path/to/opencode.json]
 *
 * Default path: ~/.opencode/opencode.json
 *
 * See: ADR-019-vanilla-opencode-migration.md, CHANGELOG entry for [3.0.0]
 */

import { existsSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

// ─── Types ─────────────────────────────────────────────────

interface LegacyTierBlock {
	quick?: { model?: string } | string;
	standard?: { model?: string } | string;
	advanced?: { model?: string } | string;
}

interface LegacyAgentConfig {
	model?: string;
	model_tiers?: LegacyTierBlock;
	[key: string]: unknown;
}

interface OpencodeJson {
	$schema?: string;
	model?: string;
	agent?: Record<string, LegacyAgentConfig>;
	[key: string]: unknown;
}

interface MigrationResult {
	success: boolean;
	path: string;
	backupPath: string;
	agentsProcessed: number;
	agentsMigrated: number;
	agentsSkipped: string[];
	changes: Array<{
		agent: string;
		before: string | undefined;
		after: string;
		source: "standard" | "top-level" | "quick" | "advanced";
	}>;
	error?: string;
}

// ─── Tier Resolution ───────────────────────────────────────

/**
 * Extract a model string from a tier entry, which may be either a string
 * (legacy shorthand) or an object `{ model: "..." }`.
 */
function resolveTierModel(tier: LegacyTierBlock[keyof LegacyTierBlock]): string | undefined {
	if (!tier) return undefined;
	if (typeof tier === "string") return tier;
	if (typeof tier === "object" && typeof tier.model === "string") return tier.model;
	return undefined;
}

/**
 * Pick the best canonical model for an agent that has `model_tiers`.
 * Priority: standard > top-level model > quick > advanced.
 */
function pickCanonicalModel(
	agent: LegacyAgentConfig
): { model: string; source: "standard" | "top-level" | "quick" | "advanced" } | null {
	const tiers = agent.model_tiers;

	if (tiers) {
		const standardModel = resolveTierModel(tiers.standard);
		if (standardModel) return { model: standardModel, source: "standard" };
	}

	if (typeof agent.model === "string" && agent.model.length > 0) {
		return { model: agent.model, source: "top-level" };
	}

	if (tiers) {
		const quickModel = resolveTierModel(tiers.quick);
		if (quickModel) return { model: quickModel, source: "quick" };

		const advancedModel = resolveTierModel(tiers.advanced);
		if (advancedModel) return { model: advancedModel, source: "advanced" };
	}

	return null;
}

// ─── Main Migration ────────────────────────────────────────

/**
 * Find a backup path that does not yet exist. If the default
 * `<config>.pre-v3.0.bak` is free, use it. Otherwise append an
 * incrementing suffix (`.bak.1`, `.bak.2`, ...) so repeated runs never
 * overwrite an earlier backup.
 */
function resolveUniqueBackupPath(configPath: string): string {
	const base = `${configPath}.pre-v3.0.bak`;
	if (!existsSync(base)) return base;

	for (let i = 1; i < 1000; i++) {
		const candidate = `${base}.${i}`;
		if (!existsSync(candidate)) return candidate;
	}

	// Extremely unlikely: fall back to a timestamp so we still produce a
	// unique filename instead of overwriting something.
	return `${base}.${Date.now()}`;
}

export function migrateLegacyConfig(configPath: string): MigrationResult {
	const result: MigrationResult = {
		success: false,
		path: configPath,
		backupPath: `${configPath}.pre-v3.0.bak`,
		agentsProcessed: 0,
		agentsMigrated: 0,
		agentsSkipped: [],
		changes: [],
	};

	if (!existsSync(configPath)) {
		result.error = `Config file not found: ${configPath}`;
		return result;
	}

	let parsed: OpencodeJson;
	try {
		const raw = readFileSync(configPath, "utf-8");
		parsed = JSON.parse(raw);
	} catch (err) {
		result.error = `Failed to parse ${configPath}: ${err instanceof Error ? err.message : String(err)}`;
		return result;
	}

	if (!parsed.agent || typeof parsed.agent !== "object") {
		result.error = "Config has no `agent` block — nothing to migrate.";
		return result;
	}

	// Create backup before any mutation. Never overwrite an existing backup —
	// a prior run's backup must be preserved as the "original" recovery point.
	result.backupPath = resolveUniqueBackupPath(configPath);
	try {
		copyFileSync(configPath, result.backupPath);
	} catch (err) {
		result.error = `Failed to create backup at ${result.backupPath}: ${err instanceof Error ? err.message : String(err)}`;
		return result;
	}

	// Process each agent
	for (const [agentName, agentConfig] of Object.entries(parsed.agent)) {
		result.agentsProcessed++;

		// Skip agents that already have no model_tiers — they're already flat
		if (!agentConfig.model_tiers) {
			continue;
		}

		const canonical = pickCanonicalModel(agentConfig);

		if (!canonical) {
			result.agentsSkipped.push(
				`${agentName} (no usable model found in model_tiers or top-level model field)`
			);
			continue;
		}

		result.changes.push({
			agent: agentName,
			before: agentConfig.model,
			after: canonical.model,
			source: canonical.source,
		});

		// Rewrite the agent entry: keep `model` as the canonical model, drop `model_tiers`.
		// Preserve any other fields the agent may have (permission, prompt, etc.).
		const { model_tiers: _drop, ...rest } = agentConfig;
		parsed.agent[agentName] = {
			...rest,
			model: canonical.model,
		};

		result.agentsMigrated++;
	}

	// Write migrated config
	try {
		writeFileSync(configPath, `${JSON.stringify(parsed, null, 2)}\n`, "utf-8");
	} catch (err) {
		result.error = `Failed to write migrated config: ${err instanceof Error ? err.message : String(err)}`;
		return result;
	}

	result.success = true;
	return result;
}

// ─── CLI Entry Point ──────────────────────────────────────

function printReport(result: MigrationResult): void {
	const RED = "\x1b[31m";
	const GREEN = "\x1b[32m";
	const YELLOW = "\x1b[33m";
	const CYAN = "\x1b[36m";
	const RESET = "\x1b[0m";

	console.log(`${CYAN}PAI-OpenCode Legacy Config Migration (v3.0 WP-M1)${RESET}`);
	console.log(`${CYAN}═══════════════════════════════════════════════${RESET}`);
	console.log("");

	if (!result.success) {
		console.error(`${RED}✗ Migration failed:${RESET} ${result.error}`);
		return;
	}

	console.log(`  Config:        ${result.path}`);
	console.log(`  Backup:        ${result.backupPath}`);
	console.log(`  Agents seen:   ${result.agentsProcessed}`);
	console.log(`  Agents migrated: ${GREEN}${result.agentsMigrated}${RESET}`);
	console.log("");

	if (result.changes.length > 0) {
		console.log(`${CYAN}Changes:${RESET}`);
		for (const change of result.changes) {
			const srcLabel =
				change.source === "standard"
					? GREEN + "[standard tier]" + RESET
					: change.source === "top-level"
						? YELLOW + "[top-level]" + RESET
						: YELLOW + `[${change.source} tier fallback]` + RESET;
			console.log(
				`  ${change.agent.padEnd(20)} ${change.before ?? "(none)"} → ${change.after}  ${srcLabel}`
			);
		}
		console.log("");
	}

	if (result.agentsSkipped.length > 0) {
		console.log(`${YELLOW}Skipped:${RESET}`);
		for (const skip of result.agentsSkipped) {
			console.log(`  - ${skip}`);
		}
		console.log("");
	}

	console.log(`${GREEN}✓ Migration complete.${RESET}`);
	console.log(`  Your original config is preserved at ${result.backupPath}`);
	console.log("  If anything looks wrong, restore with:");
	console.log(`    cp ${result.backupPath} ${result.path}`);
}

// Execute when run directly (not when imported as a module)
const isMainScript =
	typeof Bun !== "undefined" && Bun.main === import.meta.path;

if (isMainScript) {
	const argPath = process.argv[2];
	const configPath = argPath ?? join(homedir(), ".opencode", "opencode.json");
	const result = migrateLegacyConfig(configPath);
	printReport(result);
	process.exit(result.success ? 0 : 1);
}
