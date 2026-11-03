import { it, expect } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Store } from '../src/app/store.ts'
import { Prompts, defaultPrompts } from '../src/app/prompts.ts'
import { SourcePromptSections } from '../src/app/source-prompt-sections.ts'
import { mandateInstructions } from '../src/executor/dsh.ts'

it('standalone defaults and saved roles do not inherit repository business duties, including after restart', () => {
  const dir = mkdtempSync(join(tmpdir(), 'standalone-prompts-'))
  let store = new Store(join(dir, 'state.sqlite'))
  const create = () => new Prompts(store, () => 100000, () => [], () => false, 'standalone')
  try {
    let prompts = create()
    expect(prompts.current().config).toEqual(defaultPrompts('standalone'))
    expect(prompts.skills(prompts.current().config)).toEqual([])
    for (const role of ['orchestrator', 'worker'] as const) {
      const text = prompts.compose(prompts.current().config, role)
      expect(text).toContain('does not define your employer, identity, business role')
      expect(text).not.toContain("Act only as the deployment's GitHub account")
      expect(text).not.toContain("requests for the deployment's repository")
      expect(text).not.toContain('A code change without a PR is not ready')
      expect(text).not.toContain('small change internal to one module')
    }
    const custom = { ...prompts.current().config, scope: 'Approved job: research assistant.',
      skills: { research: 'Check primary evidence.' }, overrides: { 'runtime/worker': { text: 'Execute authorized research.' } } }
    const saved = prompts.save(custom, 0, 'panel')
    store.close(); store = new Store(join(dir, 'state.sqlite')); prompts = create()
    expect(prompts.current()).toEqual(saved)
    expect(prompts.compose(saved.config, 'worker')).toContain('Execute authorized research.')
    expect(prompts.skills(saved.config).map(([name]) => name)).toEqual(['research'])
    expect(prompts.preview(saved.config).worker).toEqual(prompts.compose(saved.config, 'worker'))
  } finally { store.close(); rmSync(dir, { recursive: true, force: true }) }
})

it('legacy three-section employee config adopts neutral built-ins without rewriting its saved role', () => {
  const dir = mkdtempSync(join(tmpdir(), 'legacy-employee-prompts-')), store = new Store(join(dir, 'state.sqlite'))
  try {
    const old = new Prompts(store, () => 100000, () => [], () => false)
    const saved = old.save({ communication: 'Use Chinese.', scope: 'Authorized employee tasks.', delivery: 'Return actual results.', skills: {} }, 0, 'panel')
    const upgraded = new Prompts(store, () => 100000, () => [], () => false, 'standalone')
    expect(upgraded.current()).toEqual(saved)
    for (const role of ['orchestrator', 'worker'] as const) {
      expect(upgraded.compose(saved.config, role)).toContain('Authorized employee tasks.')
      expect(upgraded.compose(saved.config, role)).not.toContain('deployment\'s repository')
    }
    expect(old.compose(saved.config, 'orchestrator')).toContain("deployment's repository")
    expect(mandateInstructions({ strength: 'inferred' }, true)).not.toContain('module')
    expect(mandateInstructions({ strength: 'inferred' })).toContain('module')
  } finally { store.close(); rmSync(dir, { recursive: true, force: true }) }
})

it('source policies refresh each request, reject duplicates and fail closed when unavailable', () => {
  const sections = new SourcePromptSections()
  let text = 'Authenticated employee A: conduct version 1.'
  const remove = sections.register('fixture:identity', () => text)
  expect(sections.render()).toContain(text)
  text = 'Authenticated employee B: updated conduct.'
  expect(sections.render()).toContain(text)
  expect(sections.render()).not.toContain('employee A')
  expect(() => sections.register('fixture:identity', () => 'other')).toThrow('duplicate')
  text = ''; expect(() => sections.render()).toThrow('unavailable')
  remove(); expect(sections.render()).toBe('')
})
