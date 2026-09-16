import { describe, expect, it } from "vitest";
import { sampleCves, type CveRecord } from "@zerohack/shared";
import { analyzeCve, findCve } from "../src/cve.ts";
import { intents, respond } from "../src/intents.ts";
import { PalSession, type Turn } from "../src/session.ts";

function corpus(): CveRecord[] {
  return sampleCves(96);
}

describe("intents", () => {
  it("classifies the five buckets", () => {
    expect(intents("hello there")).toBe("greeting");
    expect(intents("good morning PAL")).toBe("greeting");
    expect(intents("what time is it?")).toBe("time");
    expect(intents("show me today's date")).toBe("time");
    expect(intents("help")).toBe("help");
    expect(intents("what can you do?")).toBe("help");
    expect(intents("analyze CVE-2024-1148 for me")).toBe("analyze");
    expect(intents("tell me about log4j")).toBe("analyze");
    expect(intents("asdf qwerty 123")).toBe("unknown");
  });
});

describe("analyzeCve", () => {
  it("finds CVEs by exact and prefix id, case-insensitively", () => {
    const c = corpus();
    const target = c[5];
    expect(target).toBeDefined();
    const exact = analyzeCve(target.cve_id, c);
    expect(exact.found).toBe(true);
    expect(exact.cve?.cve_id).toBe(target.cve_id);
    expect(exact.severity).toBe(target.severity.toUpperCase());
    expect(exact.cvss).toBe(target.cvss_score ?? undefined);
    const lower = target.cve_id.toLowerCase();
    expect(analyzeCve(lower, c).cve?.cve_id).toBe(target.cve_id);
    const prefix = analyzeCve(target.cve_id.slice(0, 11), c);
    expect(prefix.found).toBe(true);
    expect(prefix.cve?.cve_id).toBe(target.cve_id);
  });

  it("finds CVEs by fuzzy title matching", () => {
    const c = corpus();
    const log4j = c.find((x) => x.affected_product?.includes("Log4j") || x.title.toLowerCase().includes("log4j"));
    expect(log4j).toBeDefined();
    const r = analyzeCve("log4j remote code execution", c);
    expect(r.found).toBe(true);
    expect(r.cve?.cve_id).toBe(log4j?.cve_id);
  });

  it("reports not-found deterministically and safely", () => {
    const c = corpus();
    const a = analyzeCve("does-not-exist-xyz", c);
    const b = analyzeCve("does-not-exist-xyz", c);
    expect(a.found).toBe(false);
    expect(a.answer).toBe(b.answer);
    expect(a.flags).toEqual([]);
    expect(a.intent).toBe("analyze");
    expect(findCve("", c)).toBeUndefined();
  });

  it("is deterministic for the same input", () => {
    const c = corpus();
    const first = analyzeCve("fortios exploit", c);
    const second = analyzeCve("fortios exploit", c);
    expect(first.answer).toBe(second.answer);
    expect(first.cve?.cve_id).toBe(second.cve?.cve_id);
  });
});

describe("respond", () => {
  it("greets and points at help", () => {
    const reply = respond("hello");
    expect(reply.toLowerCase()).toContain("help");
    expect(reply.toLowerCase()).toContain("offline");
  });

  it("reports a deterministic time when ctx.now is supplied", () => {
    expect(respond("what time is it", { now: "2026-09-16T12:00:00.000Z" })).toContain("2026-09-16T12:00:00.000Z");
  });

  it("answers analyze intents with the corpus answer", () => {
    const id = corpus()[0].cve_id;
    const reply = respond(`analyze ${id}`);
    expect(reply).toContain(id);
  });

  it("gives an unknown fallback", () => {
    expect(respond("blorp blorp")).toContain("help");
  });
});

describe("PalSession", () => {
  it("appends turns and exposes history", () => {
    const s = new PalSession().user("hello").assistant("hey!");
    expect(s.size).toBe(2);
    const history = s.history();
    expect(history[0].role).toBe("user");
    expect(history[1].role).toBe("assistant");
    expect(history).toEqual(s.history());
  });

  it("jsonl() -> fromJsonl() round-trips exactly", () => {
    const fixed: Turn[] = [
      { role: "user", text: "hello", ts: "2026-09-16T09:00:00.000Z" },
      { role: "assistant", text: "hey!", ts: "2026-09-16T09:00:01.000Z" },
    ];
    const session = new PalSession(fixed);
    const restored = PalSession.fromJsonl(session.jsonl());
    expect(restored.jsonl()).toBe(session.jsonl());
    expect(restored.history()).toEqual(fixed);
    expect(PalSession.fromJsonl("").history()).toEqual([]);
    expect(new PalSession().jsonl()).toBe("");
  });

  it("rejects malformed session lines", () => {
    expect(() => PalSession.fromJsonl('{"role":"bot","text":"x"}')).toThrow();
  });
});