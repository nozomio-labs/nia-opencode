import { CONFIG } from "./config.js";

const CODE_BLOCK_PATTERN = /```[\s\S]*?```/g;
const INLINE_CODE_PATTERN = /`[^`]+`/g;

const DEFAULT_PATTERNS = [
  /\b(research|look\s*up|find\s*docs?)\b/i,
  /\b(search\s+for|search\s+codebase|search\s+repo|search\s+docs?)\b/i,
  /\b(grep\s+for|grep\s+in)\b/i,
  /\b(index\s+(this\s+)?repo|add\s+to\s+nia)\b/i,
  /\b(what\s+is|how\s+does|explain)\s+\w+\s+(library|package|framework|module)/i,
  /\bcheck\s+(the\s+)?(docs?|documentation)\s+(for|about|on)\b/i,
  /\bfind\s+(examples?|usage)\s+(of|for)\b/i,
];

function removeCodeBlocks(text: string): string {
  return text.replace(CODE_BLOCK_PATTERN, "").replace(INLINE_CODE_PATTERN, "");
}

function compileCustomPatterns(): RegExp[] {
  return CONFIG.keywords.customPatterns
    .map((pattern) => {
      try {
        return new RegExp(pattern, "i");
      } catch {
        return null;
      }
    })
    .filter((p): p is RegExp => p !== null);
}

export function detectResearchKeyword(text: string): { detected: boolean; match?: string } {
  if (!CONFIG.keywords.enabled) {
    return { detected: false };
  }

  const textWithoutCode = removeCodeBlocks(text);
  const allPatterns = [...DEFAULT_PATTERNS, ...compileCustomPatterns()];

  for (const pattern of allPatterns) {
    const match = textWithoutCode.match(pattern);
    if (match) {
      return { detected: true, match: match[0] };
    }
  }

  return { detected: false };
}

export const NIA_NUDGE_MESSAGE = `[NIA KNOWLEDGE TRIGGER]
The user is asking for research, documentation, or codebase exploration. You have access to **Nia** tools via MCP.

**Available Nia tools:**
- \`nia.search\` - Semantic search across indexed repos, docs, and papers
- \`nia.nia_research\` - Web search (quick) or deep AI research (deep/oracle modes)
- \`nia.index\` - Index new GitHub repos, documentation sites, or arXiv papers
- \`nia.nia_read\` - Read specific files from indexed sources
- \`nia.nia_grep\` - Regex search across indexed codebases
- \`nia.nia_explore\` - Browse file trees of indexed repos/docs
- \`nia.manage_resource\` - List/check status of indexed sources

**Workflow:**
1. Check what's indexed: \`nia.manage_resource(action: "list")\`
2. Search or research based on the user's question
3. Read specific files if needed for deeper context

Use these tools to provide accurate, up-to-date information instead of relying solely on training data.`;
