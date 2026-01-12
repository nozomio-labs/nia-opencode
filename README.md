# nia-opencode

OpenCode plugin that integrates [Nia Knowledge Agent](https://trynia.ai) for research, documentation, and codebase exploration.

## Features

- **Keyword Detection**: Automatically detects research-related queries and prompts the agent to use Nia tools
- **MCP Integration**: Connects to Nia's MCP server for semantic search, documentation indexing, and AI research
- **Zero Config**: Works out of the box with automatic MCP server setup

## Installation

```bash
bunx nia-opencode@latest install
```

The installer will:
1. Prompt for your Nia API key
2. Create `~/.config/opencode/nia.json` with your config
3. Add the plugin and MCP server to your OpenCode config

### Non-Interactive Installation

```bash
bunx nia-opencode@latest install --no-tui --api-key nk_your_api_key
```

### Manual Setup

1. Add to your `~/.config/opencode/opencode.json`:

```json
{
  "plugin": ["nia-opencode@latest"],
  "mcp": {
    "nia": {
      "type": "remote",
      "url": "https://apigcp.trynia.ai/mcp",
      "headers": {
        "Authorization": "Bearer nk_your_api_key"
      },
      "oauth": false
    }
  }
}
```

2. Set your API key (choose one):

**Environment variable:**
```bash
export NIA_API_KEY="nk_your_api_key"
```

**Config file** (`~/.config/opencode/nia.json`):
```json
{
  "apiKey": "nk_your_api_key"
}
```

## Usage

Once installed, the plugin automatically detects research-related queries and prompts the agent to use Nia tools.

### Trigger Keywords

The plugin activates when you say things like:
- "Research how React hooks work"
- "Look up the Next.js documentation"
- "Search the codebase for authentication"
- "Find docs for Prisma migrations"
- "Grep for error handling patterns"
- "Index this repo"

### Available Nia Tools

When triggered, the agent has access to:

| Tool | Description |
|------|-------------|
| `nia.search` | Semantic search across indexed repos, docs, papers |
| `nia.nia_research` | Web search (quick) or deep AI research (deep/oracle) |
| `nia.index` | Index GitHub repos, docs sites, or arXiv papers |
| `nia.nia_read` | Read files from indexed sources |
| `nia.nia_grep` | Regex search across codebases |
| `nia.nia_explore` | Browse file trees |
| `nia.manage_resource` | List/manage indexed sources |

## Configuration

### `~/.config/opencode/nia.json`

```json
{
  "apiKey": "nk_...",
  "mcpUrl": "https://apigcp.trynia.ai/mcp",
  "keywords": {
    "enabled": true,
    "patterns": [
      "my custom pattern"
    ]
  }
}
```

### Options

| Option | Default | Description |
|--------|---------|-------------|
| `apiKey` | - | Your Nia API key |
| `mcpUrl` | `https://apigcp.trynia.ai/mcp` | MCP server URL |
| `keywords.enabled` | `true` | Enable/disable keyword detection |
| `keywords.patterns` | `[]` | Additional regex patterns to trigger Nia |

## Debugging

Enable debug logging:

```bash
NIA_DEBUG=true opencode
```

## Get Your API Key

Get your Nia API key at [app.trynia.ai](https://app.trynia.ai)

## License

MIT
