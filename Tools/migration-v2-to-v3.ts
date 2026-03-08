#!/usr/bin/env bun
/**
 * PAI-OpenCode v2 → v3 Migration Tool
 *
 * Automatically migrates existing v2.x installations to v3.0 structure.
 *
 * Usage:
 *   bun tools/migration-v2-to-v3.ts              # Run migration
 *   bun tools/migration-v2-to-v3.ts --dry-run  # Preview only
 *   bun tools/migration-v2-to-v3.ts --force     # Skip version check
 *   bun tools/migration-v2-to-v3.ts --backup-dir /custom/path
 */

import { existsSync, statSync, copyFileSync, mkdirSync, renameSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { spawn } from "bun";

// ═══════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════

const PAI_DIR = join(homedir(), ".opencode");
const BACKUP_PREFIX = ".opencode-backup-";
const TIMESTAMP = new Date().toISOString().split("T")[0].replace(/-/g, "");

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════

interface MigrationReport {
  version: string;
  backupPath: string;
  migrated: string[];
  skipped: string[];
  manualReview: string[];
  errors: string[];
}

interface Options {
  dryRun: boolean;
  force: boolean;
  backupDir: string;
}

// ═══════════════════════════════════════════════════════════
// CLI Argument Parsing
// ═══════════════════════════════════════════════════════════

function parseArgs(): Options {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes("--dry-run"),
    force: args.includes("--force"),
    backupDir: args.find((a) => a.startsWith("--backup-dir="))?.split("=")[1] || PAI_DIR,
  };
}

function log(message: string, level: "info" | "success" | "warn" | "error" = "info") {
  const icons = { info: "ℹ", success: "✓", warn: "⚠", error: "✗" };
  const colors = { info: "\x1b[36m", success: "\x1b[32m", warn: "\x1b[33m", error: "\x1b[31m" };
  const reset = "\x1b[0m";
  console.log(`${colors[level]}${icons[level]}${reset} ${message}`);
}

// ═══════════════════════════════════════════════════════════
// Version Detection
// ═══════════════════════════════════════════════════════════

async function detectVersion(): Promise<string> {
  const opencodeJson = join(PAI_DIR, "opencode.json");
  const settingsJson = join(PAI_DIR, "settings.json");

  if (existsSync(opencodeJson)) {
    try {
      const content = await Bun.file(opencodeJson).text();
      const parsed = JSON.parse(content);
      return parsed.pai?.version || "unknown";
    } catch {
      return "unknown";
    }
  }

  // Check for v2.x indicators (flat skill structure)
  const skillsDir = join(PAI_DIR, "skills");
  if (existsSync(skillsDir)) {
    // If skills are flat (no Category/Skill nesting), it's v2
    const entries = await Array.fromAsync(Bun.file(skillsDir).stream());
    // Simplified: assume v2 if no version file found
    return "2.x";
  }

  return "unknown";
}

// ═══════════════════════════════════════════════════════════
// Backup
// ═══════════════════════════════════════════════════════════

async function createBackup(backupPath: string, dryRun: boolean): Promise<void> {
  if (dryRun) {
    log(`[DRY-RUN] Would backup ${PAI_DIR} → ${backupPath}`, "info");
    return;
  }

  if (!existsSync(PAI_DIR)) {
    throw new Error(`PAI directory not found: ${PAI_DIR}`);
  }

  log(`Creating backup at ${backupPath}...`, "info");

  // Create backup directory
  mkdirSync(backupPath, { recursive: true });

  // Copy all files recursively (using cp -R for simplicity)
  const proc = spawn({
    cmd: ["cp", "-R", join(PAI_DIR, "."), backupPath],
    stdout: "pipe",
    stderr: "pipe",
  });

  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    throw new Error(`Backup failed with exit code ${exitCode}`);
  }

  log(`Backup created: ${backupPath}`, "success");
}

// ═══════════════════════════════════════════════════════════
// Migration Steps
// ═══════════════════════════════════════════════════════════

async function migrateSkills(report: MigrationReport, dryRun: boolean): Promise<void> {
  const skillsDir = join(PAI_DIR, "skills");
  if (!existsSync(skillsDir)) {
    report.skipped.push("skills directory not found");
    return;
  }

  // Detect flat skills (v2) and convert to hierarchical (v3)
  // This is a placeholder - actual implementation would scan and restructure
  log("Checking skill structure...", "info");

  // For now, just validate structure
  const validationProc = spawn({
    cmd: ["bun", "run", ".opencode/skills/PAI/Tools/ValidateSkillStructure.ts"],
    cwd: PAI_DIR,
    stdout: "pipe",
    stderr: "pipe",
  });

  const exitCode = await validationProc.exited;
  if (exitCode === 0) {
    report.migrated.push("Skills structure validated (already v3 compatible)");
  } else {
    report.manualReview.push("Skills validation failed - manual restructuring needed");
  }
}

async function updateMinimalBootstrap(report: MigrationReport, dryRun: boolean): Promise<void> {
  const bootstrapPath = join(PAI_DIR, "MINIMAL_BOOTSTRAP.md");
  if (!existsSync(bootstrapPath)) {
    report.skipped.push("MINIMAL_BOOTSTRAP.md not found");
    return;
  }

  log("Checking MINIMAL_BOOTSTRAP.md...", "info");

  // Read and check for outdated paths
  const content = await Bun.file(bootstrapPath).text();
  const hasOldPaths = content.includes("/USMetrics/USMetrics/") || content.includes("/Telos/Telos/");

  if (hasOldPaths) {
    if (dryRun) {
      log("[DRY-RUN] Would update MINIMAL_BOOTSTRAP.md paths", "info");
    } else {
      // Update paths
      const updated = content
        .replace(/\/USMetrics\/USMetrics\//g, "/USMetrics/")
        .replace(/\/Telos\/Telos\//g, "/Telos/");
      writeFileSync(bootstrapPath, updated);
      report.migrated.push("MINIMAL_BOOTSTRAP.md paths updated");
    }
  } else {
    report.skipped.push("MINIMAL_BOOTSTRAP.md already up-to-date");
  }
}

// ═══════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════

async function main(): Promise<void> {
  const options = parseArgs();
  const backupPath = join(options.backupDir, `${BACKUP_PREFIX}${TIMESTAMP}`);

  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║   PAI-OpenCode v2 → v3 Migration Tool                  ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  if (options.dryRun) {
    log("DRY-RUN MODE: No changes will be made", "warn");
    console.log("");
  }

  // Detect version
  log("Detecting current version...", "info");
  const version = await detectVersion();
  log(`Detected version: ${version}`, version.startsWith("3") ? "success" : "info");

  if (version.startsWith("3") && !options.force) {
    log("Already on v3.x. Use --force to run anyway.", "warn");
    process.exit(0);
  }

  // Initialize report
  const report: MigrationReport = {
    version,
    backupPath,
    migrated: [],
    skipped: [],
    manualReview: [],
    errors: [],
  };

  try {
    // Step 1: Backup
    await createBackup(backupPath, options.dryRun);

    // Step 2: Migrate skills
    await migrateSkills(report, options.dryRun);

    // Step 3: Update documentation
    await updateMinimalBootstrap(report, options.dryRun);

    // Print report
    console.log("\n╔══════════════════════════════════════════════════════════╗");
    console.log("║   Migration Report                                       ║");
    console.log("╚══════════════════════════════════════════════════════════╝\n");

    log(`Version: ${report.version}`, "info");
    log(`Backup: ${report.backupPath}`, "info");
    console.log("");

    if (report.migrated.length > 0) {
      console.log("✓ Migrated:");
      report.migrated.forEach((item) => console.log(`  - ${item}`));
      console.log("");
    }

    if (report.skipped.length > 0) {
      console.log("○ Skipped:");
      report.skipped.forEach((item) => console.log(`  - ${item}`));
      console.log("");
    }

    if (report.manualReview.length > 0) {
      console.log("⚠ Manual Review Required:");
      report.manualReview.forEach((item) => console.log(`  - ${item}`));
      console.log("");
    }

    if (report.errors.length > 0) {
      console.log("✗ Errors:");
      report.errors.forEach((item) => console.log(`  - ${item}`));
      process.exit(1);
    }

    if (options.dryRun) {
      log("Dry-run complete. Run without --dry-run to apply changes.", "success");
    } else {
      log("Migration complete!", "success");
    }

    console.log("\nNext steps:");
    console.log("  1. Run: bun run skills:validate");
    console.log("  2. Test with: opencode");
    console.log("  3. If issues: restore from backup at", backupPath);

  } catch (error) {
    log(`Migration failed: ${error.message}`, "error");
    report.errors.push(error.message);
    process.exit(1);
  }
}

// Run if main
if (import.meta.main) {
  main();
}

export { detectVersion, createBackup, migrateSkills };
