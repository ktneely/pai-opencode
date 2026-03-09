#!/usr/bin/env bun
/**
 * PAI-OpenCode Installer — Fresh Install Steps
 * 
 * 7-step fresh installation flow with OpenCode-Zen as default provider.
 */

import type { InstallState } from "./types";
import { buildOpenCodeBinary } from "./build-opencode";
import type { BuildResult } from "./build-opencode";
import { existsSync, mkdirSync, writeFileSync, chmodSync, copyFileSync, symlinkSync, unlinkSync, lstatSync, realpathSync } from "node:fs";
import { join, resolve } from "node:path";
import { homedir } from "node:os";

// ═══════════════════════════════════════════════════════════
// Step 1: Welcome
// ═══════════════════════════════════════════════════════════

export async function stepWelcome(
	state: InstallState,
	onProgress: (percent: number, message: string) => void
): Promise<void> {
	onProgress(0, "Welcome to PAI-OpenCode!");
	
	// Show welcome screen — no actual work here
	// UI will display value proposition and next steps
	
	await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate UI delay
}

// ═══════════════════════════════════════════════════════════
// Step 2: Prerequisites
// ═══════════════════════════════════════════════════════════

export interface PrerequisitesResult {
	git: boolean;
	bun: boolean;
	gitVersion?: string;
	bunVersion?: string;
}

export async function stepPrerequisites(
	state: InstallState,
	onProgress: (percent: number, message: string) => void
): Promise<PrerequisitesResult> {
	onProgress(10, "Checking prerequisites...");
	
	const result: PrerequisitesResult = {
		git: false,
		bun: false,
	};
	
	// Check git
	try {
		const { stdout } = await exec("git --version");
		result.git = true;
		result.gitVersion = stdout.trim();
	} catch {
		result.git = false;
	}
	
	// Check bun
	try {
		const { stdout } = await exec("bun --version");
		result.bun = true;
		result.bunVersion = stdout.trim();
	} catch {
		result.bun = false;
	}
	
	// If missing, UI should offer to install
	// This function just reports — installation handled by UI
	
	return result;
}

// ═══════════════════════════════════════════════════════════
// Step 3: Build OpenCode Binary
// ═══════════════════════════════════════════════════════════

export async function stepBuildOpenCode(
	state: InstallState,
	onProgress: (percent: number, message: string) => void,
	skipBuild: boolean = false
): Promise<BuildResult> {
	if (skipBuild) {
		onProgress(70, "Skipped OpenCode build — using standard version");
		return {
			success: true,
			skipped: true,
			binaryPath: "/usr/local/bin/opencode", // Homebrew path
		};
	}
	
	// Progress range: 10% → 70%
	const buildResult = await buildOpenCodeBinary({
		onProgress: (message, percent) => {
			// Map build progress (10-100) to step progress (10-70)
			const mappedPercent = 10 + (percent * 0.6);
			onProgress(Math.round(mappedPercent), message);
		},
		skipIfExists: true,
	});
	
	return buildResult;
}

// ═══════════════════════════════════════════════════════════
// Step 4: AI Provider Configuration
// ═══════════════════════════════════════════════════════════

export interface ProviderConfig {
	provider: "zen" | "anthropic" | "openrouter" | "openai";
	apiKey: string;
	modelTier: "quick" | "standard" | "advanced";
	models: {
		quick: string;
		standard: string;
		advanced: string;
	};
}

export const ZEN_FREE_MODELS = {
	quick: "minimax-m2.5-free", // FREE
	standard: "gpt-5.1-codex-mini", // $0.25/M
	advanced: "claude-haiku-3.5", // $0.80/M
};

export const ANTHROPIC_MODELS = {
	quick: "claude-haiku-3.5",
	standard: "claude-sonnet-4.6",
	advanced: "claude-opus-4.6",
};

export async function stepProviderConfig(
	state: InstallState,
	config: ProviderConfig,
	onProgress: (percent: number, message: string) => void
): Promise<void> {
	onProgress(75, "Configuring AI provider...");
	
	// Save provider settings
	state.collected.provider = config.provider;
	state.collected.apiKey = config.apiKey;
	state.collected.modelTier = config.modelTier;
	state.collected.models = config.models;
	
	// API key will be saved to .env by config generation step
}

// ═══════════════════════════════════════════════════════════
// Step 5: Identity
// ═══════════════════════════════════════════════════════════

export interface IdentityConfig {
	principalName: string;
	aiName: string;
	timezone: string;
}

export async function stepIdentity(
	state: InstallState,
	config: IdentityConfig,
	onProgress: (percent: number, message: string) => void
): Promise<void> {
	onProgress(80, "Setting up identity...");
	
	state.collected.principalName = config.principalName;
	state.collected.aiName = config.aiName;
	state.collected.timezone = config.timezone;
}

// ═══════════════════════════════════════════════════════════
// Step 6: Voice Setup (Optional)
// ═══════════════════════════════════════════════════════════

export interface VoiceConfig {
	enabled: boolean;
	provider?: "elevenlabs" | "macos" | "none";
	apiKey?: string;
	voiceId?: string;
}

export async function stepVoice(
	state: InstallState,
	config: VoiceConfig,
	onProgress: (percent: number, message: string) => void
): Promise<void> {
	onProgress(85, "Configuring voice...");
	
	state.collected.voiceEnabled = config.enabled;
	state.collected.voiceProvider = config.provider || "none";
	state.collected.elevenLabsKey = config.apiKey;
	state.collected.voiceId = config.voiceId;
}

// ═══════════════════════════════════════════════════════════
// Step 7: Install PAI Files
// ═══════════════════════════════════════════════════════════

export async function stepInstallPAI(
	state: InstallState,
	onProgress: (percent: number, message: string) => void
): Promise<void> {
	onProgress(90, "Installing PAI-OpenCode files...");
	
	// Install location: current working directory (where install.sh was run)
	const installDir = process.cwd();
	const localOpencodeDir = join(installDir, ".opencode");
	const toolsDir = join(localOpencodeDir, "tools");
	const globalOpencodeLink = join(homedir(), ".opencode");
	
	// Create local .opencode directory structure
	mkdirSync(localOpencodeDir, { recursive: true });
	mkdirSync(toolsDir, { recursive: true });
	onProgress(92, "Created local directory structure...");
	
	// Generate settings.json
	const settings = {
		principal: {
			name: state.collected.principalName || "User",
			timezone: state.collected.timezone || "UTC",
		},
		daidentity: {
			name: state.collected.aiName || "PAI",
			voice: {
				enabled: state.collected.voiceEnabled || false,
				provider: state.collected.voiceProvider || "none",
				voiceId: state.collected.voiceId || "default",
			},
		},
		providers: {
			default: state.collected.provider || "zen",
			[state.collected.provider || "zen"]: {
				apiKey: state.collected.apiKey || "",
				modelTier: state.collected.modelTier || "standard",
				models: state.collected.models || [],
			},
		},
	};
	writeFileSync(
		join(localOpencodeDir, "settings.json"),
		JSON.stringify(settings, null, 2)
	);
	onProgress(94, "Generated settings.json...");
	
	// Generate opencode.json
	const opencode = {
		ai: {
			name: state.collected.aiName || "PAI",
			model: "anthropic/claude-opus-4-6",
		},
		voice: {
			enabled: state.collected.voiceEnabled || false,
			provider: state.collected.voiceProvider || "none",
			voiceId: state.collected.voiceId || "default",
		},
		memory: {
			enabled: true,
		},
		skills: {
			autoLoad: true,
		},
	};
	writeFileSync(
		join(localOpencodeDir, "opencode.json"),
		JSON.stringify(opencode, null, 2)
	);
	onProgress(96, "Generated opencode.json...");
	
	// Create symlink from ~/.opencode to local .opencode
	onProgress(98, "Creating symlink ~/.opencode → ./.opencode...");
	
	try {
		// Check if ~/.opencode exists
		if (existsSync(globalOpencodeLink)) {
			const stats = lstatSync(globalOpencodeLink);
			
			if (stats.isSymbolicLink()) {
				// It's already a symlink - check if it points to our location
				const currentTarget = realpathSync(globalOpencodeLink);
				if (currentTarget !== localOpencodeDir) {
					// Remove old symlink and create new one
					unlinkSync(globalOpencodeLink);
					symlinkSync(localOpencodeDir, globalOpencodeLink, "dir");
				}
				// If it already points to our location, nothing to do
			} else if (stats.isDirectory()) {
				// It's a real directory - backup and replace with symlink
				const backupPath = `${globalOpencodeLink}.backup-${Date.now()}`;
				// Note: In production, this would need proper backup logic
				// For now, we just warn and don't overwrite
				throw new Error(
					`~/.opencode is a directory (not a symlink). ` +
					`Please backup and remove it manually, then re-run the installer.`
				);
			}
		} else {
			// No ~/.opencode exists - create symlink
			symlinkSync(localOpencodeDir, globalOpencodeLink, "dir");
		}
	} catch (error) {
		// Log error but don't fail - user can fix manually or wrapper can assist
		console.error(`Warning: Could not create symlink: ${error}`);
		console.error(`You can manually create it with: ln -s ${localOpencodeDir} ~/.opencode`);
	}
	
	onProgress(100, "Installation complete!");
}

// ═══════════════════════════════════════════════════════════
// Orchestrator: Fresh Install Flow
// ═══════════════════════════════════════════════════════════

export async function runFreshInstall(
  state: InstallState,
  emit: (event: any) => Promise<void>,
  requestInput: (id: string, prompt: string, type: "text" | "password" | "key", placeholder?: string) => Promise<string>,
  requestChoice: (id: string, prompt: string, choices: { label: string; value: string; description?: string }[]) => Promise<string>
): Promise<void> {
  // Step 1: Welcome / System Detection
  emit({ event: "step_start", step: "system-detect" });
  const { detectSystem } = await import("./detect");
  state.detection = detectSystem();
  emit({ event: "step_complete", step: "system-detect" });

  // Step 2: Prerequisites
  emit({ event: "step_start", step: "prerequisites" });
  await stepPrerequisites(state, (percent, message) => {
    emit({ event: "progress", step: "prerequisites", percent, detail: message });
  });
  emit({ event: "step_complete", step: "prerequisites" });

  // Step 3: Provider Configuration (API Keys)
  emit({ event: "step_start", step: "api-keys" });
  await stepProviderConfig(state, requestChoice, requestInput, (message) => {
    emit({ event: "message", content: message });
  });
  emit({ event: "step_complete", step: "api-keys" });

  // Step 4: Identity
  emit({ event: "step_start", step: "identity" });
  await stepIdentity(state, requestInput, (message) => {
    emit({ event: "message", content: message });
  });
  emit({ event: "step_complete", step: "identity" });

  // Step 5: Build OpenCode
  emit({ event: "step_start", step: "repository" });
  const { buildOpenCodeBinary } = await import("./build-opencode");
  await buildOpenCodeBinary(
    { cacheBust: true },
    (percent, message) => {
      emit({ event: "progress", step: "repository", percent, detail: message });
    },
    () => Promise.resolve(false) // No skip for now
  );
  emit({ event: "step_complete", step: "repository" });

  // Step 6: Voice Setup
  emit({ event: "step_start", step: "voice" });
  await stepVoice(state, requestChoice, requestInput, (message) => {
    emit({ event: "message", content: message });
  });
  emit({ event: "step_complete", step: "voice" });

  // Step 7: Install PAI
  emit({ event: "step_start", step: "configuration" });
  await stepInstallPAI(state, (percent, message) => {
    emit({ event: "progress", step: "configuration", percent, detail: message });
  });
  emit({ event: "step_complete", step: "configuration" });
}

// ═══════════════════════════════════════════════════════════
// Helper
// ═══════════════════════════════════════════════════════════

import { exec as execCallback } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execCallback);
