# promptsmith-skills

Thirteen prompt-engineering and software-delivery skills for AI agents. Install them all with one command.

```bash
npx skills add emtcmca/promptsmith-skills
```

## Works in

**Any agent that reads `SKILL.md`.** There is no runtime here, no API key, no dependency, and
no host-specific syntax — these are prompts on disk, so nothing binds them to one vendor.

A single verification install reported writing to **Claude Code, Codex, GitHub Copilot, Hermes
Agent, and Qwen Code**. That is what one install observed, not a compatibility matrix, and it is
not a claim that every one of them selects and runs the skill well. If you install these into any
agent, [tell us what happened](https://github.com/emtcmca/promptsmith-skills/issues/new?template=host-compatibility.yml)
— a failure report is worth more than a success report, and it is how that list becomes
something better than one person's observation.

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

That's a claim, so here is the receipt.

<details>
<summary><strong>Real excerpt — <code>debugger</code> on a production stack trace</strong> (click to expand)</summary>

Given a two-frame `TypeError`, no source access, and a reporter who attributed it to a refactor "last Thursday," the skill produced:

> **Unverified, as supplied by you** (not yet confirmed against any artifact I can see):
> that it started last Thursday, that the server-component refactor is what changed, and
> that the 3% figure is stable and is 3% of *loads* rather than 3% of *distinct invoices*.
> Those three claims are doing most of the work in the ranking below.

> **Reproduction** — I don't have one, and I can't construct one from what's here. **Declaring
> the gap rather than guessing around it.**

> **H1 — The refactor dropped a normalization layer that used to coerce a null/absent lines
> field into `[]`.** *Why plausible:* the failing value is `undefined`, not `[]` — an invoice
> with zero line items would render fine. *Cheapest probe:* read the pre-refactor fetch
> function and look for `?? []` or a DTO mapper. Two minutes, zero deploys.

> **Trigger vs. root cause.** The server-component move is the *trigger*. The root cause is
> that `renderInvoiceLines` treats an optional field as guaranteed. Wrapping the access in
> `?? []` would make the stack trace stop and tell you nothing about whether those 3% of
> invoices are *supposed* to have line items. If they are, that guard converts a loud crash
> into silent under-billing.

Note what it refused to do: invent a reproduction, adopt the reporter's timeline as fact, or
hand over the one-line patch.

</details>

Every skill was run once against a realistic input, with the full transcript, the defects each one found, and the limits of that exercise recorded in [`docs/test-runs/`](docs/test-runs/2026-07-26-skill-conversion-runs.md). Three of those runs found real defects in this repo.

---

## Honest limits

- **Eval coverage is partial.** Upstream's eval corpus is counted and linked in the mirror stamp below, pinned to the exact commit this was built from. Not all of it covers what ships here: ten of these thirteen skills have at least one dedicated case, and `refactor-planner`, `docs-writer`, and `frontend-builder` have none. Verified against the stamped commit, not recalled.
- **These were run, once each.** Every skill was executed against one realistic input and the results written up in [`docs/test-runs/`](docs/test-runs/2026-07-26-skill-conversion-runs.md). One run per skill is a sample, not a pass rate. The write-up lists what that exercise could not test — notably the prompt-injection guardrails, which no input exercised.
- **No orchestration skill here.** promptsmith's `/orchestrate` coordinator dispatches subagents from a plugin-bundled gallery and can't run from a plain skills install. It stays in the [plugin](https://github.com/emtcmca/promptsmith).
- **No API keys, no dependencies, no network calls.** These are prompts. They run wherever your agent runs.

---

## Relationship to promptsmith

[promptsmith](https://github.com/emtcmca/promptsmith) is the source of truth and ships as a Claude Code plugin with slash commands (`/sharpen`, `/forge-agent`, `/lens`, `/orchestrate`) and a 20-agent gallery.

This repo is a **generated distribution mirror**. It exists because skills.sh indexes `skills/<name>/SKILL.md`, and adding those directories to the plugin's own `skills/` folder would change what the plugin loads for existing users. Nothing under `skills/` is hand-edited.

<!-- mirror-stamp:start -->
Generated from [promptsmith](https://github.com/emtcmca/promptsmith) at commit [`2398b2e`](https://github.com/emtcmca/promptsmith/commit/2398b2e31a08cab64d6badbe16b96eb5e7f59ea4), committed 2026-09-02. At that commit upstream carries [37 eval cases](https://github.com/emtcmca/promptsmith/tree/2398b2e31a08cab64d6badbe16b96eb5e7f59ea4/evals/cases) and [6 known-bad regression fixtures](https://github.com/emtcmca/promptsmith/tree/2398b2e31a08cab64d6badbe16b96eb5e7f59ea4/evals/known-bad) — both links are pinned to that exact commit, so the counts are checkable rather than claimed.
<!-- mirror-stamp:end -->

Every generated skill carries the same commit stamp in its own footer, so the provenance travels with the file after install rather than living only here.

To regenerate after promptsmith changes:

```bash
git clone https://github.com/emtcmca/promptsmith.git ../promptsmith
node scripts/build-skills.mjs
```

The generator fails loudly if an upstream reword breaks one of its path rewrites, or if any generated file still points at a plugin-only path — so a silent drift can't ship.

If you use Claude Code, install the plugin instead. You get these skills plus the commands, the full 20-agent gallery, and the orchestrator.

---

## Contributing

Prompt fixes go [upstream](https://github.com/emtcmca/promptsmith/issues); packaging, install,
and generator fixes go here. Host compatibility reports are welcome and there is a template for
them. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

Apache-2.0. Same as promptsmith.
