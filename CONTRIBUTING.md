# Contributing

Short version: **the skills here are generated. Fix the prompts upstream, fix the packaging here.**

## Where does my change go?

| You want to change | File it / PR it against |
|---|---|
| What a skill says, how it reasons, its output shape | [promptsmith](https://github.com/emtcmca/promptsmith) — the source of truth |
| Install, `npx skills add`, missing files after install | this repo |
| `scripts/build-skills.mjs`, the mirror stamp, provenance | this repo |
| The README, CI, issue templates | this repo |

Anything under `skills/` is written by `scripts/build-skills.mjs` from promptsmith. A hand-edit
there survives exactly until the next regeneration, and CI fails on it in the meantime — the
`mirror-drift` workflow regenerates from a fresh clone of promptsmith `main` daily and on every
PR, then fails if the result differs from what is committed.

That is deliberate. The README claims this repo is a generated mirror, and a claim nobody
enforces is just a sentence.

## Reporting that a skill worked (or didn't) in your agent

Genuinely useful, and there is a template for it. These are plain prompts with no runtime, so
they should work in any agent that reads `SKILL.md` — but "should" is doing a lot of work in
that sentence. The README lists the hosts one verification install reported and says outright
that it is an observation rather than a compatibility matrix. Real reports are how that gets
better. A failure report is worth more than a success report.

## Working on the generator

```bash
git clone https://github.com/emtcmca/promptsmith.git ../promptsmith
node scripts/build-skills.mjs
git status --porcelain    # empty means your change was a no-op
```

`PROMPTSMITH_SRC=/path/to/promptsmith` overrides the sibling-directory default.

The generator is zero-dependency Node, stdlib only. Keep it that way. It fails loudly rather
than silently when an upstream reword breaks a path rewrite, or when a generated file still
points at a plugin-only path — those guards exist because a silent mirror failure ships a
broken skill to everyone who installs.

It also refuses to stamp a source commit that is not on the promptsmith remote. Provenance
links that 404 for every reader except the author are worse than no provenance at all.

## Pull requests

- One concern per PR.
- Say what you verified, not just what you changed. If you touched the generator, paste the
  `git status --porcelain` output showing the regeneration is clean.
- No new runtime dependencies.

## License

Apache-2.0. Contributions are accepted under the same license.
