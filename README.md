<div align="center">

```
  ███████╗███████╗███╗   ███╗██╗   ██╗██╗  ██╗
  ╚══██╔══╝██╔════╝████╗ ████║██║   ██║██║ ██╔╝
     ██║   █████╗  ██╔████╔██║██║   ██║█████╔╝
     ██║   ██╔══╝  ██║╚██╔╝██║╚██╗ ██╔╝██╔═██╗
     ██║   ███████╗██║ ╚═╝ ██║ ╚████╔╝ ██║  ██╗
     ╚═╝   ╚══════╝╚═╝     ╚═╝  ╚═══╝  ╚═╝  ╚═╝
```

# @zerohack/pal · `zh-pal`

**Deterministic local research assistant — no LLM, no API, pure offline**

[![License](https://img.shields.io/badge/license-Apache--2.0-00B0BD?style=for-the-badge)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](tsconfig.json)
[![Zero Budget](https://img.shields.io/badge/cost-%240-00b894?style=for-the-badge)](https://zerohack.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-00B0BD?style=for-the-badge)](CONTRIBUTING.md)

**Part of the [ZeroHack](https://zerohack.org) Geek Tools ecosystem**
Category: `assistant` · `ai` · `offline` · `pal`

</div>

---

> **⚡ Zero Budget. Zero Cloud Dependencies. Pure Local Power.**

---

## What It Does

PAL classifies intent by keyword, answers from canned templates, analyzes
CVEs against an offline seeded corpus, and persists conversation memory as
JSONL. Completely deterministic — same input, same output, always. No LLM,
no API key, no cloud service.

---

## Quick Start

```bash
# From the monorepo root
git clone https://github.com/ZeroHackOrg/zerohack-geek-tools.git
cd zerohack-geek-tools
npm install
npm run geek:pal -- ask "hello"
```

**Standalone:**

```bash
git clone https://github.com/ZeroHackOrg/zerohack-pal.git
cd zerohack-pal && npm install
npx tsx src/bin.ts ask "hello"
```

### Standalone Resolution

```bash
git clone https://github.com/ZeroHackOrg/zerohack-shared.git
cd zerohack-shared && npm install && npm link
cd ../zerohack-pal && npm link @zerohack/shared
```

---

## Commands

| Command | Description |
|---|---|
| `zh-pal ask "hello"` | Greeting / help / time — deterministic replies |
| `zh-pal ask "what CVEs are critical"` | Offline CVE analysis from seeded corpus |
| `zh-pal analyze CVE-2024-1234` | Exact CVE ID lookup |
| `zh-pal analyze "Log4j RCE" --json` | Fuzzy title-token overlap match |
| `zh-pal session start memory.jsonl` | Start persistent session |
| `zh-pal session save memory.jsonl "hello" "help me analyze a CVE"` | Append turn |
| `zh-pal session load memory.jsonl --json` | Read session history |

---

## Modules

| Module | Purpose |
|---|---|
| `intents(text)` | Classifies free text into `greeting \| help \| time \| analyze \| unknown` |
| `respond(text, ctx?)` | Full chat reply; deterministic when `ctx.now` is supplied |
| `analyzeCve(textOrId, corpus?)` | CVE lookup by ID or fuzzy title match against `sampleCves(96)` |
| `PalSession` | Append user/assistant turns, round-trip through JSONL persistence |

---

## Env

None — all tools are zero-dependency, zero-config, and run offline.

---

## Tests

```bash
npm run typecheck --workspace @zerohack/pal
npm run test    --workspace @zerohack/pal
```

Everything is offline and deterministic. `sampleCves(96)` is seeded,
fuzzy matching uses token overlap (ties resolved by corpus order), and
session CLI output for a given transcript is byte-identical across runs.

---

## Architecture

```
zerohack-pal/
├── src/
│   ├── bin.ts          # CLI entrypoint (commander)
│   ├── index.ts        # Re-exports
│   ├── intents.ts      # Intent classifier (keyword-based)
│   ├── cve.ts          # CVE corpus lookup (exact + fuzzy)
│   └── session.ts      # JSONL session persistence
├── test/
│   └── pal.test.ts     # Unit tests (vitest)
├── package.json
├── tsconfig.json
├── README.md
├── LICENSE             # Apache-2.0
├── SECURITY.md
├── CONTRIBUTING.md
└── CODE_OF_CONDUCT.md
```

**Design principles:**
- Pure functions: no randomness, no network, no LLM.
- Deterministic: same transcript → same output, byte-identical.
- JSONL persistence: append-only, human-readable.
- Zero runtime dependencies beyond `zod` (schema validation) and `@zerohack/shared`.

---

## Security

Pure offline tool. Does not contact any external services. No data leaves
your machine. Session files are plain JSONL on disk.

For vulnerability reports, see [SECURITY.md](SECURITY.md).

---

## Related Packages

| Package | Binary | What It Does |
|---|---|---|
| [@zerohack/shared](../zerohack-shared) | — | Types, schemas, catalog |
| [@zerohack/cli](../zerohack-cli) | `zh` | Unified CLI |
| [@zerohack/supalite-api](../zerohack-supalite-api) | `zh-api` | PostgREST API |
| [@zerohack/honeypot](../zerohack-honeypot) | `zh-honeypot` | Honeypot |
| [@zerohack/osint-cli](../zerohack-osint-cli) | `zh-osint` | OSINT tools |
| [@zerohack/ssh-hardener](../zerohack-ssh-hardener) | `zh-ssh` | SSH auditor |
| [@zerohack/secret-scanner](../zerohack-secret-scanner) | `zh-secret` | Secret scanner |
| [@zerohack/recon-bot](../zerohack-recon-bot) | `zh-recon` | Recon automation |
| [@zerohack/log-analyzer](../zerohack-log-analyzer) | `zh-log` | Log forensics |
| [@zerohack/ctf-lab](../zerohack-ctf-lab) | `zh-lab` | CTF lab runner |
| [@zerohack/ctf-automation](../zerohack-ctf-automation) | `zh-ctf` | CTF solver |

---

## Community

- **Issues:** [GitHub Issues](https://github.com/ZeroHackOrg/zerohack-pal/issues)
- **PRs:** [Pull Requests](https://github.com/ZeroHackOrg/zerohack-pal/pulls)
- **Security:** [SECURITY.md](SECURITY.md)
- **Platform:** [zerohack.org](https://zerohack.org)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Read our [Code of Conduct](CODE_OF_CONDUCT.md) first.

## License

[Apache-2.0](LICENSE) — Copyright 2026 ZeroHack Security
