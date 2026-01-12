#!/usr/bin/env node
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import * as readline from "node:readline";

const OPENCODE_CONFIG_DIR = join(homedir(), ".config", "opencode");
const NIA_CONFIG_PATH = join(OPENCODE_CONFIG_DIR, "nia.json");
const AGENTS_MD_PATH = join(OPENCODE_CONFIG_DIR, "AGENTS.md");
const PLUGIN_NAME = "nia-opencode@latest";

const NIA_AGENTS_INSTRUCTIONS = `
# How to use Nia

Nia provides tools for indexing and searching external repositories, research papers, local folders, documentation, packages, and performing AI-powered research. Its primary goal is to reduce hallucinations in LLMs and provide up-to-date context for AI agents.

## Deterministic Workflow

1. Check if the source is already indexed using manage_resource (when listing sources, use targeted query to save tokens since users can have multiple sources indexed) or check any nia.md files for already indexed sources.
2. If it is indexed, check the tree of the source or ls relevant directories.
3. After getting the grasp of the structure (tree), use 'search', 'nia_grep', 'nia_read' for targeted searches.
4. If helpful, use the context tool to save your research findings to make them reusable for future conversations.
5. Save your findings in an .md file to track: source indexed, used, its ID, and link so you won't have to list sources in the future and can get straight to work.

## Notes

- DO NOT USE WEB RESEARCH TOOLS IF INFORMATION IS INDEXED IN NIA BY USING 'manage_resource' tool.
- If the source isn't indexed, index it. Note that for docs you should always index the root link like docs.stripe.com so it will always scrape all pages.
- If you need to index something but don't know the link for that source, use nia_research (quick or deep modes).
- Once you use the index tool, do not expect it to finish in 1-3 seconds. Stop your work or do something that will make your work pause for 1-5 minutes until the source is indexed, then run manage_resource again to check its status. You can also prompt the user to wait if needed.
`;

function stripJsoncComments(content: string): string {
  return content
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");
}

function createReadline(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

async function confirm(rl: readline.Interface, question: string): Promise<boolean> {
  return new Promise((resolve) => {
    rl.question(`${question} (y/n) `, (answer) => {
      resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
    });
  });
}

async function prompt(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

function findOpencodeConfig(): string | null {
  const candidates = [
    join(OPENCODE_CONFIG_DIR, "opencode.jsonc"),
    join(OPENCODE_CONFIG_DIR, "opencode.json"),
  ];

  for (const path of candidates) {
    if (existsSync(path)) {
      return path;
    }
  }

  return null;
}

function addPluginToConfig(configPath: string): boolean {
  try {
    const content = readFileSync(configPath, "utf-8");

    if (content.includes("nia-opencode")) {
      console.log("  Plugin already registered in config");
      return true;
    }

    const jsonContent = stripJsoncComments(content);
    let config: Record<string, unknown>;

    try {
      config = JSON.parse(jsonContent);
    } catch {
      console.error("  Failed to parse config file");
      return false;
    }

    const plugins = (config.plugin as string[]) || [];
    plugins.push(PLUGIN_NAME);
    config.plugin = plugins;

    if (configPath.endsWith(".jsonc")) {
      if (content.includes('"plugin"')) {
        const newContent = content.replace(
          /("plugin"\s*:\s*\[)([^\]]*?)(\])/,
          (_match, start, middle, end) => {
            const trimmed = middle.trim();
            if (trimmed === "") {
              return `${start}\n    "${PLUGIN_NAME}"\n  ${end}`;
            }
            return `${start}${middle.trimEnd()},\n    "${PLUGIN_NAME}"\n  ${end}`;
          }
        );
        writeFileSync(configPath, newContent);
      } else {
        const newContent = content.replace(
          /^(\s*\{)/,
          `$1\n  "plugin": ["${PLUGIN_NAME}"],`
        );
        writeFileSync(configPath, newContent);
      }
    } else {
      writeFileSync(configPath, JSON.stringify(config, null, 2));
    }

    console.log(`  Added plugin to ${configPath}`);
    return true;
  } catch (err) {
    console.error("  Failed to update config:", err);
    return false;
  }
}

function addMcpServerToConfig(configPath: string, apiKey: string): boolean {
  try {
    const content = readFileSync(configPath, "utf-8");
    const jsonContent = stripJsoncComments(content);
    let config: Record<string, unknown>;

    try {
      config = JSON.parse(jsonContent);
    } catch {
      console.error("  Failed to parse config file");
      return false;
    }

    const mcp = (config.mcp as Record<string, unknown>) || {};

    if (mcp.nia) {
      console.log("  MCP server 'nia' already configured");
      return true;
    }

    mcp.nia = {
      type: "remote",
      url: "https://apigcp.trynia.ai/mcp",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      oauth: false,
    };

    config.mcp = mcp;

    writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log("  Added MCP server 'nia' to config");
    return true;
  } catch (err) {
    console.error("  Failed to add MCP server:", err);
    return false;
  }
}

function createNewConfig(apiKey: string): boolean {
  mkdirSync(OPENCODE_CONFIG_DIR, { recursive: true });

  const configPath = join(OPENCODE_CONFIG_DIR, "opencode.json");
  const config = {
    plugin: [PLUGIN_NAME],
    mcp: {
      nia: {
        type: "remote",
        url: "https://apigcp.trynia.ai/mcp",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        oauth: false,
      },
    },
  };

  writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(`  Created ${configPath}`);
  return true;
}

function createNiaConfig(apiKey: string): boolean {
  mkdirSync(OPENCODE_CONFIG_DIR, { recursive: true });

  const config = {
    apiKey,
    keywords: {
      enabled: true,
    },
  };

  writeFileSync(NIA_CONFIG_PATH, JSON.stringify(config, null, 2));
  console.log(`  Created ${NIA_CONFIG_PATH}`);
  return true;
}

function updateAgentsMd(): boolean {
  mkdirSync(OPENCODE_CONFIG_DIR, { recursive: true });

  try {
    if (existsSync(AGENTS_MD_PATH)) {
      const content = readFileSync(AGENTS_MD_PATH, "utf-8");

      if (content.includes("# How to use Nia")) {
        console.log("  Nia instructions already in AGENTS.md");
        return true;
      }

      const newContent = content.trimEnd() + "\n\n" + NIA_AGENTS_INSTRUCTIONS.trim() + "\n";
      writeFileSync(AGENTS_MD_PATH, newContent);
      console.log("  Appended Nia instructions to AGENTS.md");
    } else {
      writeFileSync(AGENTS_MD_PATH, NIA_AGENTS_INSTRUCTIONS.trim() + "\n");
      console.log(`  Created ${AGENTS_MD_PATH} with Nia instructions`);
    }
    return true;
  } catch (err) {
    console.error("  Failed to update AGENTS.md:", err);
    return false;
  }
}

interface InstallOptions {
  tui: boolean;
  apiKey?: string;
}

async function install(options: InstallOptions): Promise<number> {
  console.log("\n Nia OpenCode Plugin Installer\n");

  const rl = options.tui ? createReadline() : null;

  // Step 1: Get API key
  console.log("Step 1: Configure API Key");
  let apiKey = options.apiKey || process.env.NIA_API_KEY || "";

  if (!apiKey && options.tui && rl) {
    console.log("Get your API key from: https://app.trynia.ai\n");
    apiKey = await prompt(rl, "Enter your Nia API key (nk_...): ");
  }

  if (!apiKey) {
    console.log("  No API key provided. You can set NIA_API_KEY environment variable later.");
    console.log("  Get your API key at: https://trynia.ai/api-keys\n");
  } else if (!apiKey.startsWith("nk_")) {
    console.log("  Warning: API key should start with 'nk_'");
  } else {
    console.log("  API key configured");
  }

  // Step 2: Create Nia config file
  console.log("\nStep 2: Create Nia Config");
  if (apiKey) {
    createNiaConfig(apiKey);
  } else {
    console.log("  Skipped (no API key)");
  }

  // Step 3: Register plugin and MCP server in OpenCode config
  console.log("\nStep 3: Configure OpenCode");
  const configPath = findOpencodeConfig();

  if (configPath) {
    if (options.tui && rl) {
      const shouldModify = await confirm(rl, `Modify ${configPath}?`);
      if (shouldModify) {
        addPluginToConfig(configPath);
        if (apiKey) {
          addMcpServerToConfig(configPath, apiKey);
        }
      } else {
        console.log("  Skipped.");
      }
    } else {
      addPluginToConfig(configPath);
      if (apiKey) {
        addMcpServerToConfig(configPath, apiKey);
      }
    }
  } else {
    if (options.tui && rl) {
      const shouldCreate = await confirm(rl, "No OpenCode config found. Create one?");
      if (shouldCreate && apiKey) {
        createNewConfig(apiKey);
      } else {
        console.log("  Skipped.");
      }
    } else if (apiKey) {
      createNewConfig(apiKey);
    }
  }

  // Step 4: Add Nia instructions to AGENTS.md
  console.log("\nStep 4: Add Nia Instructions to AGENTS.md");
  if (options.tui && rl) {
    const shouldUpdate = await confirm(rl, "Add Nia usage instructions to ~/.config/opencode/AGENTS.md?");
    if (shouldUpdate) {
      updateAgentsMd();
    } else {
      console.log("  Skipped.");
    }
  } else {
    updateAgentsMd();
  }

  // Summary
  console.log("\n" + "-".repeat(50));
  console.log("\n Setup Complete!\n");

  if (!apiKey) {
    console.log("Next steps:");
    console.log("1. Get your API key from: https://app.trynia.ai");
    console.log("2. Set the environment variable:");
    console.log('   export NIA_API_KEY="nk_..."');
    console.log("   Or edit ~/.config/opencode/nia.json");
  } else {
    console.log("Nia is configured and ready to use!");
  }

  console.log("\nKeyword triggers enabled:");
  console.log('  - "research...", "look up...", "find docs..."');
  console.log('  - "search codebase...", "grep for..."');
  console.log('  - "index this repo", "add to nia"');

  console.log("\nRestart OpenCode to activate the plugin.\n");

  if (rl) rl.close();
  return 0;
}

function printHelp(): void {
  console.log(`
nia-opencode - Nia Knowledge Agent plugin for OpenCode

Commands:
  install                Install and configure the plugin
    --no-tui             Non-interactive mode
    --api-key <key>      Provide API key directly

Examples:
  bunx nia-opencode@latest install
  bunx nia-opencode@latest install --no-tui --api-key nk_xxx
`);
}

const args = process.argv.slice(2);

if (args.length === 0 || args[0] === "help" || args[0] === "--help" || args[0] === "-h") {
  printHelp();
  process.exit(0);
}

if (args[0] === "install") {
  const noTui = args.includes("--no-tui");
  const apiKeyIndex = args.indexOf("--api-key");
  const apiKey = apiKeyIndex !== -1 ? args[apiKeyIndex + 1] : undefined;

  install({ tui: !noTui, apiKey }).then((code) => process.exit(code));
} else {
  console.error(`Unknown command: ${args[0]}`);
  printHelp();
  process.exit(1);
}
