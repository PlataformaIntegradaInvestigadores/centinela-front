# PR Guidelines & Workflow

Adopted from the org's English-variant convention (`PR-GUIDELINES-EN.md`) as the
permanent PR/branch/CI workflow for **this repository**. One adaptation: this repo
has no ticket tracker wired in yet, so the `TICKET` suffix below is optional —
include it once a tracker exists, omit it until then.

---

## 1. Branches

```
feature/<kebab-slug>   → base: develop
hotfix/<kebab-slug>    → base: main
chore/<kebab-slug>     → base: develop
```

- Slug: English, kebab-case, describes the action — not a ticket.
- Before branching: `git switch develop && git pull` (or `main` for a hotfix). Never branch off a stale `feature/*`.
- CI enforces prefix **and** target-branch pairing — see §6.2. Wrong prefix/target fails the PR before build/test even runs.

Examples: `feature/coverage-baseline-gate`, `hotfix/fix-token-refresh-loop`, `chore/upgrade-angular-cli`.

---

## 2. PR title

```
type(scope) Summary[ - TICKET]
```

No colon after the scope.

| Element | Rule |
|---|---|
| `type` | `feat`, `fix`, `chore`, `test`, `refactor`, `docs` |
| `scope` | module/area name, consistent across every PR touching it — pick one and don't alias it |
| Summary | English, imperative or descriptive, lower-case after the scope |
| `TICKET` | omit until this repo has a tracker; once it does, use the tracker's ID |

Examples:
- `test(coverage) add unit tests for auth services and route guards`
- `fix(auth) keep session alive across token refresh`

---

## 3. PR body — 5 required sections

```markdown
## What was done?

Short, clear description of the change.

## Why?

The problem, requirement, or need that triggered this.

## How was it solved?

- Bullet list of the main technical changes, file by file when it adds clarity.

## Notes

Review/deploy/operational considerations. Always include the test count; include
coverage (%) whenever the test command reports it.

## Link

<Ticket URL, once a tracker exists — omit this section until then>
```

- Use `##` headings, never bold — headings drive GitHub's PR outline.
- `Notes`: minimum is the test count (`165/165 tests passing`). Include coverage
  (`34.47% statements, 19.81% branches, 25.48% functions, 35.18% lines`) whenever
  `ng test --code-coverage` reports it.
- The PR author is responsible for enough context that a reviewer understands the
  change without reading the full diff.

### Creating it

```bash
gh pr create --base develop --title "type(scope) Summary" --body-file pr-body.md
```

Always `--body-file`, never a heredoc directly in `--body`.

---

## 4. Commit messages

**Single rule, no drift**: the commit message reuses the PR title verbatim.

```
type(scope) Summary
```

For PRs with several intermediate commits, in-progress commits can be informal
(short imperative English, no scope needed) — only the final/merge commit needs to
match the PR title format exactly.

---

## 5. Pre-PR checklist

- [ ] Branch is `feature/*`/`chore/*` (→ develop) or `hotfix/*` (→ main), English slug, no ticket in the name
- [ ] `ng test --code-coverage` passes **locally** before pushing — don't rely on CI to catch it first
- [ ] Behavior change includes tests that **verify the result**, not just execution
- [ ] Bug fix includes a test that **fails without the fix**
- [ ] PR title: `type(scope) Summary`
- [ ] Body has all 5 sections, using `##` headings
- [ ] `Notes` has test count + coverage
- [ ] Commit message matches the PR title

---

## 6. CI/CD pipeline — the pattern this repo follows

### 6.1 Triggers

- Every PR opened against `develop` or `main` runs `ci.yml`.
- Every push to `develop` (i.e. every merge) also runs it, with extra stages unlocked.

### 6.2 Stage graph

```
branch-name-check (PR only, gates the PR, prefix ⇄ target-branch paired)
build-and-test (always, coverage-gated — see karma.conf.js)
  └─ build-docker (push to develop/main only)
       └─ deploy-staging (push to develop only)
```

1. **Branch-name check** — PR-only, runs before build/test. Verifies:
   - PR into `develop` comes from `feature/*` or `chore/*`.
   - PR into `main` comes from `develop` or `hotfix/*`.

2. **Build and test** — every PR and every push to `develop`. Runs
   `ng test --code-coverage`, which fails if coverage drops below the floor set in
   `karma.conf.js`'s `coverageReporter.check.global`. This alone is the merge gate —
   `build-docker`/`deploy-staging` are merge-triggered, not PR-triggered, so a red
   PR can't reach staging even if someone bypassed the review requirement.

3. **Build Docker image** — push to `develop`/`main` only, gated on tests passing.

4. **Deploy to staging** — push to `develop` only, right after build succeeds:
   `git reset --hard origin/develop` + `docker compose up -d --build` + healthcheck
   with automatic rollback on failure.

**Net effect: merging a PR to `develop` auto-deploys to staging, no separate
approval step.** This is why the pre-PR checklist in §5 matters — nothing else
gates a bad merge from reaching staging except the build-and-test stage.

### 6.3 Production release

- Triggered by pushing to `main` (currently via a reviewed PR from `develop`, not a
  release tag — unlike the source convention's tag-triggered model. Worth revisiting
  once this repo needs a distinct staging-vs-production promotion step instead of
  deploying whatever lands on `main`).
