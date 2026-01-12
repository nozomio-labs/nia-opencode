import { CONFIG } from "./config.js";

const CODE_BLOCK_PATTERN = /```[\s\S]*?```/g;
const INLINE_CODE_PATTERN = /`[^`]+`/g;

const RESEARCH_PATTERNS = [
  /\b(research|look\s*up|find\s*docs?)\b/i,
  /\b(search\s+for|search\s+codebase|search\s+repo|search\s+docs?)\b/i,
  /\b(grep\s+for|grep\s+in)\b/i,
  /\b(index\s+(this\s+)?repo|add\s+to\s+nia)\b/i,
  /\b(what\s+is|how\s+does|explain)\s+\w+\s+(library|package|framework|module)/i,
  /\bcheck\s+(the\s+)?(docs?|documentation)\s+(for|about|on)\b/i,
  /\bfind\s+(examples?|usage)\s+(of|for)\b/i,
];

const SAVE_PATTERNS = [
  /\b(save\s+(this\s+)?(context|conversation|session|chat))\b/i,
  /\b(continue\s+(this\s+)?(later|tomorrow|in\s+\w+))\b/i,
  /\b(pick\s+(this\s+)?up\s+(later|tomorrow|in\s+\w+))\b/i,
  /\b(hand\s*off|switch(ing)?\s+to)\s+(cursor|claude|windsurf|copilot|another\s+agent)\b/i,
  /\b(save\s+for\s+later|bookmark\s+this)\b/i,
  /\b(preserve|store)\s+(this\s+)?(context|conversation|session)\b/i,
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

export type KeywordType = "research" | "save" | null;

export function detectKeyword(text: string): { type: KeywordType; match?: string } {
  if (!CONFIG.keywords.enabled) {
    return { type: null };
  }

  const textWithoutCode = removeCodeBlocks(text);

  // Check save patterns first (more specific)
  for (const pattern of SAVE_PATTERNS) {
    const match = textWithoutCode.match(pattern);
    if (match) {
      return { type: "save", match: match[0] };
    }
  }

  // Check research patterns
  const researchPatterns = [...RESEARCH_PATTERNS, ...compileCustomPatterns()];
  for (const pattern of researchPatterns) {
    const match = textWithoutCode.match(pattern);
    if (match) {
      return { type: "research", match: match[0] };
    }
  }

  return { type: null };
}

// Backwards compatibility
export function detectResearchKeyword(text: string): { detected: boolean; match?: string } {
  const result = detectKeyword(text);
  return { detected: result.type === "research", match: result.match };
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

export const NIA_SAVE_NUDGE_MESSAGE = `[NIA CONTEXT SAVE TRIGGER]
The user wants to save this conversation to continue later or hand off to another agent.

**Use \`nia.context\` to save:**
\`\`\`
nia.context({
  action: "save",
  title: "Brief title describing this session",
  summary: "What was accomplished and what's pending",
  content: "Key decisions, code snippets, and important context",
  tags: ["relevant", "tags"],
  edited_files: [{ path: "file/path.ts", action: "modified" }]
})
\`\`\`

**What to include:**
- Summary of what was discussed/accomplished
- Key decisions made
- Code snippets or plans created
- Files that were edited
- Next steps or pending tasks
- Any Nia sources that were referenced

This context can be loaded in Cursor, Claude Code, Windsurf, or any agent with Nia access.`;
