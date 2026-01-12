import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const CONFIG_DIR = join(homedir(), ".config", "opencode");
const CONFIG_FILES = [
  join(CONFIG_DIR, "nia.jsonc"),
  join(CONFIG_DIR, "nia.json"),
];

interface NiaConfig {
  apiKey?: string;
  mcpUrl?: string;
  keywords?: {
    enabled?: boolean;
    patterns?: string[];
  };
}

const DEFAULTS = {
  mcpUrl: "https://apigcp.trynia.ai/mcp",
  keywords: {
    enabled: true,
    patterns: [],
  },
};

function stripJsoncComments(content: string): string {
  return content
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");
}

function loadConfig(): NiaConfig {
  for (const path of CONFIG_FILES) {
    if (existsSync(path)) {
      try {
        const content = readFileSync(path, "utf-8");
        const json = stripJsoncComments(content);
        return JSON.parse(json) as NiaConfig;
      } catch {
        // Invalid config, continue to next
      }
    }
  }
  return {};
}

const fileConfig = loadConfig();

export const NIA_API_KEY = fileConfig.apiKey ?? process.env.NIA_API_KEY;
export const NIA_MCP_URL = fileConfig.mcpUrl ?? process.env.NIA_MCP_URL ?? DEFAULTS.mcpUrl;

export const CONFIG = {
  mcpUrl: NIA_MCP_URL,
  keywords: {
    enabled: fileConfig.keywords?.enabled ?? DEFAULTS.keywords.enabled,
    customPatterns: fileConfig.keywords?.patterns ?? [],
  },
};

export function isConfigured(): boolean {
  return !!NIA_API_KEY;
}

export function getConfigDir(): string {
  return CONFIG_DIR;
}
