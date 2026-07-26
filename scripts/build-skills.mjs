#!/usr/bin/env node
/**
 * build-skills.mjs — regenerates skills/ from the promptsmith source repo.
 *
 * WHY THIS EXISTS
 * ---------------
 * promptsmith (github.com/emtcmca/promptsmith) is a Claude Code plugin. Its agent
 * prompts live in `agents/<name>.md` and its plugin skills live in
 * `skills/<name>/SKILL.md`.
 * skills.sh only indexes `skills/<name>/SKILL.md`, and adding directories to the
 * plugin's own `skills/` folder would change what the plugin loads.
 *
 * So this repo is a *distribution mirror*: promptsmith stays the single source of
 * truth and is never edited, and this script copies the prompt bodies over here
 * into the layout skills.sh expects. Run it whenever promptsmith changes.
 *
 * USAGE
 *   node scripts/build-skills.mjs
 *   PROMPTSMITH_SRC="C:/Dev/promptsmith" node scripts/build-skills.mjs
 *
 * Zero dependencies — Node stdlib only.
 */

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, readdirSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(HERE, '..')

// Where the promptsmith source repo lives. Defaults to a sibling directory so a
// plain `git clone` of both repos side by side works with no configuration.
const SRC = resolve(process.env.PROMPTSMITH_SRC ?? join(REPO, '..', 'promptsmith'))

/**
 * The curated skill set.
 *
 * `from` picks the source layout:
 *   'agent' -> <SRC>/agents/<id>.md          (a subagent system prompt)
 *   'skill' -> <SRC>/skills/<id>/SKILL.md    (an existing plugin skill)
 *
 * `description` intentionally OVERRIDES whatever the source file says. The source
 * descriptions are tuned for Claude Code's subagent router; these are tuned for
 * skills.sh discovery, which matches on the description text. Same prompt body,
 * different shop window. Overriding here is what keeps promptsmith unedited.
 */
const SKILLS = [
  {
    id: 'prompt-engineering',
    from: 'skill',
    description:
      'Sharpen a vague request into a complete prompt, author a reusable agent or system prompt, or review a draft prompt through expert lenses. Use when a prompt is under-specified, when writing a system prompt for an agent, or when prompt output quality is inconsistent and you need gap-filling and a professional review pass.',
    // This skill reads supporting files at runtime. In the plugin they resolve via
    // ${CLAUDE_PLUGIN_ROOT}; here there is no plugin root, so the files are copied
    // into the skill's own directory and the paths below are rewritten to match.
    bundle: ['lenses', 'templates'],
    // Same problem inside a bundled file: it cross-references a plugin command doc
    // that does not ship here.
    bundleRewrite: [
      [
        'lenses/ai-tells.md',
        'second-pass result in both directions (see `commands/lens.md` Step 6).',
        "second-pass result in both directions (see the LENS route's synthesize step).",
      ],
    ],
    rewrite: [
      [
        '1. Built-in: `${CLAUDE_PLUGIN_ROOT}/lenses/` — this plugin\'s install directory, substituted\n' +
          '   automatically. Standalone install (no plugin root): `~/.claude/promptsmith-lenses/`.\n' +
          '   **Never resolve this against the user\'s working directory.**',
        '1. Built-in: the `lenses/` directory bundled alongside this SKILL.md — resolve it\n' +
          '   relative to this skill\'s own directory.\n' +
          '   **Never resolve this against the user\'s working directory.**',
      ],
      [
        '- SHARPEN → `${CLAUDE_PLUGIN_ROOT}/templates/sharpened-prompt.md`\n' +
          '- FORGE → `${CLAUDE_PLUGIN_ROOT}/templates/agent-system-prompt.md`\n' +
          '- GRADE → `${CLAUDE_PLUGIN_ROOT}/templates/graded-prompt.md`\n' +
          '\n' +
          '(Standalone install: `~/.claude/promptsmith-templates/`. These are plugin-bundled files — never\n' +
          'resolve them against the user\'s working directory.)\n' +
          '- LENS → findings list (no template; see /lens command)',
        '- SHARPEN → `templates/sharpened-prompt.md`\n' +
          '- FORGE → `templates/agent-system-prompt.md`\n' +
          '- GRADE → `templates/graded-prompt.md`\n' +
          '\n' +
          '(These are bundled alongside this SKILL.md — resolve them relative to this skill\'s own\n' +
          'directory, never against the user\'s working directory.)\n' +
          '- LENS → findings list (no template)',
      ],
      [
        'If the command already names the path (`/sharpen`, `/forge-agent`, `/lens`; `/lens --grade` for\n' +
          'the GRADE route), use it.',
        'If the request already names the route (sharpen, forge an agent, lens, or grade), use it.',
      ],
    ],
  },
  {
    id: 'debugger',
    from: 'agent',
    description:
      'Turn a stack trace, exception, failing test, or bug report into ranked root-cause hypotheses plus the cheapest observation that confirms or kills each one. Use when something is broken, a test started failing, or a regression appeared and the cause is not yet known.',
  },
  {
    id: 'test-author',
    from: 'agent',
    description:
      'Write focused tests that prove behavior through the public interface, naming what each test proves. Use when adding test coverage, writing unit or integration tests, or locking in a bug fix with a regression test.',
  },
  {
    id: 'security-review',
    from: 'agent',
    description:
      'Review a change for how it gets attacked, abused, or leaked, ranked by real-world impact rather than checklist severity. Use when code touches authentication, authorization, untrusted input, secrets, payments, file uploads, or personal data.',
  },
  {
    id: 'data-modeler',
    from: 'agent',
    description:
      'Turn requirements into a sound database schema plus a safe migration path. Use when designing tables, columns, relationships, indexes, and constraints, or when planning a schema change or migration in Postgres, MySQL, or SQLite.',
  },
  {
    id: 'planner',
    from: 'agent',
    description:
      'Turn a goal or spec into an ordered, dependency-aware task plan with acceptance criteria and a named critical path. Use when work needs breaking down and sequencing before implementation starts.',
  },
  {
    id: 'refactor-planner',
    from: 'agent',
    description:
      'Turn messy code plus a goal into a safe, staged refactor plan where every step leaves the build green. Use when restructuring, untangling, or cleaning up existing code without changing its behavior.',
  },
  {
    id: 'feature-spec',
    from: 'agent',
    description:
      'Turn a rough feature idea into a tight, buildable specification with scope, acceptance criteria, and an explicit cut line. Use when an idea, ticket, or request needs to become something a team can actually build.',
  },
  {
    id: 'docs-writer',
    from: 'agent',
    description:
      'Document code, a feature, or an API so the next person can use it without asking — README, usage guide, or architecture decision record. Use when writing or improving developer-facing documentation.',
  },
  {
    id: 'api-reviewer',
    from: 'agent',
    description:
      'Review an existing HTTP endpoint or API contract for correctness, contract clarity, and abuse potential. Use when a REST or GraphQL surface needs review before it ships.',
  },
  {
    id: 'backend-builder',
    from: 'agent',
    description:
      'Build an endpoint or backend service to a stated contract — input-validated, authorized, and idempotent. Use when implementing server-side functionality, API routes, or business logic rather than reviewing it.',
  },
  {
    id: 'frontend-builder',
    from: 'agent',
    description:
      'Build UI components that are usable, accessible, and on-brand, covering loading, empty, and error states. Use when implementing user-facing interface work in React or any component framework.',
  },
  {
    id: 'evaluator',
    from: 'agent',
    description:
      'Grade an artifact against named criteria and return a scored verdict plus the highest-leverage fixes, deriving a rubric if none is supplied. Use to score and iterate on a prompt, doc, plan, spec, UI, or piece of copy.',
  },
]

const PROVENANCE =
  '---\n\n' +
  '_Generated from [promptsmith](https://github.com/emtcmca/promptsmith) — prompt & context ' +
  'engineering for agents. The promptsmith project ships 37 eval cases and 6 known-bad ' +
  'regression fixtures. Apache-2.0._\n'

/**
 * Splits a markdown file into its YAML frontmatter block and its body.
 * Normalises CRLF to LF first — the source repo is authored on Windows, and
 * leaving CRLF in would make the frontmatter delimiter match unreliable.
 */
function splitFrontmatter(raw, path) {
  const text = raw.replace(/\r\n/g, '\n')
  if (!text.startsWith('---\n')) {
    throw new Error(`${path}: expected YAML frontmatter starting with '---'`)
  }
  const end = text.indexOf('\n---\n', 3)
  if (end === -1) {
    throw new Error(`${path}: frontmatter block is never closed`)
  }
  return {
    frontmatter: text.slice(4, end + 1),
    body: text.slice(end + 5).trimStart(),
  }
}

/**
 * YAML-quotes a description for the generated frontmatter. Descriptions contain
 * commas, colons and em-dashes, so they must be quoted; double quotes inside are
 * escaped. Keeping this explicit avoids pulling in a YAML dependency.
 */
function yamlString(value) {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

function sourcePath(skill) {
  return skill.from === 'agent'
    ? join(SRC, 'agents', `${skill.id}.md`)
    : join(SRC, 'skills', skill.id, 'SKILL.md')
}

function fail(...lines) {
  for (const line of lines) console.error(line)
  process.exit(1)
}

/** Anything matching this in a generated file would be a dead reference here. */
const DEAD_REF = /CLAUDE_PLUGIN_ROOT|(?:docs|evals|agents|commands)\/[A-Za-z0-9._-]+\.md/

/**
 * PASS 1 — read every source, apply and verify every rewrite, and assemble the
 * full output in memory. Writes nothing.
 *
 * This pass exists so a validation failure can't leave the repo half-built. The
 * emit pass deletes skills/ before writing, so any exit *after* that point would
 * destroy the previous good output. Everything that can fail, fails here first.
 */
function collect() {
  const plans = []

  for (const skill of SKILLS) {
    const src = sourcePath(skill)
    if (!existsSync(src)) fail(`ERROR: source file missing: ${src}`)

    let { body } = splitFrontmatter(readFileSync(src, 'utf8'), src)

    // Each rewrite must still match. If promptsmith reworded one of these
    // passages the rewrite silently stops applying, and we would ship a skill
    // pointing at a file that does not exist here. Fail loudly instead.
    for (const [from, to] of skill.rewrite ?? []) {
      if (!body.includes(from)) {
        fail(
          `ERROR: ${skill.id}: rewrite no longer matches its source text.`,
          `Expected to find:\n---\n${from}\n---`,
          `Update the rewrite in scripts/build-skills.mjs to match ${src}.`,
        )
      }
      body = body.split(from).join(to)
    }

    const skillMd =
      `---\n` +
      `name: ${skill.id}\n` +
      `description: ${yamlString(skill.description)}\n` +
      `---\n\n` +
      `${body.trimEnd()}\n\n` +
      PROVENANCE

    const deadInSkill = skillMd.match(DEAD_REF)
    if (deadInSkill) {
      fail(
        `ERROR: ${skill.id}: SKILL.md references '${deadInSkill[0]}', which does not ship here.`,
        `Add a rewrite for it, or drop this skill from SKILLS.`,
      )
    }

    // Read the supporting files this skill loads at runtime, apply their
    // rewrites, and check them for dead references too.
    const files = []
    const rewritesByPath = new Map(
      (skill.bundleRewrite ?? []).map(([relPath, from, to]) => [relPath, { from, to }]),
    )

    for (const dir of skill.bundle ?? []) {
      const bundleSrc = join(SRC, dir)
      if (!existsSync(bundleSrc)) fail(`ERROR: ${skill.id}: bundle directory missing: ${bundleSrc}`)

      for (const name of readdirSync(bundleSrc).filter((f) => f.endsWith('.md'))) {
        const relPath = `${dir}/${name}`
        let text = readFileSync(join(bundleSrc, name), 'utf8').replace(/\r\n/g, '\n')

        const rw = rewritesByPath.get(relPath)
        if (rw) {
          if (!text.includes(rw.from)) {
            fail(
              `ERROR: ${skill.id}: bundle rewrite no longer matches ${relPath}.`,
              `Expected to find:\n---\n${rw.from}\n---`,
            )
          }
          text = text.split(rw.from).join(rw.to)
          rewritesByPath.delete(relPath)
        }

        const dead = text.match(DEAD_REF)
        if (dead) {
          fail(
            `ERROR: ${skill.id}: ${relPath} references '${dead[0]}', which does not ship here.`,
            `Add a bundleRewrite entry for it.`,
          )
        }

        files.push({ relPath, text })
      }
    }

    // A bundleRewrite naming a file that no longer exists is dead config, and
    // usually means the file was renamed upstream. Surface it.
    for (const relPath of rewritesByPath.keys()) {
      fail(`ERROR: ${skill.id}: bundleRewrite targets '${relPath}', which was not found in the bundle.`)
    }

    plans.push({ id: skill.id, from: skill.from, skillMd, files })
  }

  return plans
}

/** PASS 2 — everything validated, now write. */
function emit(plans) {
  // Rebuild from scratch so a skill removed from SKILLS actually disappears
  // instead of lingering as a stale directory.
  const outRoot = join(REPO, 'skills')
  rmSync(outRoot, { recursive: true, force: true })

  for (const plan of plans) {
    const out = join(outRoot, plan.id)
    mkdirSync(out, { recursive: true })

    for (const file of plan.files) {
      const dest = join(out, file.relPath)
      mkdirSync(dirname(dest), { recursive: true })
      writeFileSync(dest, file.text, 'utf8')
    }

    writeFileSync(join(out, 'SKILL.md'), plan.skillMd, 'utf8')

    const extra = plan.files.length ? ` + ${plan.files.length} bundled files` : ''
    console.log(`  wrote skills/${plan.id}/SKILL.md  (${plan.from})${extra}`)
  }
}

function main() {
  if (!existsSync(SRC)) {
    fail(
      `ERROR: promptsmith source not found at: ${SRC}`,
      `Clone it next to this repo, or set PROMPTSMITH_SRC to its path.`,
    )
  }

  const plans = collect()
  emit(plans)

  console.log(`\nGenerated ${plans.length} skills from ${SRC}`)
}

main()
