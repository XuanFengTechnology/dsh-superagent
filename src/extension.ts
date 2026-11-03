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
export * from './core/index.ts'
