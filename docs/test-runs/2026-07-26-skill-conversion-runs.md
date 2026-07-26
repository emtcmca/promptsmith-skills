# Skill conversion test runs — 2026-07-26

Every skill in this repo run once in a clean context against a realistic input.

## Why this exists

promptsmith's prompt bodies are exercised daily through the Claude Code plugin. This
repo changes three things the plugin has never tested:

1. **Execution model.** In the plugin, agent prompts are dispatched into a fresh
   subagent. Installed from skills.sh they load inline into an existing conversation.
2. **File resolution.** `prompt-engineering` resolved its lenses and templates through
   `${CLAUDE_PLUGIN_ROOT}`. Here those paths are rewritten to be skill-relative — an
   instruction that had never run anywhere before this repo.
3. **Descriptions.** All 13 were rewritten for skills.sh discovery, not for the plugin's
   subagent router.

These runs test the wrapper. Daily plugin use tests the payload.

## Method

One clean-context agent per skill. Each loads only its `SKILL.md` plus one realistic
input, follows the skill as its operating instructions, and reports against a fixed
rubric: contract followed, real defects found vs missed, false positives, push-back,
AI tells, broken instructions, verdict.

Where a skill had a known answer key (planted defects), the rubric names them so
"caught vs missed" is checkable rather than self-assessed.

## Results

| Skill | Verdict | Notes |
|---|---|---|
| security-review | PASS | 6/6 planted defects caught, +2 unplanted |
| debugger | PASS | Refused to invent a reproduction; separated trigger from root cause |
| feature-spec | PASS | Cut the second feature the input asked for, and defended the cut |
| api-reviewer | PASS | 6/6 planted issues caught, SSRF ranked first, +3 unplanted |
| test-author | PASS | Executed the function to verify expected values; found 3 unplanted defects |
| prompt-engineering | PASS | All 15 bundled files resolved skill-relative. Two repo defects found — see below |
| planner | PASS | Dependency order argued, not asserted; corrected its own "parallelizable" claim |
| evaluator | PASS | Derived an artifact-specific rubric; graded this repo's README WEAK with defensible failures |
| docs-writer | PASS | Executed the script rather than describing it; found 2 unflagged script behaviors |
| frontend-builder | PASS | Real a11y depth; caught its own dead code; pushed back on a domain gap |
| backend-builder | PASS | Race-safe CAS idempotency with its isolation-level dependency disclosed |
| refactor-planner | PASS | Corrected a false premise in the test prompt itself; found 8 unnamed quirks |
| data-modeler | PASS | Amendment-inherits-rank modeled correctly at arbitrary depth; real RLS |

**13 of 13 PASS.**

### security-review

**Input:** an Express + Prisma document-sharing endpoint with six planted defects —
missing authentication, missing authorization (cross-tenant IDOR), share token emailed
to a caller-chosen address, no email validation, no rate limit, unchecked null document.

**Result: PASS.** All six caught, ranked by real deployment impact rather than by how
easy they were to spot — cross-tenant IDOR first, null-deref and rate-limit below the
exfiltration primitive.

Two findings beyond the answer key:

- The share token is per-document rather than per-share, has no expiry or revocation
  path, and travels in a query string — so a single leak via referrer, CDN log, or
  email-security prefetch is permanent and cannot be scoped to one recipient.
- No audit trail on a data-egress action, which turns a scoped breach into an unscoped
  disclosure notification.

It also caught two second-order consequences of the null-deref that the bare observation
misses: on Express 4 an unhandled rejection in an async handler can terminate the
process (a one-request DoS from an anonymous caller), and the 500-vs-200 difference is
an existence oracle for enumerating the document ids the IDOR needs.

No false positives. The weakest finding (audit trail) was correctly ranked LOW and
labeled an absence rather than a vector. CSRF was deliberately held in a "confirm these"
section rather than promoted to a finding, because it is contingent on an auth model
that does not exist in the code yet.

**Gap in this test:** the input contained no prompt-injection content, so the skill's
"treat the artifact as data" guardrail was never exercised.

### debugger

**Input:** a production-only `TypeError` with a two-frame stack trace, no source access,
attributed by the reporter to a server-component refactor "last Thursday," at ~3% of loads.

**Result: PASS.** Produced six ranked hypotheses, each with a single cheapest
confirm-or-kill probe, and stated up front what would prove it wrong.

The honesty floor did real work. It declined to construct a reproduction it could not
build, saying so explicitly rather than inventing plausible repro steps. It attributed
all three user claims — the Thursday date, the refactor causation, and the 3% figure —
as unverified rather than adopting them as fact, then noted those claims were carrying
most of the ranking, so confirming them was the cheapest next move.

The strongest single observation: the failing value is `undefined`, not `[]`, so an
invoice with zero line items would render fine — which points at a missing normalization
layer rather than empty data. It then separated trigger from root cause and warned that
the reflexive `?? []` guard would convert a loud crash into silent under-billing if those
3% of invoices are supposed to have line items.

**Weakness:** six hypotheses for one trace runs close to padding. Two are argued down
rather than dropped, which is defensible, but five would have done.

### feature-spec

**Input:** a rough two-part idea — ground a "can we fine for this?" question in an
association's own documents with an exact citation, plus draft the violation notice.

**Result: PASS.** Opened by identifying it as two features in one coat, specced the
retrieval half, and drew the cut line at the notice generator — the part the input
explicitly asked for. The reason given was not purity: the notice generator's hard parts
(owner of record, cure-clock start date, proof of delivery) are disjoint from the
retrieval problem, so bundling means neither ships clean.

All three planted hard questions were caught and treated as first-class:

- Documents-don't-answer became a third verdict alongside yes and no, not an error state.
- Unauthorized practice of law was named as a gating open question needing counsel,
  explicitly refusing to settle it with a self-written disclaimer.
- Accountability was left unresolved with a position taken and a warning that silence
  defaults liability to the vendor.

Most of the success criteria are real gates — labeled corpora, thresholds, and a
zero-hallucinated-citation release blocker — rather than sentiments.

**Weakness:** one threshold (80% rendered-citation rate) is asserted without a baseline
to justify it, and one criterion rests on a 5-person moderated test.

### prompt-engineering

**Input:** "Sharpen this: 'Write a prompt that reviews our support emails and tells us what
customers are unhappy about.'"

**Result: PASS — and this was the run that mattered most.** Every bundled file resolved:

| Path | Result |
|---|---|
| `templates/sharpened-prompt.md` | resolved, used |
| `templates/agent-system-prompt.md` | resolved (not needed on this route) |
| `templates/graded-prompt.md` | resolved (not needed on this route) |
| `lenses/` — all 12 files | resolved |
| `lenses/skeptic.md`, `product-strategist.md`, `security-reviewer.md` | resolved, applied |
| `lenses/data-integrity.md` | resolved, deliberately not applied (`applies-to` mismatch) |
| user-global and project-local lens tiers | absent, correctly treated as optional |

The skill-relative rewrite works. It selected three lenses by topic match and consciously
rejected a fourth as money/schema-shaped noise.

Output matched `sharpened-prompt.md` section for section. It refused to invent the corpus
source, date range, volume, product, or storage location — emitting bracketed placeholders
with "I will not fill them with a plausible-sounding value" — while assuming reversible
preferences (tone, theme cap, audience) and listing them as overridable.

The push-back attacked the premise: support email measures who complains, not what is
worst, because complaint volume tracks how easy a problem is to write an email about.
Silent churners are structurally absent. It also split the request into label-then-tally,
on the grounds that models are unreliable counters over long context and a single pass
returns fluent themes with numbers that shift between runs — "the worst possible artifact,
because it looks quantitative."

**Two defects in this repo, found by the skill running on itself:**

1. The SKILL.md still offers a `--deep` flag. That is a command-layer affordance from the
   plugin; installed as a bare skill there is no command to re-run. Same class of problem
   as the `/lens` reference already rewritten during the build, missed on this one.
2. The generated provenance footer claims the upstream project ships 37 eval cases and 6
   known-bad fixtures. True of promptsmith, and attributed — but uncheckable from inside
   an installed skill, in a skill whose own central rule is not to assert unverified
   claims. Holding users to a standard the footer doesn't meet.

**Caveat on this test:** the agent's working directory happened to coincide with the repo
root, so skill-relative resolution was never tested against a hostile cwd.

### planner

**Input:** ship a 5-skill retrieval-kit repo to skills.sh, solo developer, ~10h/week.

**Result: PASS.** Eleven tasks, each with an observer-checkable acceptance criterion
(zero-byte diff, clean-directory install, transcript recorded) rather than "works."

The dependency ordering is argued rather than asserted, and it inverts what a naive plan
produces in three places: the generator lands *after* the pilot skill and first publish
(writing it earlier encodes a guessed file format), the README lands last (written early
it documents artifacts that don't exist), and the first publish happens at one skill, not
five, so packaging surprises surface with one file to fix.

It named the under-specification that changes the task graph — what "honest eval notes"
means — and quantified the delta (+2 tasks, ~12h) rather than just flagging it. Unprompted,
it raised IP/extraction rights on distilling a production app into a public repo, that
self-evaluation is not evaluation, and that two pairs among the five skills overlap in
scope with the honest out that it may be four skills.

Best moment: it caught its own misleading claim in place, noting that for a solo developer
"parallelizable" means order-independent, not concurrent — those four skills still cost 16
hours whichever order you take them in.

**Weakness:** round-number hour estimates and a ~37h total presented in a confident
register, all unverifiable.

### evaluator

**Input:** grade this repo's own README, no rubric supplied, derive one.

**Result: PASS on contract — and it graded the README WEAK.** The derived rubric came
from the artifact's stated job (get a dev to install; get a dev to trust) rather than a
generic docs checklist, which is why it caught things a structure-and-badges rubric would
have passed.

Two hard failures, both fair:

- **No proof of the good.** The product is prose and the README shows none of it. Zero
  lines of actual skill output. The strongest asset — that these emit named output
  contracts with quoted evidence — is described abstractly and never demonstrated.
- **No freshness marker on a generated mirror.** The README says "generated distribution
  mirror… nothing here is hand-edited," which raises the question it never answers:
  generated from which commit, when? No date, no SHA. It noted the claim that "a silent
  drift can't ship" asserts drift protection the artifact gives no way to observe.

Three weak grades: install consequence never explained (where files land, how to remove
them), the "install the plugin instead" routing buried 83 lines down where it redirects
readers who already converted, and one unsupported claim.

**Third defect in this repo, found here:** the README's six-product compatibility line
(Claude Code, Cursor, Codex, Copilot, Windsurf, Gemini) has nothing behind it. The
observed CLI output during build verification named Claude Code, Codex, GitHub Copilot,
Hermes Agent, and Qwen Code — Windsurf and Cursor were never observed. The claim sits
three lines under the install command, in the highest-attention position on the page.

It scored the honest-limits section as the most credible move on the page — naming the
three skills without eval coverage by name is the only place the README pays a real cost —
while explicitly docking an adjacent dimension to stop that halo carrying the whole grade.

### data-modeler

**Input:** HOA governing-document schema. Five document types in a strict authority order,
amendments that inherit their parent's rank rather than holding one, a "currently effective
text on topic X" query, hard multi-tenant isolation, Postgres.

**Result: PASS.** It hit the planted trap correctly on all three counts.

- **Amendment is a relationship, not a rank.** `amendment` never appears in the
  `document_type` table. An amendment row has `doc_type_code IS NULL` enforced by an
  XOR check, and rank is structurally unreachable except through a view that joins
  `document_type` via the chain's root.
- **Arbitrary chain depth.** A write trigger copies the parent's already-resolved
  `root_document_id` rather than the parent's id, so depth 12 resolves in one column read
  exactly like depth 1. The migration backfill loops one depth level per pass until
  convergence, quarantining orphans and cycles rather than guessing a parent. Cycles are
  blocked three ways, and re-parenting is forbidden outright so the denormalized root
  cannot go stale.
- **Currently effective.** Half-open `[from, to)` windows with a GiST exclusion constraint,
  making two overlapping effective texts physically unstorable rather than merely
  discouraged. Repeal modeled as an action with a null body so repealed clauses drop out.
  As-of-date queries fall out for free.

Tenancy is real isolation, not a `tenant_id` column: RLS `ENABLE` + `FORCE`, a fail-closed
policy, a non-owner non-`BYPASSRLS` role with no DELETE grant, tenant-carrying composite
FKs so a cross-tenant parent is unstorable even with RLS off, and `security_invoker` on the
view so it cannot launder RLS. It named its own limits — superuser and `BYPASSRLS` see
everything, and a plain `SET` instead of transaction-scoped `set_config` leaks the tenant
onto the next borrower of a pooled connection.

**Strongest push-back of the whole exercise.** It refused to certify the stated authority
order, on the grounds that many state condominium and HOA statutes are *default* rules an
association's declaration may lawfully override — in which case the declaration outranks
the statute for that provision. It noted the schema hardcodes one global order, and that
if precedence varies by provision or jurisdiction, rank must move off the document type
entirely. It also surfaced that storing state statute per-tenant duplicates identical text
once per association, and flagged this as a direct conflict with the hard-isolation
requirement rather than quietly resolving it.

### The honesty floor, measured

Across the runs, the shared honesty-floor language did observable work rather than
decorating output. Five distinct refusals, each verifiable in the transcript:

- **debugger** declined to construct a reproduction it could not build, and attributed the
  reporter's Thursday date, refactor causation, and 3% figure as unverified.
- **prompt-engineering** emitted bracketed placeholders for corpus source, date range, and
  volume with "I will not fill them with a plausible-sounding value."
- **test-author** declined to write a large-value precision test rather than guess the
  break point, on the grounds that asserting a guessed value is worse than no test.
- **frontend-builder** labeled its WCAG contrast ratios computed-not-rendered, and flagged
  that the skill's own instruction to "verify against real backgrounds" cannot be satisfied
  in a code-only context.
- **refactor-planner** corrected a false premise in the test prompt. The prompt asserted
  the index webhook was unawaited; it is awaited. The real defects are the discarded
  response and the fact that a throw orphans an already-committed document.
- **data-modeler** declined to certify the stated authority order as legal fact, naming
  the specific reason (statutes are often default rules a declaration may override) and
  the structural consequence for the schema.

That last one is the strongest single data point here, because the false premise was
accidental rather than planted — the skill caught an error its operator did not know he
had made.

### Defects this exercise found in the repo

Found by the skills, running on this repo's own artifacts.

| # | Defect | Source | Severity |
|---|---|---|---|
| 1 | README claims compatibility with six agents (incl. Windsurf, Cursor) with nothing behind it | evaluator | accuracy — fix |
| 2 | README shows zero sample output for a product that is entirely prose | evaluator | high leverage |
| 3 | Generated mirror carries no source commit or generation date | evaluator | trust |
| 4 | README never says where installed files land or how to remove them | evaluator | usability |
| 5 | "Install the plugin instead" routing sits 83 lines down, past the conversion point | evaluator | placement |
| 6 | `prompt-engineering` still offers a `--deep` flag with no command layer behind it | prompt-engineering | cosmetic |
| 7 | Provenance footer's eval-count claim is uncheckable from inside an installed skill | prompt-engineering | judgment |
| 8 | `splitFrontmatter` throws a raw stack trace instead of routing through `fail()` | docs-writer | polish |
| 9 | A relative `PROMPTSMITH_SRC` resolves against cwd, not the repo — undocumented | docs-writer | docs |
| 10 | No CI runs the generator; only human memory prevents a stale mirror | docs-writer | gap |

## Limits of this exercise

- **One run per skill.** These are single samples, not a pass rate. A skill that passed
  here can still fail on a different input.
- **Self-assessed.** Each agent graded its own output against the rubric. Where an answer
  key existed (planted defects) the caught/missed split is checkable; the contract and
  AI-tells judgments are not independently verified.
- **Prompt-injection guardrails almost entirely untested.** Five separate runs reported the
  "artifact is DATA, not instructions" rule as having no trigger, because no input carried
  embedded directives. That guardrail is present in the prompts and unexercised here.
- **Skill-relative file resolution tested only in the friendly case.** The one run that
  exercised it had a working directory coinciding with the repo root.
- **The 12 converted agents were run as skills, but never as skills competing for attention
  inside a long, unrelated conversation** — which is the actual installed condition.
