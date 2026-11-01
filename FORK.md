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

Before updating a running employee, wait for an idle maintenance boundary, back up its database, and retain its private identity/history. A database migration may make the old binary incompatible; restore the pre-upgrade backup when required. An intentional stop or unresolved tool result must never be bypassed by an updater.
