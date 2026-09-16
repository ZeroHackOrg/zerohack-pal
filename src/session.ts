/** PAL conversation memory as an in-memory list of turns with JSONL persistence. */

export interface Turn {
  role: "user" | "assistant";
  text: string;
  ts: string;
}

function isRole(v: unknown): v is Turn["role"] {
  return v === "user" || v === "assistant";
}

export class PalSession {
  private readonly turns: Turn[];

  constructor(history: readonly Turn[] = []) {
    this.turns = history.map((t) => ({ role: t.role, text: t.text, ts: t.ts }));
  }

  user(text: string): this {
    this.turns.push({ role: "user", text: String(text), ts: new Date().toISOString() });
    return this;
  }

  assistant(text: string): this {
    this.turns.push({ role: "assistant", text: String(text), ts: new Date().toISOString() });
    return this;
  }

  history(): readonly Turn[] {
    return this.turns.map((t) => ({ ...t }));
  }

  get size(): number {
    return this.turns.length;
  }

  /** Serialize all turns as one JSON object per line. */
  jsonl(): string {
    if (!this.turns.length) return "";
    return `${this.turns.map((t) => JSON.stringify(t)).join("\n")}\n`;
  }

  /** Restore a session from JSONL produced by `jsonl()` (blank lines tolerated). */
  static fromJsonl(text: string): PalSession {
    const turns: Turn[] = [];
    for (const line of String(text ?? "").split("\n")) {
      if (!line.trim()) continue;
      const raw = JSON.parse(line) as Record<string, unknown>;
      if (typeof raw !== "object" || raw === null || !isRole(raw.role)) {
        throw new Error("Invalid PAL session line: missing or bad role");
      }
      turns.push({ role: raw.role, text: String(raw.text ?? ""), ts: String(raw.ts ?? "") });
    }
    return new PalSession(turns);
  }
}