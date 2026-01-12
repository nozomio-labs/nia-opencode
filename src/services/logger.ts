const DEBUG = process.env.NIA_DEBUG === "true" || process.env.NIA_DEBUG === "1";

export function log(message: string, data?: Record<string, unknown>): void {
  if (!DEBUG) return;

  const timestamp = new Date().toISOString();
  const prefix = `[nia-opencode ${timestamp}]`;

  if (data) {
    console.log(prefix, message, JSON.stringify(data, null, 2));
  } else {
    console.log(prefix, message);
  }
}
