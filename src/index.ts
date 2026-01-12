import type { Plugin, PluginInput } from "@opencode-ai/plugin";
import type { Part } from "@opencode-ai/sdk";

import { isConfigured } from "./config.js";
import { detectResearchKeyword, NIA_NUDGE_MESSAGE } from "./keywords.js";
import { log } from "./services/logger.js";

export const NiaPlugin: Plugin = async (ctx: PluginInput) => {
  const { directory } = ctx;
  const injectedSessions = new Set<string>();

  log("Plugin initialized", { directory, configured: isConfigured() });

  if (!isConfigured()) {
    log("Plugin disabled - NIA_API_KEY not set");
  }

  return {
    "chat.message": async (input, output) => {
      if (!isConfigured()) return;

      const start = Date.now();

      try {
        const textParts = output.parts.filter(
          (p): p is Part & { type: "text"; text: string } => p.type === "text"
        );

        if (textParts.length === 0) {
          log("chat.message: no text parts found");
          return;
        }

        const userMessage = textParts.map((p) => p.text).join("\n");

        if (!userMessage.trim()) {
          log("chat.message: empty message, skipping");
          return;
        }

        log("chat.message: processing", {
          messagePreview: userMessage.slice(0, 100),
          partsCount: output.parts.length,
        });

        const { detected, match } = detectResearchKeyword(userMessage);

        if (detected) {
          log("chat.message: research keyword detected", { match });

          const nudgePart: Part = {
            id: `nia-nudge-${Date.now()}`,
            sessionID: input.sessionID,
            messageID: output.message.id,
            type: "text",
            text: NIA_NUDGE_MESSAGE,
            synthetic: true,
          };

          output.parts.push(nudgePart);

          const duration = Date.now() - start;
          log("chat.message: nudge injected", { duration, match });
        }
      } catch (error) {
        log("chat.message: ERROR", { error: String(error) });
      }
    },
  };
};

export default NiaPlugin;
