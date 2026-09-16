#!/usr/bin/env node
/** zh-pal — PAL: deterministic local assistant. CVE analysis, intents and JSONL session memory. No LLM. */

import { Command } from "commander";
import fs from "node:fs";
import { table } from "@zerohack/shared";
import { analyzeCve } from "./cve.ts";
import { respond } from "./intents.ts";
import { PalSession } from "./session.ts";

const program = new Command();

program
  .name("zh-pal")
  .description("Deterministic local assistant — analyze CVEs offline, chat, and persist session memory as JSONL.")
  .version("0.1.0", "-v, --version")
  .showHelpAfterError();

program
  .command("ask")
  .description("Chat: get a full offline reply")
  .argument("<prompt...>")
  .action((prompt: string[]) => {
    console.log(respond(prompt.join(" ")));
  });

program
  .command("analyze")
  .description("Analyze a CVE id or free text against the offline corpus")
  .argument("<id-or-text...>")
  .option("-j, --json", "print raw JSON result")
  .action((args: string[], options) => {
    const result = analyzeCve(args.join(" "));
    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    console.log(result.answer);
    if (result.found && result.cve) {
      console.log(
        table({
          headers: ["Field", "Value"],
          rows: [
            ["CVE", result.cve.cve_id],
            ["Severity", result.severity ?? "—"],
            ["CVSS", result.cvss ?? "—"],
            ["Source", result.cve.source ?? "—"],
            ["Intent", result.intent],
            ["Flags", result.flags.length ? result.flags.join(", ") : "—"],
          ],
        })
      );
    }
  });

program
  .command("session")
  .description("Session memory: start a new session, save a transcript as JSONL, or load one back")
  .argument("<cmd>", "start | save | load")
  .argument("[path]", "file path for save/load")
  .argument("[text...]", "user prompts to exercise when saving")
  .option("-j, --json", "print raw JSON output")
  .action((cmd: string, path: string | undefined, text: string[], options) => {
    try {
      switch (cmd) {
        case "start": {
          const session = new PalSession();
          if (path) {
            fs.writeFileSync(path, session.jsonl());
            if (options.json) console.log(JSON.stringify({ cmd: "start", path, turns: session.size }));
            else console.log(`zh-pal: started empty session at ${path} (${session.size} turns)`);
          } else if (options.json) {
            console.log(JSON.stringify({ cmd: "start", turns: session.size }));
          } else {
            console.log("zh-pal: started empty session (0 turns) — pass a path to persist it, e.g. session start memory.jsonl");
          }
          return;
        }
        case "save": {
          if (!path) throw new Error("session save requires a <path>");
          const turns = text.length ? text : ["hello", "help me analyze a CVE"];
          const session = new PalSession();
          for (const prompt of turns) {
            session.user(prompt);
            session.assistant(respond(prompt));
          }
          fs.writeFileSync(path, session.jsonl());
          if (options.json) console.log(JSON.stringify({ cmd: "save", path, turns: session.size }));
          else console.log(`zh-pal: saved ${session.size} turns to ${path}`);
          return;
        }
        case "load": {
          if (!path) throw new Error("session load requires a <path>");
          const session = PalSession.fromJsonl(fs.readFileSync(path, "utf8"));
          if (options.json) {
            console.log(JSON.stringify({ cmd: "load", path, turns: session.history() }, null, 2));
            return;
          }
          if (!session.size) {
            console.log(`zh-pal: ${path} contains an empty session`);
            return;
          }
          console.log(
            table({
              headers: ["#", "Role", "Message"],
              rows: session.history().map((t, i) => [i + 1, t.role, `${t.ts}\n${t.text}`]),
            })
          );
          return;
        }
        default:
          throw new Error(`unknown session command "${cmd}" (expected start | save | load)`);
      }
    } catch (err) {
      console.error(`zh-pal: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
  });

program.parseAsync(process.argv).catch((err) => {
  console.error(`zh-pal: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});