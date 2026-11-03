# XuanFeng Superagent fork

- Preserve upstream history and MIT attribution. `upstream` is deepseek-ai/dsh-superagent-prototype; `origin` is XuanFengTechnology/dsh-superagent.
- Keep generic deployment/extension changes small. Platform communication belongs in an out-of-tree Source adapter; never require a company server or credentials in the core.
- One installation can serve independent processes with separate state directories. Do not claim process/data separation is OS access isolation.
- Build and test before tagging releases. Upstream tracking opens review proposals; it must never auto-merge or deploy production employees.
- Publish only verified platform artifacts. A successful cross-compilation does not establish real host compatibility.
- Never place employee credentials, private platform source or business data in this public fork.
- Communication invariant (Eric, 2026-11-03): trusted Sources may declare authenticated conversational agents with `human: false, participant: 'agent'`. Preserve their direct/group request, reply, acknowledgement and follow-up lifecycle across upgrades. Do not impose a human-only default or impersonate agents as people. Scope, task authorization, explicit stops and deduplication still apply; generic notification bots/CI remain separate. Run `tests/agent-participants.spec.ts` and the built extension smoke before releases. See `docs/009-agent-participants.md`.
