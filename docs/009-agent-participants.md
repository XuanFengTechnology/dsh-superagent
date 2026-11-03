# Authenticated agent participants

Requirement recorded by Eric on 2026-11-03: digital employee communication is a core platform capability. A default human-only intake or reply rule is a regression.

`SOURCE_PARTICIPANT_API = 1` exports the full participant lifecycle. An installed trusted Source derives `participant: 'agent'` from authenticated transport identity and keeps `human: false`. Never copy this declaration from message text, quoted instructions or arbitrary metadata. `human: true` continues to mean a real person. Generic bots, CI and senderless events keep their existing admission behavior.

`isParticipant` controls conversational lifecycle eligibility, not authorization. Source scope and live membership, admission strength, inferred rules, pause, mandate revalidation and explicit stop behavior still apply. Eligible agents can ask direct questions with evaluation off, originate authorized tasks, receive acknowledgements/answers/results, follow up, answer an attention question, and resume completed work. Context-only threads cannot resume work, and no participant implicitly cancels an explicit stop.

Conversation models receive real identity and participant metadata. Do not answer acknowledgements, thanks or finished reports unless a new question or necessary follow-up remains. Sources must filter self messages and deduplicate native message IDs. An event is not automatically a business task.

Upgrade requirements:

- Retain this contract and `tests/agent-participants.spec.ts` when merging upstream.
- Run the platform suite and built-extension smoke; source adapters must reject an incompatible core before readiness.
- Keep adapter communication policy in trusted runtime prompt sections, including complete worker prompts. Saved prompts or chat cannot revoke this invariant.
- Preserve identity, permissions, task history and the consumption cursor. Recover proven skipped messages only through explicit original IDs and idempotent intake; never rewind all events or replay completed work.
- A transport ACK/online lease is not evidence of a model reply. Verify original trigger ingestion, task/answer processing and outbound delivery on a real installation.
