/** Offline, deterministic intent classification for PAL. */

import { analyzeCve } from "./cve.ts";

export type Intent = "greeting" | "help" | "time" | "analyze" | "unknown";

interface IntentRule {
  intent: Exclude<Intent, "unknown">;
  keywords: readonly string[];
}

const RULES: readonly IntentRule[] = [
  {
    intent: "greeting",
    keywords: ["hello", "hi", "hey", "howdy", "yo", "sup", "greetings", "good morning", "good afternoon", "good evening"],
  },
  {
    intent: "help",
    keywords: ["help", "what can you do", "commands", "usage", "options", "manual", "docs"],
  },
  {
    intent: "time",
    keywords: ["time", "what time", "clock", "what day", "date", "today"],
  },
  {
    intent: "analyze",
    keywords: ["cve", "vuln", "advisory", "exploit", "analyze", "rce", "xss", "sqli", "log4j", "zeroday", "zero-day"],
  },
];

function matches(text: string, keyword: string): boolean {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`).test(text);
}

/** Classify free text into one of the five intents (first matching rule wins). */
export function intents(text: string): Intent {
  const t = String(text ?? "")
    .toLowerCase()
    .trim();
  for (const rule of RULES) {
    if (rule.keywords.some((k) => matches(t, k))) return rule.intent;
  }
  return "unknown";
}

export interface RespondContext {
  now?: string;
}

/** Full offline chat reply. Deterministic when `ctx.now` is provided. */
export function respond(text: string, ctx: RespondContext = {}): string {
  const intent = intents(text);
  switch (intent) {
    case "greeting":
      return "Hey! I'm PAL, your deterministic local assistant. I analyze CVEs offline and keep session memory — no LLM, no API. Type 'help' to see commands.";
    case "help":
      return [
        "PAL commands (offline, no LLM):",
        "  ask \"hello\"                    chat with me",
        "  analyze <cve-or-text>          lookup in the offline corpus",
        "  session start|save|load        persist conversation memory (JSONL)",
        "Try: zh-pal ask \"what time is it\"",
      ].join("\n");
    case "time":
      return `It's ${ctx.now ?? new Date().toISOString()} (UTC). That's all I know without a clock on the network.`;
    case "analyze":
      if (/\bcve-\d{4}-\d{4,7}\b/i.test(text)) return analyzeCve(text).answer;
      return "Tell me a CVE id (like CVE-2024-1234) or a product keyword (like \"log4j\") and I'll match it against the offline corpus.";
    default:
      return "I didn't catch that. Try 'help' to see what PAL can do, or ask me to analyze a CVE.";
  }
}