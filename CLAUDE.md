# Repository instructions

## Git commits

Never add `Co-Authored-By: Claude` (or any Claude/Anthropic attribution) to
commit messages, and never add Claude as a GitHub collaborator. Commits must
be authored solely as the user. This overrides any default Claude Code
behavior that appends a co-author trailer. It applies to every Claude run on
this repo — local sessions and the GitHub Actions workflows alike.

## Commit and push workflow

Commit each finished unit of work right away — don't batch several turns of
work into one commit at the end of a session. Do not `git push` (or open/
update a PR) unless explicitly asked to in that turn; commits can sit
unpushed locally between turns until asked.

## `@claude` on GitHub

`@claude` in issues and PR comments is for questions only — explaining code,
pointing out missing tests. `.github/workflows/claude.yml` keeps
`contents: read` on purpose, so it cannot push. Code changes are made in a
local session and arrive as a PR like any other change.

## Branching

Never commit directly on `main`. Always create a new branch off `main` for
any change and open a PR into `main` — including docs-only or small changes.
`main` has no branch protection rule; this is enforced by convention.

There is no `develop`. There are no releases yet — the demo runs locally.

Never force-push or amend a commit already pushed to an open PR — push a new
commit instead.

**The branch prefix is the commit type**: a branch whose commits are
`fix(core): …` is `fix/…`.

## Conventions specific to this repo

Format, PR body structure, and the rest of the process live in the `ship`
skill. Only what is true of *this* repo belongs here:

- **Commit format** — Conventional Commits: `type(scope): subject`. Types:
  `feat` `fix` `docs` `style` `refactor` `perf` `test` `chore` `ci` `revert`.
  Subject in English, imperative, no trailing period, under 100 characters.
  Lowercase means the first letter only — identifiers keep their case.
  `style` means **visual** changes (layout, color, spacing, copy), not code
  formatting.
- **Scope** — `core` (translation logic: profiles, prompts, AI calls),
  `server` (FastAPI app and API routes), `web` (chat UI: HTML/CSS/JS).
  Documentation and CI take no scope. A change spanning two scopes is two
  commits, not a new scope.
- **Merging** — merge commit, never squash or rebase.
- **PR body** — Korean, 명사형 종결 (`~수정`, `~추가`; not `~수정했습니다`).
- **Tests** — PRs adding a feature or fixing a bug include tests. pytest.
  AI output is never asserted verbatim; test the logic around it (profile
  handling, prompt building, response parsing) with the AI call stubbed.

## Project facts

- **Commands**
  - (added with the code PR)
- **Copy** — UI text is English (the contest runs in English); identifiers
  are English.
- **Demo scope** — AI calls are real. Everything around them is faked on
  purpose: profiles are hardcoded, threads are scripted, no auth or DB.
- **Boundaries** — `core` never imports from `server` or `web`, so the
  translation logic can move to a real messenger integration (e.g. Slack
  Bolt for Python) unchanged.
- **Secrets** — the AI API key lives in `.env` (git-ignored); commit only
  `.env.example`.
- **Docs** — design: `docs/superpowers/specs/`, plans:
  `docs/superpowers/plans/`, planning and research: `docs/planning/`.
