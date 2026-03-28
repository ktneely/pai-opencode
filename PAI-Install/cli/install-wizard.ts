#!/usr/bin/env bun

/**
 * PAI-OpenCode v3 Installation Wizard (terminal-only)
 *
 * Interactive installer flow for fresh install, migration, and updates.
 * No GUI/Electron dependencies.
 */

import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { parseArgs } from "node:util";
import * as readline from "node:readline";
import { createFreshState } from "../engine/state.ts";
import {
	stepBuildOpenCode,
	stepIdentity,
	stepInstallPAI,
	stepPrerequisites,
	stepProviderConfig,
	stepVoice,
} from "../engine/steps-fresh.ts";
import { PROVIDER_LABELS, PROVIDER_MODELS } from "../engine/provider-models.ts";
import type { ProviderName } from "../engine/provider-models.ts";
import {
	stepBinaryUpdate,
	stepCreateBackup,
	stepDetectMigration,
	stepMigrate,
	stepMigrationDone,
} from "../engine/steps-migrate.ts";
import {
	stepApplyUpdate,
	stepDetectUpdate,
	stepUpdateDone,
} from "../engine/steps-update.ts";

const COLOR = {
	reset: "\x1b[0m",
	bold: "\x1b[1m",
	blue: "\x1b[34m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
	red: "\x1b[31m",
	cyan: "\x1b[36m",
	gray: "\x1b[90m",
} as const;

const PROGRESS_BAR_WIDTH = 24;

const API_KEY_REQUIRED = new Set<ProviderName>(["openai", "anthropic", "openrouter"]);

const PROVIDER_ENV_VARS: Record<ProviderName, string[]> = {
	anthropic: ["ANTHROPIC_API_KEY", "API_KEY"],
	openai: ["OPENAI_API_KEY", "API_KEY"],
	openrouter: ["OPENROUTER_API_KEY", "API_KEY"],
	zen: ["ZEN_API_KEY", "API_KEY"],
};

type Mode = "fresh" | "migrate" | "update";

const { values } = parseArgs({
	args: Bun.argv.slice(2),
	options: {
		help: { type: "boolean", default: false },
		fresh: { type: "boolean", default: false },
		migrate: { type: "boolean", default: false },
		update: { type: "boolean", default: false },
		"skip-build": { type: "boolean", default: false },
	},
	strict: true,
});

function print(message = ""): void {
	console.log(message);
}

function printInfo(message: string): void {
	print(`${COLOR.blue}[wizard]${COLOR.reset} ${message}`);
}

function printSuccess(message: string): void {
	print(`${COLOR.green}[wizard]${COLOR.reset} ${message}`);
}

function printWarning(message: string): void {
	print(`${COLOR.yellow}[wizard]${COLOR.reset} ${message}`);
}

function printError(message: string): void {
	print(`${COLOR.red}[wizard]${COLOR.reset} ${message}`);
}

function showHelp(): void {
	print("PAI-OpenCode Installation Wizard (terminal)");
	print("");
	print("Usage:");
	print("  bun PAI-Install/cli/install-wizard.ts");
	print("  bun PAI-Install/cli/install-wizard.ts --fresh");
	print("  bun PAI-Install/cli/install-wizard.ts --migrate");
	print("  bun PAI-Install/cli/install-wizard.ts --update");
	print("");
	print("Options:");
	print("  --skip-build   Skip OpenCode binary build in fresh install");
	print("  --help         Show this help");
}

function banner(): void {
	print("");
	print(`${COLOR.cyan}${COLOR.bold}╔══════════════════════════════════════════════════════════════╗${COLOR.reset}`);
	print(`${COLOR.cyan}${COLOR.bold}║${COLOR.reset}    ${COLOR.bold}PAI-OpenCode Installer Wizard (v3 Terminal Flow)${COLOR.reset}       ${COLOR.cyan}${COLOR.bold}║${COLOR.reset}`);
	print(`${COLOR.cyan}${COLOR.bold}║${COLOR.reset}    Guided setup for Fresh Install, Migration, and Updates     ${COLOR.cyan}${COLOR.bold}║${COLOR.reset}`);
	print(`${COLOR.cyan}${COLOR.bold}╚══════════════════════════════════════════════════════════════╝${COLOR.reset}`);
	print("");
}

function progress(percent: number, message: string): void {
	const clamped = Math.max(0, Math.min(100, percent));
	const filled = Math.round((clamped / 100) * PROGRESS_BAR_WIDTH);
	const bar = "█".repeat(filled) + "░".repeat(PROGRESS_BAR_WIDTH - filled);
	print(`${COLOR.gray}[${bar}]${COLOR.reset} ${clamped.toString().padStart(3)}% ${message}`);
}

function ask(question: string, defaultValue?: string): Promise<string> {
	const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
	const suffix = defaultValue ? ` ${COLOR.gray}[${defaultValue}]${COLOR.reset}` : "";

	return new Promise((resolve) => {
		let settled = false;

		const cleanup = (): void => {
			process.off("SIGINT", onSigint);
		};

		const finalize = (value: string): void => {
			if (settled) {
				return;
			}
			settled = true;
			cleanup();
			resolve(value);
		};

		const onSigint = (): void => {
			rl.close();
			print("");
			finalize(defaultValue || "");
		};

		process.once("SIGINT", onSigint);

		rl.question(`${question}${suffix}: `, (answer) => {
			rl.close();
			const value = answer.trim();
			finalize(value || defaultValue || "");
		});
	});
}

async function askBoolean(question: string, defaultYes = true): Promise<boolean> {
	const defaultLabel = defaultYes ? "Y/n" : "y/N";
	const answer = (await ask(`${question} (${defaultLabel})`)).toLowerCase();

	if (!answer) {
		return defaultYes;
	}

	if (["y", "yes"].includes(answer)) {
		return true;
	}

	if (["n", "no"].includes(answer)) {
		return false;
	}

	return defaultYes;
}

async function askChoice(
	question: string,
	options: { label: string; value: string; description?: string }[],
	defaultIndex = 0,
): Promise<string> {
	print(question);
	for (let i = 0; i < options.length; i += 1) {
		const item = options[i];
		const marker = i === defaultIndex ? "*" : " ";
		print(`  ${marker} ${i + 1}. ${item.label}`);
		if (item.description) {
			print(`      ${COLOR.gray}${item.description}${COLOR.reset}`);
		}
	}

	const raw = await ask(`Choose 1-${options.length}`, String(defaultIndex + 1));
	const parsed = Number(raw);

	if (!Number.isInteger(parsed) || parsed < 1 || parsed > options.length) {
		return options[defaultIndex].value;
	}

	return options[parsed - 1].value;
}

async function detectMode(): Promise<Mode | null> {
	const hasHomeInstall = existsSync(join(homedir(), ".opencode"));

	if (!hasHomeInstall) {
		return "fresh";
	}

	const migration = await stepDetectMigration(createFreshState("cli"), () => undefined);
	if (migration.needed) {
		return "migrate";
	}

	const update = await stepDetectUpdate(createFreshState("cli"), () => undefined);
	if (update.needed) {
		return "update";
	}

	return null;
}

async function chooseModeInteractive(autoMode: Mode | null): Promise<Mode | null> {
	if (values.fresh) return "fresh";
	if (values.migrate) return "migrate";
	if (values.update) return "update";

	if (autoMode) {
		printInfo(`Auto-detected mode: ${autoMode}`);
		const useAuto = await askBoolean("Continue with detected mode?", true);
		if (useAuto) {
			return autoMode;
		}
	}

	const choice = await askChoice(
		"Select installation mode:",
		[
			{ label: "Fresh Install", value: "fresh", description: "New PAI-OpenCode setup" },
			{ label: "Migrate v2 -> v3", value: "migrate", description: "Move old skill structure to v3" },
			{ label: "Update v3.x", value: "update", description: "Apply latest installer updates" },
			{ label: "Exit", value: "exit", description: "Do nothing" },
		],
		autoMode ? ["fresh", "migrate", "update"].indexOf(autoMode) : 0,
	);

	if (choice === "exit") {
		return null;
	}

	return choice as Mode;
}

async function runFreshWizard(): Promise<void> {
	print("");
	print(`${COLOR.bold}Fresh Install${COLOR.reset}`);
	print(`${COLOR.gray}────────────────────────────────────────────────────────${COLOR.reset}`);

	const state = createFreshState("cli");

	progress(5, "Checking prerequisites");
	const prereq = await stepPrerequisites(state, progress);

	if (!prereq.git || !prereq.bun) {
		printError("Missing prerequisites.");
		if (!prereq.git) print("  - Install git first");
		if (!prereq.bun) print("  - Install bun first: https://bun.sh/install");
		process.exit(1);
	}

	printSuccess(`Git: ${prereq.gitVersion || "found"}`);
	printSuccess(`Bun: ${prereq.bunVersion || "found"}`);

	const shouldBuild = values["skip-build"]
		? false
		: await askBoolean("Build OpenCode binary from configured source?", true);

	if (shouldBuild) {
		const build = await stepBuildOpenCode(state, progress, false);
		if (!build.success) {
			printError(`OpenCode build failed: ${build.error || "Unknown error"}`);
			const continueWithoutBuild = await askBoolean(
				"Continue without custom build (use existing opencode)?",
				false,
			);
			if (!continueWithoutBuild) {
				process.exit(1);
			}
		}
	} else {
		await stepBuildOpenCode(state, progress, true);
	}

	const providerChoices = (Object.keys(PROVIDER_MODELS) as ProviderName[]).map((provider) => ({
		label: PROVIDER_LABELS[provider].label,
		value: provider,
		description: PROVIDER_LABELS[provider].description,
	}));

	const provider = (await askChoice("Choose AI provider:", providerChoices, 1)) as ProviderName;
	const envCandidates = PROVIDER_ENV_VARS[provider];
	const envKey = envCandidates.map((key) => process.env[key]).find(Boolean)?.trim() || "";
	let apiKey = "";

	if (API_KEY_REQUIRED.has(provider)) {
		const hasEnvKey = envKey.length > 0;
		if (hasEnvKey) {
			printInfo(`Detected ${envCandidates.join("/")} in environment.`);
		}

		apiKey = await ask(
			`Enter ${provider} API key${hasEnvKey ? " (press Enter to use env key)" : ""}`,
			"",
		);
	}

	const chosenApiKey = apiKey.trim() || envKey;
	if (API_KEY_REQUIRED.has(provider) && !chosenApiKey) {
		printError(`Provider ${provider} requires API key.`);
		printInfo(`Set one of: ${envCandidates.join(", ")} or enter it in wizard.`);
		process.exit(1);
	}

	await stepProviderConfig(
		state,
		{ provider, apiKey: chosenApiKey },
		progress,
	);

	const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
	const principalName = await ask("Your name", "User");
	const aiName = await ask("AI assistant name", "PAI");
	const timezone = await ask("Timezone", detectedTimezone);

	await stepIdentity(
		state,
		{
			principalName,
			aiName,
			timezone,
		},
		progress,
	);

	const voiceProvider = await askChoice(
		"Voice setup (optional):",
		[
			{ label: "No voice", value: "none", description: "Text-only notifications" },
			{ label: "Google TTS", value: "google", description: "PAI voice server with Google" },
			{ label: "ElevenLabs", value: "elevenlabs", description: "Premium neural voices" },
			{ label: "macOS", value: "macos", description: "Built-in say voices" },
		],
		0,
	);

	if (voiceProvider === "none") {
		await stepVoice(state, { enabled: false, provider: "none" }, progress);
	} else {
		const voiceApiKey =
			voiceProvider === "google"
				? await ask("Google TTS API key (optional)", "")
				: voiceProvider === "elevenlabs"
					? await ask("ElevenLabs API key (optional)", "")
					: "";
		const voiceId = await ask("Voice ID (optional)", "");

		await stepVoice(
			state,
			{
				enabled: true,
				provider: voiceProvider as "google" | "elevenlabs" | "macos",
				apiKey: voiceApiKey || undefined,
				voiceId: voiceId || undefined,
			},
			progress,
		);
	}

	await stepInstallPAI(state, progress);

	print("");
	printSuccess("Fresh install completed.");
	print("");
	print("Next steps:");
	print("  1. Open a new terminal or source your shell config file");
	print("  2. Run: pai");
	print("  3. Optional: switch provider profiles via switch-provider tool");
}

async function runMigrationWizard(): Promise<void> {
	print("");
	print(`${COLOR.bold}Migration (v2 -> v3)${COLOR.reset}`);
	print(`${COLOR.gray}────────────────────────────────────────────────────────${COLOR.reset}`);

	const state = createFreshState("cli");
	const detection = await stepDetectMigration(state, progress);

	if (!detection.needed) {
		printSuccess(`No migration needed: ${detection.reason || "already v3-compatible"}`);
		return;
	}

	printInfo(`Detected ${detection.flatSkills?.length || 0} flat skill(s) needing migration.`);
	const proceed = await askBoolean("Create backup and migrate now?", true);
	if (!proceed) {
		printWarning("Migration cancelled.");
		return;
	}

	const backupDir = await ask("Backup directory (blank = auto)", "");
	const backup = await stepCreateBackup(state, backupDir, progress);
	if (!backup.success) {
		printError(`Backup failed: ${backup.error || "unknown error"}`);
		process.exit(1);
	}

	printSuccess(`Backup created: ${backup.backupPath}`);

	const dryRun = await askBoolean("Dry run migration only?", false);
	const result = await stepMigrate(state, progress, dryRun);

	if (result.errors.length > 0) {
		printError("Migration reported errors:");
		for (const error of result.errors) {
			print(`  - ${error}`);
		}
		process.exit(1);
	}

	printSuccess(`Migrated ${result.migrated.length} skill(s).`);

	if (!dryRun) {
		const buildBinary = await askBoolean("Build/update OpenCode binary after migration?", true);
		if (buildBinary) {
			const binary = await stepBinaryUpdate(state, progress, false);
			if (!binary.success) {
				printError(`Binary update failed: ${binary.error || "unknown error"}`);
				process.exit(1);
			}
		} else {
			await stepBinaryUpdate(state, progress, true);
		}

		await stepMigrationDone(state, result, progress);
	}

	printSuccess(dryRun ? "Dry-run migration finished." : "Migration completed.");
}

async function runUpdateWizard(): Promise<void> {
	print("");
	print(`${COLOR.bold}Update (v3.x)${COLOR.reset}`);
	print(`${COLOR.gray}────────────────────────────────────────────────────────${COLOR.reset}`);

	const state = createFreshState("cli");
	const detection = await stepDetectUpdate(state, progress);

	if (!detection.needed) {
		printSuccess(detection.reason || "Already up to date.");
		return;
	}

	printInfo(
		`Update available: ${detection.currentVersion || "unknown"} -> ${detection.targetVersion}`,
	);

	const apply = await askBoolean("Apply update now?", true);
	if (!apply) {
		printWarning("Update skipped.");
		return;
	}

	const updateResult = await stepApplyUpdate(state, progress, false);
	if (!updateResult.success) {
		printError(`Update failed: ${updateResult.error || "unknown error"}`);
		process.exit(1);
	}

	await stepUpdateDone(state, updateResult, progress);

	printSuccess(`Update complete. Current version: ${updateResult.newVersion || "unchanged"}`);
	if (updateResult.changesApplied.length > 0) {
		printInfo(`Changes applied: ${updateResult.changesApplied.join(", ")}`);
	}
}

async function main(): Promise<void> {
	if (values.help) {
		showHelp();
		return;
	}

	banner();

	const autoMode = await detectMode();
	if (!autoMode) {
		printInfo("No migration/update needed for existing install.");
		const installAnyway = await askBoolean("Run fresh install anyway?", false);
		if (!installAnyway) {
			printSuccess("Nothing to do.");
			return;
		}
	}

	const selectedMode = await chooseModeInteractive(autoMode || "fresh");
	if (!selectedMode) {
		printSuccess("Installer exited.");
		return;
	}

	switch (selectedMode) {
		case "fresh":
			await runFreshWizard();
			break;
		case "migrate":
			await runMigrationWizard();
			break;
		case "update":
			await runUpdateWizard();
			break;
	}
}

main().catch((error) => {
	printError(`Fatal error: ${error instanceof Error ? error.message : String(error)}`);
	process.exit(1);
});
