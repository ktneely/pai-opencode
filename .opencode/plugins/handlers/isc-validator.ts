/**
 * ISC Validator Handler
 *
 * Validates that ISC.json was properly populated during algorithm execution.
 * Ported from PAI v2.5 ISCValidator.ts handler.
 *
 * VALIDATION RULES:
 * 1. ISC.json criteria array must be non-empty after algorithm execution
 * 2. ISC.json must have been modified since session start
 * 3. THREAD.md should not have _Pending..._ placeholders
 *
 * BEHAVIOR:
 * - WARNS if validation fails (logs to file-logger)
 * - Can optionally return blocking signal (not implemented yet in OpenCode)
 *
 * @module isc-validator
 */

import * as fs from "fs";
import * as path from "path";
import { fileLog, fileLogError } from "../lib/file-logger";
import { getCurrentWorkPath } from "../lib/paths";

/**
 * ISC Data structure
 */
interface ISCData {
	criteria: { description: string; status: string }[] | string[];
	anti_criteria: string[];
	updated_at?: string;
}

/**
 * Validation result
 */
export interface ISCValidationResult {
	valid: boolean;
	warnings: string[];
	errors: string[];
	algorithmDetected: boolean;
	criteriaCount: number;
}

/**
 * Read ISC.json from session path
 */
function readISC(sessionPath: string): ISCData | null {
	try {
		const iscPath = path.join(sessionPath, "ISC.json");
		if (!fs.existsSync(iscPath)) return null;
		return JSON.parse(fs.readFileSync(iscPath, "utf-8"));
	} catch {
		return null;
	}
}

/**
 * Read THREAD.md from session path
 */
function readThread(sessionPath: string): string | null {
	try {
		const threadPath = path.join(sessionPath, "THREAD.md");
		if (!fs.existsSync(threadPath)) return null;
		return fs.readFileSync(threadPath, "utf-8");
	} catch {
		return null;
	}
}

/**
 * Read META.yaml to get session start time
 */
function getSessionStartTime(sessionPath: string): Date | null {
	try {
		const metaPath = path.join(sessionPath, "META.yaml");
		if (!fs.existsSync(metaPath)) return null;
		const content = fs.readFileSync(metaPath, "utf-8");
		const match = content.match(/started_at:\s*(.+)/);
		if (match) {
			return new Date(match[1]);
		}
		return null;
	} catch {
		return null;
	}
}

/**
 * Get file modification time
 */
function getFileModTime(filePath: string): Date | null {
	try {
		if (!fs.existsSync(filePath)) return null;
		const stats = fs.statSync(filePath);
		return stats.mtime;
	} catch {
		return null;
	}
}

/**
 * Detect if algorithm was attempted in response text
 */
function detectAlgorithmExecution(responseText: string): boolean {
	const algorithmMarkers = [
		"OBSERVE",
		"📦 CAPABILITIES",
		"ISC TRACKER",
		"🎯 ISC",
		"IDEAL STATE",
		"PAI ALGORITHM",
		"🤖 PAI",
		"TASK:",
		"VERIFY",
		"━━━",
	];

	return algorithmMarkers.some((marker) =>
		responseText.toUpperCase().includes(marker.toUpperCase()),
	);
}

/**
 * Validate ISC.json for current work session
 *
 * @param responseText - The assistant's response text (to detect algorithm execution)
 * @returns Validation result with warnings and errors
 */
export async function validateISC(
	responseText: string = "",
): Promise<ISCValidationResult> {
	const result: ISCValidationResult = {
		valid: true,
		warnings: [],
		errors: [],
		algorithmDetected: false,
		criteriaCount: 0,
	};

	try {
		// Get current work session path
		const sessionPath = await getCurrentWorkPath();
		if (!sessionPath) {
			fileLog("[ISCValidator] No active work session - skipping validation");
			return result;
		}

		// Check if algorithm was attempted
		result.algorithmDetected = detectAlgorithmExecution(responseText);

		// Read ISC.json
		const isc = readISC(sessionPath);
		if (!isc) {
			if (result.algorithmDetected) {
				result.errors.push("ISC.json not found after algorithm execution");
				result.valid = false;
			}
			return result;
		}

		// Count criteria
		result.criteriaCount = Array.isArray(isc.criteria)
			? isc.criteria.length
			: 0;

		// Rule 1: If algorithm was attempted, criteria should be non-empty
		if (result.algorithmDetected && result.criteriaCount === 0) {
			result.warnings.push(
				"ISC.json criteria array is EMPTY - algorithm may not have executed properly",
			);
		}

		// Rule 2: Check if ISC.json was modified after session start
		const sessionStart = getSessionStartTime(sessionPath);
		const iscPath = path.join(sessionPath, "ISC.json");
		const iscModTime = getFileModTime(iscPath);

		if (sessionStart && iscModTime && iscModTime <= sessionStart) {
			if (result.algorithmDetected) {
				result.warnings.push(
					"ISC.json not modified since session start - no updates during algorithm execution",
				);
			}
		}

		// Rule 3: Check THREAD.md for pending placeholders
		const thread = readThread(sessionPath);
		if (thread) {
			const pendingCount = (thread.match(/_Pending\.\.\._/g) || []).length;
			if (pendingCount > 0) {
				result.warnings.push(
					`THREAD.md has ${pendingCount} phases still marked _Pending..._ - algorithm phases not logged`,
				);
			}
		}

		// Log results
		if (result.errors.length > 0) {
			fileLog("[ISCValidator] ERRORS:");
			result.errors.forEach((e) => fileLog(`  ❌ ${e}`, "error"));
			result.valid = false;
		}

		if (result.warnings.length > 0) {
			fileLog("[ISCValidator] WARNINGS:");
			result.warnings.forEach((w) => fileLog(`  ⚠️  ${w}`, "warn"));
		}

		if (result.valid && result.warnings.length === 0) {
			if (result.algorithmDetected) {
				fileLog(
					`[ISCValidator] ✓ Validation passed (${result.criteriaCount} criteria)`,
				);
			}
		}

		return result;
	} catch (error) {
		fileLogError("[ISCValidator] Validation failed", error);
		return result;
	}
}

/**
 * Get ISC criteria count for current session
 * Useful for status displays
 */
export async function getISCCriteriaCount(): Promise<number> {
	try {
		const sessionPath = await getCurrentWorkPath();
		if (!sessionPath) return 0;

		const isc = readISC(sessionPath);
		if (!isc) return 0;

		return Array.isArray(isc.criteria) ? isc.criteria.length : 0;
	} catch {
		return 0;
	}
}

/**
 * Update ISC criteria
 * Called when algorithm creates/updates ISC
 */
export async function updateISCCriteria(
	criteria: { description: string; status: string }[],
): Promise<boolean> {
	try {
		const sessionPath = await getCurrentWorkPath();
		if (!sessionPath) {
			fileLog("[ISCValidator] No active session - cannot update ISC");
			return false;
		}

		const iscPath = path.join(sessionPath, "ISC.json");

		// Read existing ISC or create new
		let isc: ISCData = { criteria: [], anti_criteria: [] };
		try {
			if (fs.existsSync(iscPath)) {
				isc = JSON.parse(fs.readFileSync(iscPath, "utf-8"));
			}
		} catch {
			// Use default
		}

		// Update criteria
		isc.criteria = criteria;
		isc.updated_at = new Date().toISOString();

		// Write back
		fs.writeFileSync(iscPath, JSON.stringify(isc, null, 2));
		fileLog(`[ISCValidator] Updated ISC with ${criteria.length} criteria`);

		return true;
	} catch (error) {
		fileLogError("[ISCValidator] Failed to update ISC", error);
		return false;
	}
}
