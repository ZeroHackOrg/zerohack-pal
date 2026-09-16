/** Offline CVE analysis against the deterministic sample corpus. No network. */

import { parseFlags, sampleCves, type CveRecord } from "@zerohack/shared";
import type { Intent } from "./intents.ts";

const STOPWORDS = new Set([
  "a",
  "an",
  "the",
  "of",
  "in",
  "on",
  "for",
  "and",
  "with",
  "via",
  "to",
  "by",
  "is",
  "are",
  "remote",
  "code",
  "execution",
  "vulnerability",
  "vuln",
  "cve",
  "vulnerabilities",
]);

export interface CveAnalysis {
  found: boolean;
  cve?: CveRecord;
  intent: Intent;
  severity?: string;
  cvss?: number;
  flags: string[];
  answer: string;
}

function tokenize(text: string): string[] {
  return String(text ?? "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

function overlap(a: readonly string[], b: readonly string[]): number {
  if (!a.length || !b.length) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  const inter = [...setA].filter((t) => setB.has(t)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : inter / union;
}

/** Find a corpus entry by CVE id (exact or prefix) or by fuzzy title match. */
export function findCve(query: string, corpus: readonly CveRecord[]): CveRecord | undefined {
  const q = String(query ?? "").trim().toLowerCase();
  if (!q) return undefined;

  const loose = q.replace(/^cve-?/, "cve-");
  const byId = corpus.find((c) => {
    const id = c.cve_id.toLowerCase();
    return id === q || id === loose || id.startsWith(q) || id.startsWith(loose) || q.startsWith(id);
  });
  if (byId) return byId;

  const qTokens = tokenize(q);
  if (!qTokens.length) return undefined;
  let best: { cve: CveRecord; score: number } | undefined;
  for (const c of corpus) {
    const score = overlap(qTokens, tokenize(`${c.title} ${c.description}`));
    if (score > 0 && (!best || score > best.score)) best = { cve: c, score };
  }
  return best?.cve;
}

/**
 * Analyze a CVE id or free text against the offline corpus (defaults to
 * `sampleCves(96)`). Deterministic: same input corpus yields the same answer.
 */
export function analyzeCve(textOrId: string, corpus: CveRecord[] = sampleCves(96)): CveAnalysis {
  const query = String(textOrId ?? "").trim();
  const hit = findCve(query, corpus);
  if (!hit) {
    return {
      found: false,
      intent: "analyze",
      flags: [],
      answer:
        `No CVE in the offline corpus matched "${query}". ` +
        "PAL only knows the 96 canned advisories from @zerohack/shared — try a CVE id like CVE-2024-1234 or a product keyword such as \"log4j\" or \"fortios\".",
    };
  }

  const severity = hit.severity.toUpperCase();
  const cvss = hit.cvss_score ?? undefined;
  const flags = parseFlags(`${hit.title}\n${hit.description}`);
  const cvssLine = cvss !== undefined ? ` CVSS ${cvss.toFixed(1)}.` : "";
  const exploitLine = hit.exploit_available
    ? "sample metadata marks exploit availability"
    : "sample metadata does not flag a public exploit";
  const flagsLine = flags.length ? `\n  Flags in sample metadata: ${flags.join(", ")}` : "";

  const answer = [
    `Analysis: ${hit.cve_id} matched "${query}" (intent: analyze).`,
    "",
    `  ${hit.title}`,
    `  Severity: ${severity}${cvssLine}`,
    `  ${hit.description}`,
    `  Detection: correlated via ${hit.source ?? "unknown"} feed · ${exploitLine}.`,
    flagsLine,
  ].join("\n");

  return { found: true, cve: hit, intent: "analyze", severity, cvss, flags, answer };
}