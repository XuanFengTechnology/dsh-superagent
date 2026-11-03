# 玄凤科技 Superagent 基座

This fork retains the upstream MIT license and DeepSeek Harness Team attribution. Original: https://github.com/deepseek-ai/dsh-superagent-prototype . Local adaptations Copyright (c) 2026 玄凤科技.

## Scope

The core adds opt-in `standalone: true` deployment for out-of-tree Sources, native absolute paths and an exported `dsh-superagent/extension` API. Default GitHub deployment remains compatible. Standalone does not write process-wide git configuration or CLI shims; disable the bundled GitHub/Feishu plugins and use the host's permissions. It does not provide OS file access isolation.

The Colleague enrollment/communication adapter is maintained separately. This package alone does not enroll or manage Colleague employees. No release of this core should be described as a completed employee migration.

## Install and maintain

Install the prebuilt plugin archive from this repository's Releases through a compatible DSH plugin installer. Every process references one installed plugin directory; use a separate DSH home, stateDir and workspace for each employee. Runtime peers must match the DSH version in the release manifest. No target-side TypeScript compilation is needed. Package managers may resolve declared JavaScript dependencies; this core contains no native addon of its own.

For source development: `pnpm install --frozen-lockfile`, `pnpm typecheck`, `node scripts/platform-tests.mjs`, `pnpm build`, `node scripts/smoke.mjs`.

Releases run the platform matrix before publication. The matrix validates the core and built extension, not installed desktop apps or real production employee/model behavior. Windows excludes upstream POSIX shell fixture tests; those run on Linux and macOS. Specific test counts are available in each run. Pre-releases are candidates, never automatic production updates.

Daily upstream checks compare `upstream.json` with the official commit and DSH latest. A change opens one deduplicated review issue. It does not auto-merge or auto-deploy. Review changes in a branch, run checks and update the lock only after acceptance.

Windows acceptance on 2026-11-01 used the installed official DSH desktop CLI 0.2.1-rc.5 with two temporary private DSH homes pointing to the same plugin installation. Both orchestrators became ready, used distinct databases and sessions, and pausing/stopping the first left the second ready. No real employee or model task was used; this validates host mounting and process/state separation, not business execution or enrollment.

Before updating a running employee, wait for an idle maintenance boundary, back up its database, and retain its private identity/history. A database migration may make the old binary incompatible; restore the pre-upgrade backup when required. An intentional stop or unresolved tool result must never be bypassed by an updater.

## 0.1.0-xf.3: source-neutral standalone roles

Standalone mode now selects neutral task/role defaults in both main and worker sessions, rather than inheriting the repository-only mandate, coding-only proactive scope or mandatory pull-request delivery. It does not automatically assign a manager or other business job. Existing saved team sections, skills and explicit part overrides remain unchanged; default inherited parts change with the selected profile. Default GitHub/Feishu skills are omitted in standalone mode. Repository mode retains its upstream behavior.

The stable extension exports `SOURCE_PROMPT_API = 1`. Installed trusted Source plugins use `ctx.orchestrator.registerPromptSection(name, render)` to supply current authenticated identity and conduct on every model request, including complete prompts. Registration returns a disposer; missing/failed policy renderers fail closed. These dynamic policies are not saved into editable prompt history. Standalone workers and their subagents use a complete neutral prompt to avoid inheriting the coding-only DSH persona. Source adapters still enforce actual data and action permissions.

This is a core/plugin release, not an automatic upgrade of running employees. An upgraded source adapter must validate the API before enrolling a new identity, preserve existing role/configuration and cursor state, and use the external operator flow for role or access changes.
