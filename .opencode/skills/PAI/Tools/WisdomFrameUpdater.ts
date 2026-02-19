#!/usr/bin/env bun
/**
 * WisdomFrameUpdater - Manage Wisdom Frames for PAI's dual-loop learning system (v1.8.0)
 *
 * Wisdom Frames compound knowledge across sessions:
 * - OBSERVE reads frames → better ISC from past experience
 * - LEARN writes frames → knowledge accumulates over time
 *
 * Commands:
 *   --domain X --observation "Y" --type Z   Append observation to a frame
 *   --list                                   Show all frames and entry counts
 *   --domain X --show                        Show specific frame contents
 *
 * Types: anti-pattern, contextual-rule, prediction, principle
 *
 * Examples:
 *   bun WisdomFrameUpdater.ts --domain development --observation "Bun test requires --experimental-vm-modules for ES modules" --type contextual-rule
 *   bun WisdomFrameUpdater.ts --domain security --observation "env var prefixes can bypass SecurityValidator" --type anti-pattern
 *   bun WisdomFrameUpdater.ts --list
 *   bun WisdomFrameUpdater.ts --domain deployment --show
 */

import { parseArgs } from "util";
import * as fs from "fs";
import * as path from "path";

// ============================================================================
// Configuration
// ============================================================================

const PAI_DIR = process.env.PAI_DIR || path.join(process.env.HOME!, ".opencode");
const WISDOM_DIR = path.join(PAI_DIR, "MEMORY", "WISDOM");

const VALID_TYPES = ["anti-pattern", "contextual-rule", "prediction", "principle"] as const;
type ObservationType = typeof VALID_TYPES[number];

const SECTION_MAP: Record<ObservationType, string> = {
  "anti-pattern": "## Anti-Patterns",
  "contextual-rule": "## Contextual Rules",
  "prediction": "## Predictions",
  "principle": "## Principles",
};

// ============================================================================
// Frame Operations
// ============================================================================

function getFramePath(domain: string): string {
  return path.join(WISDOM_DIR, `${domain}.md`);
}

function ensureWisdomDir(): void {
  if (!fs.existsSync(WISDOM_DIR)) {
    fs.mkdirSync(WISDOM_DIR, { recursive: true });
  }
}

function createFrameIfNeeded(domain: string): string {
  const framePath = getFramePath(domain);

  if (!fs.existsSync(framePath)) {
    const content = `# Wisdom Frame: ${domain}

## Anti-Patterns

## Contextual Rules

## Predictions

## Principles
`;
    fs.writeFileSync(framePath, content);
    console.log(`✨ Created new frame: ${domain}.md`);
  }

  return framePath;
}

function appendObservation(domain: string, observation: string, type: ObservationType): void {
  ensureWisdomDir();
  const framePath = createFrameIfNeeded(domain);

  const content = fs.readFileSync(framePath, "utf-8");
  const sectionHeader = SECTION_MAP[type];
  const date = new Date().toISOString().split("T")[0];
  const entry = `- ${observation} (source: session ${date}, type: ${type})`;

  // Find the section header and append after it
  const lines = content.split("\n");
  let inserted = false;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === sectionHeader) {
      // Find the end of this section (next ## header or end of file)
      let insertIdx = i + 1;

      // Skip any existing entries in this section
      while (insertIdx < lines.length && !lines[insertIdx].startsWith("## ") && insertIdx < lines.length) {
        insertIdx++;
      }

      // Insert before the next section header (or at end)
      // But make sure we insert after the last entry, not after blank lines before next section
      let lastEntryIdx = i;
      for (let j = i + 1; j < insertIdx; j++) {
        if (lines[j].trim().startsWith("- ")) {
          lastEntryIdx = j;
        }
      }

      // Insert after last entry in section, or right after section header
      const insertAt = lastEntryIdx === i ? i + 1 : lastEntryIdx + 1;
      lines.splice(insertAt, 0, entry);
      inserted = true;
      break;
    }
  }

  if (!inserted) {
    // Section header not found — append to end
    lines.push("", sectionHeader, entry);
  }

  fs.writeFileSync(framePath, lines.join("\n"));
  console.log(`✅ Added ${type} to ${domain}.md`);
  console.log(`   ${entry}`);
}

function listFrames(): void {
  ensureWisdomDir();

  if (!fs.existsSync(WISDOM_DIR)) {
    console.log("No wisdom frames found.");
    return;
  }

  const files = fs.readdirSync(WISDOM_DIR)
    .filter(f => f.endsWith(".md") && f !== "README.md")
    .sort();

  if (files.length === 0) {
    console.log("No wisdom frames found.");
    return;
  }

  console.log("📚 Wisdom Frames:\n");

  for (const file of files) {
    const domain = file.replace(".md", "");
    const content = fs.readFileSync(path.join(WISDOM_DIR, file), "utf-8");

    // Count entries per section
    const counts: Record<string, number> = {};
    for (const [type, header] of Object.entries(SECTION_MAP)) {
      const headerIdx = content.indexOf(header);
      if (headerIdx === -1) {
        counts[type] = 0;
        continue;
      }

      // Count lines starting with "- " in this section
      const sectionStart = headerIdx + header.length;
      const nextHeader = content.indexOf("\n## ", sectionStart);
      const sectionContent = nextHeader === -1
        ? content.slice(sectionStart)
        : content.slice(sectionStart, nextHeader);

      counts[type] = (sectionContent.match(/^- /gm) || []).length;
    }

    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    console.log(`  📖 ${domain} (${total} entries)`);
    console.log(`     Anti-Patterns: ${counts["anti-pattern"]} | Rules: ${counts["contextual-rule"]} | Predictions: ${counts["prediction"]} | Principles: ${counts["principle"]}`);
  }
}

function showFrame(domain: string): void {
  const framePath = getFramePath(domain);

  if (!fs.existsSync(framePath)) {
    console.error(`Frame not found: ${domain}.md`);
    console.error(`Available frames: ${fs.readdirSync(WISDOM_DIR).filter(f => f.endsWith(".md") && f !== "README.md").map(f => f.replace(".md", "")).join(", ")}`);
    process.exit(1);
  }

  const content = fs.readFileSync(framePath, "utf-8");
  console.log(content);
}

// ============================================================================
// CLI
// ============================================================================

const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    domain: { type: "string" },
    observation: { type: "string" },
    type: { type: "string" },
    list: { type: "boolean" },
    show: { type: "boolean" },
    help: { type: "boolean", short: "h" },
  },
});

if (values.help) {
  console.log(`
WisdomFrameUpdater - Manage PAI Wisdom Frames (v1.8.0)

Usage:
  bun WisdomFrameUpdater.ts --domain X --observation "Y" --type Z   Append observation
  bun WisdomFrameUpdater.ts --list                                   List all frames
  bun WisdomFrameUpdater.ts --domain X --show                        Show frame contents

Types: anti-pattern, contextual-rule, prediction, principle

Examples:
  bun WisdomFrameUpdater.ts --domain development --observation "Always use Bun" --type contextual-rule
  bun WisdomFrameUpdater.ts --list
  bun WisdomFrameUpdater.ts --domain security --show
`);
  process.exit(0);
}

// Mode: List all frames
if (values.list) {
  listFrames();
  process.exit(0);
}

// Mode: Show specific frame
if (values.show) {
  if (!values.domain) {
    console.error("Error: --show requires --domain");
    process.exit(1);
  }
  showFrame(values.domain);
  process.exit(0);
}

// Mode: Append observation
if (values.observation) {
  if (!values.domain) {
    console.error("Error: --observation requires --domain");
    process.exit(1);
  }
  if (!values.type) {
    console.error("Error: --observation requires --type (anti-pattern, contextual-rule, prediction, principle)");
    process.exit(1);
  }
  if (!VALID_TYPES.includes(values.type as ObservationType)) {
    console.error(`Error: Invalid type "${values.type}". Must be one of: ${VALID_TYPES.join(", ")}`);
    process.exit(1);
  }

  appendObservation(values.domain, values.observation, values.type as ObservationType);
  process.exit(0);
}

// No valid mode selected
console.error("No action specified. Use --help for usage.");
process.exit(1);
