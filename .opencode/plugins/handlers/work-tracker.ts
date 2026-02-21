/**
 * Work Tracker Handler
 *
 * Equivalent to PAI v2.4 AutoWorkCreation + SessionSummary hooks.
 * Creates and manages work sessions in MEMORY/WORK/
 *
 * @module work-tracker
 */

import * as fs from "fs";
import * as path from "path";
import { fileLog, fileLogError } from "../lib/file-logger";
import {
  getWorkDir,
  getYearMonth,
  getTimestamp,
  generateSessionId,
  ensureDir,
  getCurrentWorkPath,
  setCurrentWorkPath,
  clearCurrentWork,
  slugify,
} from "../lib/paths";

// ============================================================================
// TRIVIAL MESSAGE FILTERING
// ============================================================================

/**
 * Patterns for messages that should NOT create work sessions.
 * Aligned with PAI Algorithm depth classification:
 *   MINIMAL depth (greetings, ratings, acknowledgments) = no session.
 */
const TRIVIAL_PATTERNS = {
  greetings:
    /^(h(i|ey|ello|owdy)|yo|sup|guten\s*(morgen|tag|abend)|moin|servus|hallo|morning|evening)\b/i,
  acknowledgments:
    /^(ok(ay)?|thanks?|thx|got\s*it|sounds?\s*good|alright|sure|yep|yeah|yes|no|nope|klar|danke|passt|ja|nein|cool|nice|great|perfect|awesome)\b/i,
  ratings: /^\d{1,2}\s*(\/\s*10)?(\s*[-–—]\s*.{0,80})?$/,
  farewells:
    /^(bye|goodbye|ciao|tsch[uü]ss?|see\s*you|good\s*night|gn|later)\b/i,
};

/** Minimum character length for a message to be considered meaningful work */
const MIN_MEANINGFUL_LENGTH = 25;

/**
 * Check if a message is too trivial to warrant a work session.
 *
 * Returns true if the message should NOT create a session.
 * Returns false if the message is meaningful work.
 */
export function isTrivialMessage(content: string): boolean {
  const trimmed = content.trim();

  // Empty or very short messages are trivial
  if (trimmed.length < MIN_MEANINGFUL_LENGTH) {
    // Exception: commands (/) and code snippets should still create sessions
    if (trimmed.startsWith("/") || trimmed.startsWith("!") || trimmed.includes("```")) {
      return false;
    }
    return true;
  }

  // Check against trivial patterns (even if longer than threshold)
  for (const pattern of Object.values(TRIVIAL_PATTERNS)) {
    if (pattern.test(trimmed)) {
      return true;
    }
  }

  return false;
}

// ============================================================================
// WORK SESSION TYPES
// ============================================================================

/**
 * Work session metadata
 */
export interface WorkSession {
  id: string;
  path: string;
  title: string;
  started_at: string;
  status: "ACTIVE" | "COMPLETED";
}

/**
 * Create work session result
 */
export interface CreateWorkResult {
  success: boolean;
  session?: WorkSession;
  error?: string;
}

/**
 * Complete work session result
 */
export interface CompleteWorkResult {
  success: boolean;
  completed_at?: string;
  error?: string;
}

// In-memory cache for current session
let currentSession: WorkSession | null = null;

/**
 * Infer title from user prompt
 * Simple heuristic - first 6 words, cleaned
 */
function inferTitle(prompt: string): string {
  const words = prompt
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 0)
    .slice(0, 6);

  if (words.length === 0) {
    return "work-session";
  }

  return words.join(" ");
}

/**
 * Create a new work session
 *
 * Called on first user prompt if no active session exists.
 * Creates MEMORY/WORK/{timestamp}_{title}/ structure.
 */
export async function createWorkSession(
  prompt: string
): Promise<CreateWorkResult> {
  try {
    // Check if session already exists
    const existingPath = await getCurrentWorkPath();
    if (existingPath && currentSession) {
      fileLog("Work session already exists, reusing", "debug");
      return { success: true, session: currentSession };
    }

    // Create session directory
    const workDir = getWorkDir();
    const yearMonth = getYearMonth();
    const timestamp = getTimestamp();
    const title = inferTitle(prompt);
    const slug = slugify(title);
    const sessionId = `${timestamp}_${slug}`;

    const sessionPath = path.join(workDir, yearMonth, sessionId);
    await ensureDir(sessionPath);

    // Create subdirectories
    await ensureDir(path.join(sessionPath, "tasks"));
    await ensureDir(path.join(sessionPath, "scratch"));

    // Create META.yaml
    const meta = {
      status: "ACTIVE",
      started_at: new Date().toISOString(),
      title: title,
      session_id: sessionId,
    };

    await fs.promises.writeFile(
      path.join(sessionPath, "META.yaml"),
      `status: ${meta.status}\nstarted_at: ${meta.started_at}\ntitle: "${meta.title}"\nsession_id: ${meta.session_id}\n`
    );

    // Create empty ISC.json
    await fs.promises.writeFile(
      path.join(sessionPath, "ISC.json"),
      JSON.stringify({ criteria: [], anti_criteria: [] }, null, 2)
    );

    // Create THREAD.md
    await fs.promises.writeFile(
      path.join(sessionPath, "THREAD.md"),
      `# ${title}\n\n**Started:** ${meta.started_at}\n**Status:** ACTIVE\n\n---\n\n`
    );

    // Update state
    await setCurrentWorkPath(sessionPath);

    currentSession = {
      id: sessionId,
      path: sessionPath,
      title: title,
      started_at: meta.started_at,
      status: "ACTIVE",
    };

    fileLog(`Work session created: ${sessionId}`, "info");

    return { success: true, session: currentSession };
  } catch (error) {
    fileLogError("Failed to create work session", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get current work session
 */
export function getCurrentSession(): WorkSession | null {
  return currentSession;
}

/**
 * Complete the current work session
 *
 * Called at session end. Updates META.yaml with completion timestamp.
 */
export async function completeWorkSession(): Promise<CompleteWorkResult> {
  try {
    const sessionPath = await getCurrentWorkPath();
    if (!sessionPath) {
      fileLog("No active work session to complete", "debug");
      return { success: true };
    }

    const metaPath = path.join(sessionPath, "META.yaml");
    const completed_at = new Date().toISOString();

    // Read existing meta
    let metaContent = "";
    try {
      metaContent = await fs.promises.readFile(metaPath, "utf-8");
    } catch {
      metaContent = "";
    }

    // Update status
    metaContent = metaContent
      .replace(/status: ACTIVE/, "status: COMPLETED")
      .trim();
    metaContent += `\ncompleted_at: ${completed_at}\n`;

    await fs.promises.writeFile(metaPath, metaContent);

    // Clear state
    await clearCurrentWork();
    currentSession = null;

    fileLog(`Work session completed: ${sessionPath}`, "info");

    return { success: true, completed_at };
  } catch (error) {
    fileLogError("Failed to complete work session", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Append to THREAD.md
 */
export async function appendToThread(content: string): Promise<void> {
  const sessionPath = await getCurrentWorkPath();
  if (!sessionPath) return;

  const threadPath = path.join(sessionPath, "THREAD.md");

  try {
    await fs.promises.appendFile(threadPath, `\n${content}\n`);
  } catch (error) {
    fileLogError("Failed to append to THREAD.md", error);
  }
}

/**
 * Update ISC.json with criteria from the Algorithm's TaskCreate/TodoWrite.
 *
 * Called by algorithm-tracker.ts when ISC criteria are created/updated.
 * Bridges the gap between the Algorithm's working memory (TodoWrite) and
 * the persistent work session (ISC.json on disk).
 */
export async function updateISC(
  criteria: { description: string; status: string; priority?: string }[]
): Promise<void> {
  const sessionPath = await getCurrentWorkPath();
  if (!sessionPath) return;

  const iscPath = path.join(sessionPath, "ISC.json");

  try {
    // Separate criteria from anti-criteria based on ISC naming convention
    const regular = criteria.filter((c) => !c.description.includes("ISC-A"));
    const anti = criteria.filter((c) => c.description.includes("ISC-A"));

    const isc = {
      criteria: regular,
      anti_criteria: anti,
      total: criteria.length,
      completed: criteria.filter((c) => c.status === "completed").length,
      updated_at: new Date().toISOString(),
    };
    await fs.promises.writeFile(iscPath, JSON.stringify(isc, null, 2));
  } catch (error) {
    fileLogError("Failed to update ISC.json", error);
  }
}
