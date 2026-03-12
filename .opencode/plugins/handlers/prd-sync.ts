/**
 * PRD Sync Handler
 *
 * Ported from PAI v4.0.3 PRDSync.hook.ts
 * Triggered by: tool.execute.after (Write / Edit tool on PRD.md files)
 *
 * PURPOSE:
 * When the AI writes or edits a PRD.md file in MEMORY/WORK/, this handler
 * reads the updated frontmatter (status, phase, iteration, failing_criteria)
 * and syncs it to a lightweight work-registry JSON for the dashboard and
 * session continuity.
 *
 * IMPORTANT: Read-only from the PRD's perspective.
 * The AI writes all PRD content directly. This handler only READS and syncs.
 *
 * @module prd-sync
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileLog, fileLogError } from "../lib/file-logger";
import { ensureDir, getStateDir } from "../lib/paths";

interface PRDFrontmatter {
	id?: string;
	status?: string;
	phase?: string;
	iteration?: number;
	failing_criteria?: string[];
	verification_summary?: string;
	effort_level?: string;
	updated?: string;
}

interface WorkRegistryEntry {
	prd_id: string;
	prd_path: string;
	status: string;
	phase: string;
	iteration: number;
	failing_criteria: string[];
	verification_summary: string;
	effort_level: string;
	synced_at: string;
}

interface WorkRegistry {
	sessions: Record<string, WorkRegistryEntry>;
	last_updated: string;
}

/**
 * Parse YAML-like frontmatter from PRD.md content.
 * Handles the --- delimited frontmatter block.
 */
function parseFrontmatter(content: string): PRDFrontmatter | null {
	const fmMatch = content.match(/^---\n([\s\S]+?)\n---/);
	if (!fmMatch) return null;

	const fm: PRDFrontmatter = {};
	const lines = fmMatch[1].split("\n");

	for (const line of lines) {
		const colonIdx = line.indexOf(":");
		if (colonIdx === -1) continue;

		const key = line.slice(0, colonIdx).trim();
		const rawVal = line.slice(colonIdx + 1).trim();

		// Strip quotes
		const val = rawVal.replace(/^["']|["']$/g, "");

		switch (key) {
			case "id":
				fm.id = val;
				break;
			case "status":
				fm.status = val;
				break;
			case "phase":
			case "last_phase":
				fm.phase = val;
				break;
			case "iteration":
				fm.iteration = Number.parseInt(val, 10) || 0;
				break;
			case "verification_summary":
				fm.verification_summary = val;
				break;
			case "effort_level":
				fm.effort_level = val;
				break;
			case "updated":
				fm.updated = val;
				break;
		}

		// failing_criteria: capture inline array format only (e.g. failing_criteria: ["ISC-C1"])
		// Does NOT handle YAML multi-line arrays (items on separate lines with "- ").
		// If the value is not an inline bracket array, falls back to empty array.
		if (key === "failing_criteria") {
			const inlineMatch = rawVal.match(/\[([^\]]*)\]/);
			if (inlineMatch) {
				fm.failing_criteria = inlineMatch[1]
					.split(",")
					.map((s) => s.trim().replace(/["']/g, ""))
					.filter(Boolean);
			} else {
				fm.failing_criteria = [];
			}
		}
	}

	return fm;
}

/**
 * Read or initialize the work registry JSON.
 */
function readRegistry(registryPath: string): WorkRegistry {
	try {
		if (fs.existsSync(registryPath)) {
			return JSON.parse(fs.readFileSync(registryPath, "utf-8"));
		}
	} catch {
		// Corrupted — start fresh
	}
	return { sessions: {}, last_updated: new Date().toISOString() };
}

/**
 * Sync PRD frontmatter to the work registry.
 *
 * @param filePath - Absolute path to the PRD.md file just written/edited
 * @param sessionId - OpenCode session ID (for registry keying)
 */
export async function syncPRDToRegistry(
	filePath: string,
	_sessionId?: string
): Promise<{ synced: boolean; prdId?: string }> {
	try {
		// Normalize path separators for cross-platform compatibility (Windows backslash fix)
		const normalizedPath = filePath.replace(/\\/g, "/");
		// Only process PRD.md files in MEMORY/WORK/
		if (!normalizedPath.includes("MEMORY/WORK/") || !normalizedPath.endsWith("PRD.md")) {
			return { synced: false };
		}

		if (!fs.existsSync(filePath)) {
			return { synced: false };
		}

		const content = fs.readFileSync(filePath, "utf-8");
		const fm = parseFrontmatter(content);
		if (!fm || !fm.id) {
			fileLog("[PRDSync] No valid frontmatter or id found", "debug");
			return { synced: false };
		}

		// Build registry entry
		const entry: WorkRegistryEntry = {
			prd_id: fm.id,
			prd_path: filePath,
			status: fm.status || "UNKNOWN",
			phase: fm.phase || "UNKNOWN",
			iteration: fm.iteration || 0,
			failing_criteria: fm.failing_criteria || [],
			verification_summary: fm.verification_summary || "0/0",
			effort_level: fm.effort_level || "Standard",
			synced_at: new Date().toISOString(),
		};

		// Write to registry — atomic write to prevent race conditions / lost updates
		// Pattern: write to temp file → rename (atomic on same filesystem)
		const stateDir = getStateDir();
		await ensureDir(stateDir);
		const registryPath = path.join(stateDir, "prd-registry.json");
		const tmpPath = `${registryPath}.tmp.${process.pid}`;

		const registry = readRegistry(registryPath);

		// Key by prd_id (not session — multiple PRDs per session possible)
		registry.sessions[fm.id] = entry;
		registry.last_updated = new Date().toISOString();

		// Write to temp then rename — atomic on POSIX, near-atomic on Windows
		fs.writeFileSync(tmpPath, JSON.stringify(registry, null, 2), "utf-8");
		fs.renameSync(tmpPath, registryPath);

		fileLog(
			`[PRDSync] Synced PRD ${fm.id} — status=${entry.status} phase=${entry.phase} iter=${entry.iteration}`,
			"info"
		);

		return { synced: true, prdId: fm.id };
	} catch (error) {
		fileLogError("[PRDSync] Sync failed", error);
		return { synced: false };
	}
}
