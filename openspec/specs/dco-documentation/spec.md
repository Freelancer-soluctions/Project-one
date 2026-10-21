# dco-documentation Specification

## Purpose

Canonical, transversal DCO knowledge base for the repository — a single Spanish document that
explains DCO v1.1, the Signed-off-by trailer, the local hook contracts, CI enforcement, enforcement
tooling choices and known pitfalls, citing official sources and linking to the existing CI/CD
learning docs instead of duplicating them.

## Requirements

### Requirement: Canonical DCO document exists

The repository SHALL maintain `docs/learning/dco.md` as the canonical, transversal (cross-cutting)
Spanish-language document for everything DCO. It SHALL explain what the Developer Certificate of
Origin v1.1 is (the certification each signoff attests to) and SHALL distinguish DCO from a CLA
(Copyright Contributor License Agreement) — what each obliges the contributor to grant and why this
repository enforces DCO and not a CLA. It SHALL cite official sources (e.g. developercertificate.org
text, the DCO project, git documentation, enforcement-tool repositories) rather than restating them
without attribution.

#### Scenario: Document at the canonical path

- **WHEN** a developer or agent looks up how DCO works in this repository
- **THEN** `docs/learning/dco.md` exists, is written in Spanish, and is the single entry point for DCO knowledge

#### Scenario: DCO v1.1 and DCO vs CLA covered with citations

- **WHEN** reading the document's foundations section
- **THEN** it states what signing off certifies under DCO v1.1 and contrasts DCO with a CLA (license grant vs origin certification)
- **AND** it links to the official sources for both claims

### Requirement: Signed-off-by trailer format and mechanics documented

The document SHALL specify the exact trailer format `Signed-off-by: Name <email>` and the mechanics
that produce it in this repository — and ONLY those mechanics: the explicit `-s` flag (git signs as
the COMMITTER, so the trailer identity is the committer identity) and the automatic injection by
the `prepare-commit-msg` hook (identity resolved committer-first via `git var GIT_COMMITTER_IDENT`,
falling back to the author identity `git var GIT_AUTHOR_IDENT`; behaviourally identical to
`git commit -s`). Independently of what produces it, CI's KineticCafe parser SHALL be described as
the authoritative validator of the trailer's position and format (it validates; it does not
produce). The machine-local `git config commit.signoff true` convention SHALL NOT be listed among
the producing mechanisms — it produces nothing and is covered exclusively by the myth-debunking
requirement below.

#### Scenario: Canonical format stated

- **WHEN** a developer copies the trailer format from the document
- **THEN** it shows the canonical `Signed-off-by: Name <email>` line and how each producing mechanism (the explicit `-s` flag and the auto-signoff hook) emits it

#### Scenario: Identity resolution explained

- **WHEN** reading how the name and email are chosen
- **THEN** the document explains that the trailer identity is git's resolved committer identity (`git var GIT_COMMITTER_IDENT`, with the trailing `<timestamp> <tz>` stripped), falling back to the author identity when the committer is unresolvable, honouring `GIT_COMMITTER_NAME`/`GIT_COMMITTER_EMAIL` overrides primarily and `user.name`/`user.email` beneath — not a hardcoded placeholder

### Requirement: Local hook contracts documented

The document SHALL describe the contracts of the three local DCO hooks and their distinct roles:
`prepare-commit-msg` (automatic idempotent injection, merge commits exempt, never blocks the
commit, and NOT suppressible by `--no-verify`, so locally-created commits are signed by
construction), `commit-msg` (case-sensitive presence check over the full message, runs before
commitlint, rejects with guidance — the SINGLE local DCO validation gate), and `pre-push` (performs
NO DCO validation: it only runs `git fetch origin main`, the `origin/main` existence guard and the
scoped vitest tests, blocking the push only on their failure). The document SHALL state explicitly
that no push-time DCO validation layer exists locally. It SHALL stay consistent with the behavior
specified in this change’s `local-dco-validation` delta (`specs/local-dco-validation/spec.md`), to
be synced into the main spec `openspec/specs/local-dco-validation/spec.md` at archive.

#### Scenario: All three hook contracts described

- **WHEN** reading the hooks section
- **THEN** each of `prepare-commit-msg`, `commit-msg` and `pre-push` has its trigger, its DCO role (injects / validates / does not validate), its ordering relative to commitlint/vitest, and its exit semantics documented

#### Scenario: pre-push documented without DCO validation

- **WHEN** reading the `pre-push` contract
- **THEN** it is documented as fetch + `origin/main` guard + scoped tests only
- **AND** it states that DCO enforcement lives in `commit-msg` locally (the single local gate) and in the CI `DCO` check authoritatively

#### Scenario: No drift from the capability spec

- **WHEN** the `local-dco-validation` spec requirements change
- **THEN** the hook contracts in `docs/learning/dco.md` are updated to match, so the document never contradicts the spec

### Requirement: Enforcement tool comparison documented

The document SHALL compare the DCO enforcement tooling relevant to this repository —
`KineticCafe/actions-dco` (the CI check in use), the `probot/dco` GitHub App, and
`tim-actions/dco` — on at least: enforcement point (local hook vs CI check vs GitHub App), blocking
behavior, configuration effort, and bot handling. It SHALL state that `KineticCafe/actions-dco` is
this repository's L3 enforcement: a required, blocking `DCO` status check in `ci.yml` bound to
ruleset 21227644, and why that choice was made.

#### Scenario: Three-way comparison present

- **WHEN** evaluating alternative DCO tooling
- **THEN** the document compares KineticCafe, probot/dco and tim-actions/dco on enforcement point, blocking behavior, configuration and bot handling

#### Scenario: Repository choice justified

- **WHEN** reading why KineticCafe is used
- **THEN** the document identifies it as the required, blocking CI status check bound to the ruleset and gives the rationale for the choice

### Requirement: Known pitfalls documented

The document SHALL document at least these known pitfalls, each with its mitigation: (1) commits
made through the GitHub web UI (web-flow), which bypass every local hook and therefore receive no
local auto-signoff; (2) trailer loss when a multi-commit PR is squash-merged (the repository's
squash configuration uses `COMMIT_MESSAGES`, whose gotcha can drop per-commit trailers); (3) bot
commits (e.g. Dependabot), covered by the DCO check's well-known bot policy.

#### Scenario: Web-flow commits pitfall

- **WHEN** a change is committed via the GitHub web UI
- **THEN** the document explains that local hooks (including auto-signoff) do not run, and describes the resulting CI DCO behavior and mitigation

#### Scenario: Squash trailer-loss pitfall

- **WHEN** a PR with several signoff-carrying commits is squash-merged into main
- **THEN** the document explains the known trailer-loss gotcha of the squash message configuration and how to prevent or repair it

#### Scenario: Bot commits pitfall

- **WHEN** an automated bot (e.g. Dependabot) opens a commit or PR
- **THEN** the document documents the bot policy configured in the DCO enforcement layer so bot failures are recognized as expected rather than misdiagnosed

### Requirement: Layered local-to-CI design documented without duplication

The document SHALL explain the defense-in-depth layering of DCO in this repository: L0 the real git
identity the trailer is built from; L1 local auto-injection (`prepare-commit-msg`), which injects
the trailer even under `--no-verify`; L2 presence validation (`commit-msg`), the single local gate;
L3 the required, blocking CI `DCO` check (KineticCafe) as the non-bypassable backstop — and there is
NO pre-push DCO layer. It SHALL also document the accepted residual risk that commits can enter
local history without passing through the hooks (cherry-pick from a foreign branch, `HUSKY=0`,
hooks disabled, commits predating this change, tools that bypass hooks): such commits receive no
local auto-signoff and no local rejection, so they are caught only by the CI `DCO` check. It SHALL
link to `docs/learning/ci-cd/05-husky-git-hooks.md` and `docs/learning/ci-cd/05b-commit-signing.md`
for hook mechanics and signing-key setup instead of duplicating their content.

#### Scenario: Layering explained

- **WHEN** reading the design section
- **THEN** the four layers L0–L3 are described with their enforcement points (identity resolution, commit-time auto-signoff, commit-time validation, GitHub) and their bypass properties (CI is non-bypassable)
- **AND** no pre-push DCO layer appears in the model

#### Scenario: Residual risk of hook-bypassing commits documented

- **WHEN** reading how DCO is enforced locally
- **THEN** it lists the ways commits enter local history without the hooks (cherry-pick from a foreign branch, `HUSKY=0`, hooks disabled, commits predating this change, tools that bypass hooks)
- **AND** it states that such commits are no longer caught locally and are caught only by the CI `DCO` check

#### Scenario: Links instead of duplication

- **WHEN** comparing the document with `docs/learning/ci-cd/05-husky-git-hooks.md` and `docs/learning/ci-cd/05b-commit-signing.md`
- **THEN** overlapping topics are covered by links to those documents, not by restated copies of their content

### Requirement: Documentation correctly debunks the commit.signoff myth

The canonical document SHALL explicitly correct the `commit.signoff` misconception: `commit.signoff`
is NOT a git configuration variable — `git help --config` does not list it and `git commit` ignores
it, so `git config --global commit.signoff true` injects no `Signed-off-by` trailer at all (git
upstream deliberately refuses such a variable, to preserve the legal meaning of a deliberate
sign-off; the similarly named `format.signoff` applies only to `format-patch`, `am` and
`send-email`). The document SHALL identify the `prepare-commit-msg` hook as the only reliable local
auto-signoff automation path. Beyond the canonical document, this change SHALL take two distinct
actions on the project documents: (a) CORRECT `docs/CONTEXT-CICD.md`, which genuinely repeats the
myth at §10.5 (the config is claimed to auto-inject the trailer on every commit), §10.3, §10.4 and
§11.1, plus its header verification date; and (b) EXTEND `AGENTS.md`, which currently omits signoff
entirely (it only mentions `git commit -S` and the `--no-verify` prohibition) so that it documents
the real signoff mechanism and the `git commit -S -s` convention.

#### Scenario: Myth debunked with evidence

- **WHEN** reading the trailer mechanics section of `docs/learning/dco.md`
- **THEN** it states that `commit.signoff` is not a git configuration variable and that `git commit` ignores it, citing git upstream's deliberate refusal (gitfaq)
- **AND** it distinguishes `format.signoff` (limited to `format-patch`/`am`/`send-email`) and names the `prepare-commit-msg` hook as the only reliable local automation path

#### Scenario: CONTEXT-CICD myth repetitions are corrected

- **WHEN** reviewing `docs/CONTEXT-CICD.md` (§10.3, §10.4, §10.5, §11.1) after applying the change
- **THEN** none of its sections instructs `git config --global commit.signoff true` as a working auto-signoff mechanism
- **AND** they point to the real mechanisms instead: the explicit `-s` flag and the `.husky/prepare-commit-msg` hook

#### Scenario: AGENTS.md is extended with the signoff convention

- **WHEN** reviewing `AGENTS.md` after applying the change
- **THEN** it documents the real signoff mechanism (the explicit `-s` flag and the `.husky/prepare-commit-msg` hook) and the `git commit -S -s` convention, which it previously omitted entirely (it only stated `git commit -S` and the `--no-verify` prohibition)

#### Scenario: Convention is never presented as functional

- **WHEN** any repository document mentions the `commit.signoff` convention
- **THEN** it is framed as the debunked legacy belief being corrected, never as a mechanism that produces the trailer
