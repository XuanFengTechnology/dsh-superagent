import { describe, expect, it, vi } from 'vitest'
import { Engine, MemoryRepositories, followupOwners, isParticipant, key, waitsForPerson, type Candidate, type OutboundMessage, type Trigger } from '../src/core/index.ts'
import { SettingsSchema, settingsPolicy } from '../src/policy.ts'
import { SOURCE_PARTICIPANT_API } from '../src/extension.ts'
import { triggerCard } from '../src/app/cards.ts'
import { standaloneParts } from '../src/app/standalone-prompts.ts'

function message(id: string, extra: Partial<Trigger> = {}): Trigger {
  return { id, source: 'chat', threads: [{ source: 'chat', id: 'dm' }], actor: { source: 'chat', id: 'colleague' },
    human: false, participant: 'agent', addressed: 'direct', at: '2026-11-03T00:00:00Z', text: 'Please check the result.',
    channel: { source: 'chat', thread: 'dm', address: { reply_to: id } }, meta: { direct: true }, ...extra }
}
function harness() {
  const repo = new MemoryRepositories(), outbox: OutboundMessage[] = [], candidates: Candidate[] = []
  let time = 0
  let settings = SettingsSchema.parse({ eval: { mode: 'off' }, policy: { sources: { chat: { allowed: [], admission: {
    direct: { unlistedAddressed: 'explicit' }, group: { unlistedUnaddressed: 'inferred' },
  } } }, rules: [{ id: 'assigned', name: 'Assigned work', enabled: true, instruction: 'Clearly assigned requests from participants.' }] } })
  const scope = { scope: (input: { meta: Record<string, unknown> }) => input.meta.blocked
    ? { listened: false as const, reason: 'not_allowed' }
    : { listened: true as const, observed: !input.meta.direct, row: input.meta.direct ? 'direct' : 'group' } }
  const executor = { start: vi.fn(), deliver: vi.fn(), stop: vi.fn() }
  const policy = () => settingsPolicy(settings, scope)
  const engine = new Engine({ repo, scope, policy, executor, assessor: { request: c => { candidates.push(c) } },
    now: () => new Date(Date.UTC(2026, 10, 3, 0, 0, time)).toISOString(),
    outbox: { send: m => { if (!outbox.some(x => x.id === m.id)) outbox.push(m) }, status: id => outbox.some(x => x.id === id) ? 'pending' : undefined, withdraw: () => {} } })
  const accept = () => {
    engine.receive(message('request')); engine.evaluateDue()
    const decision = engine.decide('request', { kind: 'accept', title: 'Check result', scope: 'Check requested result', reason: 'assigned', acknowledgement: 'Checking.' })
    const ticket = repo.tickets.get(decision.ticketId!)!
    engine.assignmentStarted(ticket.id, ticket.assignments[0]!.id)
    return ticket.id
  }
  return { repo, engine, outbox, candidates, executor, accept, policy, scope,
    tick: () => time++, set: (extra: Record<string, unknown>) => { settings = SettingsSchema.parse({ ...settings, ...extra }) } }
}

describe('authenticated agent communication contract', () => {
  it('preserves real identity and keeps notification bots and untrusted metadata distinct', () => {
    expect(SOURCE_PARTICIPANT_API).toBe(1)
    expect(isParticipant(message('a'))).toBe(true)
    expect(isParticipant({ human: true })).toBe(true)
    expect(isParticipant(message('b', { participant: undefined, meta: { participant: 'agent', human: true } }))).toBe(false)
    expect(triggerCard(message('a'))).toMatchObject({ human: false, participant: 'agent' })
    expect(Object.values(standaloneParts).join('\n')).toContain('participant=agent')
    expect(Object.values(standaloneParts).join('\n')).toContain('do not generate reply loops')
  })
  it.each([false, true])('admits authorized direct participants with eval off, human=%s', human => {
    const h = harness(), input = message('a', human ? { human: true, participant: undefined } : {})
    expect(h.engine.receive(input)).toBe('stored'); h.engine.evaluateDue()
    expect(h.candidates[0]).toMatchObject({ strength: 'explicit', triggers: [expect.objectContaining({ human })] })
    h.engine.reply({ purpose: 'answer', triggerId: 'a', text: 'Ready.' })
    h.engine.reply({ purpose: 'answer', triggerId: 'a', text: 'Ready.' })
    expect(h.outbox).toHaveLength(1)
    expect(h.outbox[0]?.channel.address.reply_to).toBe('a')
    expect(h.engine.receive(input)).toBe('duplicate')
  })
  it('applies group admission and preserves scope, pause and generic bot restrictions', () => {
    const h = harness()
    h.engine.receive(message('blocked', { meta: { blocked: true } })); h.engine.evaluateDue()
    expect(h.repo.triggers.disposition('blocked')?.filtered).toBeDefined()
    h.engine.receive(message('bot', { participant: undefined })); h.engine.evaluateDue()
    expect(h.candidates).toHaveLength(0)
    h.set({ paused: true }); h.engine.receive(message('paused')); h.engine.evaluateDue()
    expect(h.candidates).toHaveLength(0)
    const g = harness(); g.set({ eval: { mode: 'auto' } })
    g.engine.receive(message('group', { addressed: undefined, meta: { direct: false } })); g.engine.evaluateDue()
    expect(g.candidates[0]?.strength).toBe('inferred')
    expect(() => g.engine.decide('group', { kind: 'accept', title: 'x', scope: 'x', reason: 'x' })).toThrow()
  })
  it('supports acknowledgements, follow-up ownership, questions, answers and results without impersonation', () => {
    const h = harness(), id = h.accept()
    expect(h.outbox[0]?.id).toBe(key('ack', 'request'))
    expect(h.repo.triggers.get('request')).toMatchObject({ human: false, participant: 'agent' })
    h.tick(); h.engine.receive(message('followup'))
    expect(followupOwners(message('followup'), h.repo)).toEqual([id])
    expect(h.repo.tickets.get(id)?.inputs).toEqual([expect.objectContaining({ participant: 'agent', triggerId: 'followup' })])
    h.engine.reply({ purpose: 'acknowledgement', ticketId: id, triggerId: 'followup', text: 'Checking this too.' })
    h.engine.report(id, { state: 'blocked', summary: 'Need format', question: 'Which format?', askedBy: 'followup' })
    h.engine.reply({ purpose: 'attention', ticketId: id, question: 'Which format?', text: 'Which format?' })
    expect(waitsForPerson(h.repo.tickets.get(id)!)).toBe(true)
    h.tick(); h.engine.receive(message('format', { text: 'Use the existing format.' }))
    expect(waitsForPerson(h.repo.tickets.get(id)!)).toBe(false)
    h.engine.report(id, { state: 'progress', summary: 'Checked.', question: null, answers: 'followup' })
    h.engine.reply({ purpose: 'answer', triggerId: 'followup', text: 'The check passed.' })
    h.engine.report(id, { state: 'ready', summary: 'Complete.' })
    h.engine.reply({ purpose: 'result', ticketId: id, text: 'Complete.' })
    expect(h.outbox.at(-1)?.channel.address.reply_to).toBe('request')
  })
  it('resumes completed work for agent follow-ups, but never overrides an explicit stop or context-only subscription', () => {
    const h = harness(), id = h.accept()
    h.engine.report(id, { state: 'ready', summary: 'Done.' })
    expect(h.repo.tickets.get(id)?.ended).toBeDefined()
    h.tick(); h.engine.receive(message('additional'))
    expect(h.repo.tickets.get(id)?.ended).toBeUndefined()
    h.engine.stopTicket(id); h.engine.receive(message('after-stop'))
    expect(h.repo.tickets.get(id)?.ended?.by).toBe('human')
    expect(followupOwners(message('after-stop'), h.repo)).toEqual([])
    const c = harness(), other = c.accept()
    c.engine.followForContext(other, { source: 'chat', id: 'context' })
    c.engine.report(other, { state: 'ready', summary: 'Done.' })
    c.engine.receive(message('context-message', { threads: [{ source: 'chat', id: 'context' }] }))
    expect(c.repo.tickets.get(other)?.ended).toBeDefined()
  })
})
