# promptsmith-skills

Thirteen prompt-engineering and software-delivery skills for AI agents. Install them all with one command.

```bash
npx skills add emtcmca/promptsmith-skills
```

Works with Claude Code, Cursor, Codex, Copilot, Windsurf, Gemini, and any other agent that reads `SKILL.md`.

---

## What's in here

**The engine**

| Skill | Use it when |
|---|---|
| `prompt-engineering` | A prompt is vague, under-specified, or producing inconsistent output. Sharpens a rough request into a complete prompt, authors a reusable agent/system prompt, or reviews a draft through 12 expert lenses. |

**The specialists**

| Skill | Use it when |
|---|---|
| `debugger` | Something broke and the cause isn't known yet. Turns a stack trace into ranked hypotheses plus the cheapest test for each. |
| `test-author` | Adding coverage or locking in a bug fix. Writes tests that prove behavior through the public interface. |
| `security-review` | Code touches auth, untrusted input, secrets, payments, or personal data. |
| `api-reviewer` | A REST or GraphQL surface needs review before it ships. |
| `backend-builder` | Implementing endpoints or business logic — input-validated, authorized, idempotent. |
| `frontend-builder` | Implementing UI, including the loading, empty, and error states people skip. |
| `data-modeler` | Designing a schema or planning a migration. |
| `planner` | Work needs breaking down and sequencing before implementation starts. |
| `refactor-planner` | Restructuring code without changing behavior, one green build at a time. |
| `feature-spec` | An idea needs to become something a team can actually build. |
| `docs-writer` | Writing a README, usage guide, or architecture decision record. |
| `evaluator` | Scoring a prompt, doc, plan, spec, UI, or piece of copy against criteria. |

Install one instead of all thirteen:

```bash
npx skills add emtcmca/promptsmith-skills --skill debugger
```

List what's available without installing:

```bash
npx skills add emtcmca/promptsmith-skills --list
```

---

## What makes these different

Each skill has a **stated contract** — a role, a method, an output shape, and explicit push-back conditions. They are built to say "this is under-specified, here's what I need" rather than confidently produce something plausible from a thin request.

The `prompt-engineering` skill bundles 12 review lenses (`accessibility`, `security-reviewer`, `visual-design`, `ai-tells`, `skeptic`, `editorial`, `seo`, `performance`, `api-design`, `data-integrity`, `product-strategist`, `ux-designer`) and 3 output templates. They ship inside the skill directory, so it works with no plugin and no configuration.

---

## Honest limits

- **Eval coverage is partial.** The upstream promptsmith project ships 37 eval cases and 6 known-bad regression fixtures. Ten of the thirteen skills here have at least one dedicated case; `refactor-planner`, `docs-writer`, and `frontend-builder` do not yet.
- **No orchestration skill here.** promptsmith's `/orchestrate` coordinator dispatches subagents from a plugin-bundled gallery and can't run from a plain skills install. It stays in the [plugin](https://github.com/emtcmca/promptsmith).
- **No API keys, no dependencies, no network calls.** These are prompts. They run wherever your agent runs.

---

## Relationship to promptsmith

[promptsmith](https://github.com/emtcmca/promptsmith) is the source of truth and ships as a Claude Code plugin with slash commands (`/sharpen`, `/forge-agent`, `/lens`, `/orchestrate`) and a 20-agent gallery.

This repo is a **generated distribution mirror**. It exists because skills.sh indexes `skills/<name>/SKILL.md`, and adding those directories to the plugin's own `skills/` folder would change what the plugin loads for existing users. Nothing here is hand-edited.

To regenerate after promptsmith changes:

```bash
git clone https://github.com/emtcmca/promptsmith.git ../promptsmith
node scripts/build-skills.mjs
```

The generator fails loudly if an upstream reword breaks one of its path rewrites, or if any generated file still points at a plugin-only path — so a silent drift can't ship.

If you use Claude Code, install the plugin instead. You get these skills plus the commands, the full 20-agent gallery, and the orchestrator.

---

## License

Apache-2.0. Same as promptsmith.
