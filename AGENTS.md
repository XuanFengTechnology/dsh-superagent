# XuanFeng Superagent fork

- Preserve upstream history and MIT attribution. `upstream` is deepseek-ai/dsh-superagent-prototype; `origin` is XuanFengTechnology/dsh-superagent.
- Keep generic deployment/extension changes small. Platform communication belongs in an out-of-tree Source adapter; never require a company server or credentials in the core.
- One installation can serve independent processes with separate state directories. Do not claim process/data separation is OS access isolation.
- Build and test before tagging releases. Upstream tracking opens review proposals; it must never auto-merge or deploy production employees.
- Publish only verified platform artifacts. A successful cross-compilation does not establish real host compatibility.
- Never place employee credentials, private platform source or business data in this public fork.
