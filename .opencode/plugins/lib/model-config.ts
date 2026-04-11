import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileLog } from "./file-logger";

/**
 * PAI Model Configuration Schema
 *
 * Providers:
 * - "zen": OpenCode ZEN free models (no API key required!)
 * - "anthropic": Claude models (requires ANTHROPIC_API_KEY)
 * - "openai": GPT models (requires OPENAI_API_KEY)
 *
 * ZEN Free Models (as of April 2026):
 * - opencode/big-pickle (Free — Zen flagship)
 * - opencode/qwen3.6-plus-free (Free — Qwen 3.6 Plus)
 * - opencode/nemotron-3-super-free (Free — Nemotron 3 Super)
 * - opencode/minimax-m2.5-free (Free — MiniMax M2.5)
 * - opencode/gpt-5-nano (Free)
 *
 * See: https://opencode.ai/docs/zen/ (and /pricing for the authoritative list)
 */
export type PaiProvider = "zen" | "anthropic" | "openai" | "local";

export interface PaiModelConfig {
	model_provider: PaiProvider;
	models: {
		default: string;
		validation: string;
		agents: {
			intern: string;
			architect: string;
			engineer: string;
			explorer: string;
			reviewer: string;
		};
	};
}

const VALID_PROVIDERS: readonly PaiProvider[] = ["zen", "anthropic", "openai", "local"] as const;

/**
 * Provider Presets
 * Default model configurations for each provider
 *
 * ZEN models are FREE and don't require API keys!
 */
const PROVIDER_PRESETS: Record<PaiProvider, PaiModelConfig["models"]> = {
	zen: {
		// Qwen 3.6 Plus Free as default — fast and capable for general coding
		default: "opencode/qwen3.6-plus-free",
		validation: "opencode/qwen3.6-plus-free",
		agents: {
			intern: "opencode/gpt-5-nano", // Free, lightweight, fast
			architect: "opencode/big-pickle", // Zen flagship, best reasoning
			engineer: "opencode/qwen3.6-plus-free", // Capable code-focused free model
			explorer: "opencode/gpt-5-nano", // Fast codebase exploration
			reviewer: "opencode/big-pickle", // Thorough review, heaviest free model
		},
	},
	anthropic: {
		default: "anthropic/claude-sonnet-4-5",
		validation: "anthropic/claude-sonnet-4-5",
		agents: {
			intern: "anthropic/claude-haiku-4-5",
			architect: "anthropic/claude-sonnet-4-5",
			engineer: "anthropic/claude-sonnet-4-5",
			explorer: "anthropic/claude-haiku-4-5",
			reviewer: "anthropic/claude-opus-4-6",
		},
	},
	openai: {
		default: "openai/gpt-5.1",
		validation: "openai/gpt-5.1",
		agents: {
			intern: "openai/gpt-5.1-codex-mini",
			architect: "openai/gpt-5.1",
			engineer: "openai/gpt-5.1-codex",
			explorer: "openai/gpt-5.1-codex-mini",
			reviewer: "openai/gpt-5.1",
		},
	},
	// Local Ollama preset. Mirrors the shipping .opencode/profiles/local.yaml
	// but with sensible defaults — users are expected to override these to
	// match the models they have actually pulled via `ollama pull`.
	local: {
		default: "ollama/qwen3.5:9b",
		validation: "ollama/qwen3.5:9b",
		agents: {
			intern: "ollama/qwen3.5:2b",
			architect: "ollama/qwen3.5:27b",
			engineer: "ollama/qwen3.5:9b",
			explorer: "ollama/qwen3.5:2b",
			reviewer: "ollama/qwen3.5:27b",
		},
	},
};

/**
 * Get the provider preset configuration
 */
export function getProviderPreset(provider: PaiProvider): PaiModelConfig["models"] {
	return PROVIDER_PRESETS[provider];
}

/**
 * Read opencode.json configuration
 * Returns null if file doesn't exist or can't be parsed
 *
 * IMPORTANT: This function searches multiple locations for opencode.json:
 * 1. Parent directory of .opencode (standard location)
 * 2. Current working directory (project root)
 * 3. Inside .opencode directory (fallback)
 */
function readOpencodeConfig(): any | null {
	try {
		// Try multiple locations for opencode.json
		const cwd = process.cwd();
		const possiblePaths = [
			join(dirname(cwd), "opencode.json"), // Parent of .opencode
			join(cwd, "opencode.json"), // Project root (if cwd is project root)
			join(cwd, "..", "opencode.json"), // Up one level
		];

		let configPath: string | null = null;
		for (const path of possiblePaths) {
			if (existsSync(path)) {
				configPath = path;
				break;
			}
		}

		if (!configPath) {
			fileLog(
				"model-config",
				`No opencode.json found in any of: ${possiblePaths.join(", ")}, using defaults`
			);
			return null;
		}

		const content = readFileSync(configPath, "utf-8");
		const config = JSON.parse(content);

		fileLog("model-config", `Loaded opencode.json from ${configPath}`);
		return config;
	} catch (error) {
		fileLog("model-config", `Error reading opencode.json: ${error}`);
		return null;
	}
}

/**
 * Detect provider from model name
 * @example "anthropic/claude-sonnet-4-5" -> "anthropic"
 * @example "openai/gpt-5.1" -> "openai"
 * @example "opencode/kimi-k2.5" -> "zen"
 * @example "ollama/qwen3.5:9b" -> "local"
 */
function detectProviderFromModel(model: string): PaiProvider | null {
	if (model.startsWith("anthropic/")) return "anthropic";
	if (model.startsWith("openai/")) return "openai";
	if (model.startsWith("opencode/")) return "zen";
	// Local Ollama profile uses the `ollama/` prefix. Accept `local/` as an
	// alias so either prefix can appear in `.opencode/profiles/local.yaml`
	// or `opencode.json` without being misdetected as zen.
	if (model.startsWith("ollama/") || model.startsWith("local/")) return "local";
	return null;
}

/**
 * Map from opencode.json `agent` keys (the runtime identifiers written by
 * `switch-provider.ts`) to PAI's canonical preset keys. Multiple candidates
 * are tried per key to be tolerant of case variations and historical names.
 *
 * When `getModelConfig()` merges opencode.json.agent into the preset, it
 * walks this map and uses the first matching opencode agent's model.
 */
const AGENT_KEY_MAP: Record<keyof PaiModelConfig["models"]["agents"], readonly string[]> = {
	intern: ["Intern", "intern"],
	architect: ["Architect", "architect"],
	engineer: ["Engineer", "engineer"],
	explorer: ["explore", "Explore", "explorer"],
	reviewer: ["QATester", "Reviewer", "reviewer"],
};

/**
 * Read per-agent model overrides from opencode.json.agent and layer them
 * on top of a preset's agents map. The opencode.json agent block is the
 * authoritative source of runtime model routing (written by
 * switch-provider.ts and hand-edited by users); PROVIDER_PRESETS is the
 * fallback when a given PAI role is not present in opencode.json.
 *
 * Accepts both shapes written by switch-provider:
 *   { "Engineer": { "model": "..." } }
 *   { "Engineer": { "model": "...", "permission": {...} } }
 */
function mergeOpencodeAgents(
	preset: PaiModelConfig["models"]["agents"],
	opencodeAgents: Record<string, unknown> | undefined
): PaiModelConfig["models"]["agents"] {
	if (!opencodeAgents || typeof opencodeAgents !== "object") return { ...preset };

	const resolved: PaiModelConfig["models"]["agents"] = { ...preset };

	for (const paiKey of Object.keys(AGENT_KEY_MAP) as (keyof typeof AGENT_KEY_MAP)[]) {
		for (const candidate of AGENT_KEY_MAP[paiKey]) {
			const entry = opencodeAgents[candidate];
			if (entry && typeof entry === "object" && "model" in entry) {
				const model = (entry as { model?: unknown }).model;
				if (typeof model === "string" && model.length > 0) {
					resolved[paiKey] = model;
					break; // first match wins
				}
			}
		}
	}

	return resolved;
}

/**
 * Get the full model configuration
 * Reads from opencode.json or uses "zen" defaults
 *
 * Supports multiple configuration formats:
 * 1. Explicit PAI config: { "pai": { "model_provider": "anthropic" } }
 * 2. OpenCode standard: { "model": "anthropic/claude-sonnet-4-5" } - auto-detects provider
 * 3. Per-agent overrides: { "agent": { "Engineer": { "model": "..." } } }
 *    are layered on top of the selected preset.
 * 4. No config: falls back to "zen" free models
 */
export function getModelConfig(): PaiModelConfig {
	const config = readOpencodeConfig();
	const opencodeAgents = (config?.agent ?? undefined) as Record<string, unknown> | undefined;

	// Check for PAI section in config (preferred method)
	const paiConfig = config?.pai;

	if (paiConfig?.model_provider) {
		const raw = paiConfig.model_provider as string;

		// Validate provider
		if (!VALID_PROVIDERS.includes(raw as PaiProvider)) {
			fileLog("model-config", `Invalid provider "${raw}", falling back to zen`);
			return {
				model_provider: "zen",
				models: {
					...PROVIDER_PRESETS.zen,
					agents: mergeOpencodeAgents(PROVIDER_PRESETS.zen.agents, opencodeAgents),
				},
			};
		}

		const provider = raw as PaiProvider;
		const preset = PROVIDER_PRESETS[provider];
		const customModels = paiConfig.models || {};

		// Precedence: explicit customModels > opencode.json.agent > preset.
		const agentsFromOpencode = mergeOpencodeAgents(preset.agents, opencodeAgents);

		const models: PaiModelConfig["models"] = {
			default: customModels.default || config?.model || preset.default,
			validation: customModels.validation || preset.validation,
			agents: {
				intern: customModels.agents?.intern || agentsFromOpencode.intern,
				architect: customModels.agents?.architect || agentsFromOpencode.architect,
				engineer: customModels.agents?.engineer || agentsFromOpencode.engineer,
				explorer: customModels.agents?.explorer || agentsFromOpencode.explorer,
				reviewer: customModels.agents?.reviewer || agentsFromOpencode.reviewer,
			},
		};

		fileLog(
			"model-config",
			`Using provider "${provider}" from pai config with models: ${JSON.stringify(models)}`
		);

		return {
			model_provider: provider,
			models,
		};
	}

	// Fallback: Try to detect provider from "model" field in opencode.json
	// This supports the standard OpenCode config format: { "model": "anthropic/claude-sonnet-4-5" }
	if (config?.model) {
		const detectedProvider = detectProviderFromModel(config.model);
		if (detectedProvider) {
			fileLog(
				"model-config",
				`Auto-detected provider "${detectedProvider}" from model field: ${config.model}`
			);
			const preset = PROVIDER_PRESETS[detectedProvider];
			return {
				model_provider: detectedProvider,
				models: {
					default: config.model,
					validation: preset.validation,
					agents: mergeOpencodeAgents(preset.agents, opencodeAgents),
				},
			};
		}
	}

	// Final fallback: zen defaults, still merged with any opencode.json.agent overrides.
	fileLog("model-config", "No PAI config or model field found, using zen defaults");
	return {
		model_provider: "zen",
		models: {
			...PROVIDER_PRESETS.zen,
			agents: mergeOpencodeAgents(PROVIDER_PRESETS.zen.agents, opencodeAgents),
		},
	};
}

/**
 * Get a specific model by purpose
 * Supports dot notation for nested paths (e.g., "agents.intern")
 */
export function getModel(
	purpose:
		| "default"
		| "validation"
		| "agents.intern"
		| "agents.architect"
		| "agents.engineer"
		| "agents.explorer"
		| "agents.reviewer"
): string {
	const config = getModelConfig();
	const models = config.models;

	// Handle nested paths (agents.*)
	if (purpose.startsWith("agents.")) {
		const agentType = purpose.split(".")[1] as keyof PaiModelConfig["models"]["agents"];
		return models.agents[agentType];
	}

	// Handle top-level paths
	if (purpose === "default" || purpose === "validation") {
		return models[purpose];
	}

	// Fallback to default
	fileLog("model-config", `Unknown purpose "${purpose}", falling back to default`);
	return models.default;
}

/**
 * Get all agent models as a map
 */
export function getAgentModels(): Record<string, string> {
	const config = getModelConfig();
	return config.models.agents;
}

/**
 * Check if API key is required for current provider
 */
export function requiresApiKey(): boolean {
	const config = getModelConfig();
	return config.model_provider !== "zen";
}

/**
 * Get the current provider name
 */
export function getProvider(): PaiProvider {
	const config = getModelConfig();
	return config.model_provider;
}
