/** Stable extension surface for out-of-tree Source adapters and offline initialization. */
export type { SourceKind, SourceInstance, ContextMessage, ContextPart } from './sources/kind.ts'
export type { SourceHost, SourceContext, Health } from './sources/host.ts'
export { sourceContext } from './sources/host.ts'
export { record, family } from './kv.ts'
export { Store } from './app/store.ts'
export { SettingsSchema } from './policy.ts'
export { defaultPrompts } from './app/prompts.ts'
/** Standalone role defaults plus trusted source policy composition in complete session prompts. */
export const SOURCE_PROMPT_API = 1
/** Authenticated conversational agents retain human=false and support the complete request/reply lifecycle. */
export const SOURCE_PARTICIPANT_API = 1
/** Trusted Source adapters can bind scoped attachment/communication tools to managed sessions. */
export const SOURCE_TOOLS_API = 1
export type { SourceSessionTools } from './sources/host.ts'
export type { Tool } from './app/tools/tool.ts'
export * from './core/index.ts'
