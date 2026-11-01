import { describe, expect, it, vi } from 'vitest'
import { mkdtempSync, existsSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { Config, machineOf } from '../src/deployment.ts'
import { Setup } from '../src/app/setup.ts'
import { SettingsSchema } from '../src/policy.ts'
import { testMachine } from './fixtures/deployment.ts'
import { Settings } from '../src/app/settings.ts'
import { Store } from '../src/app/store.ts'
import { SourceRegistry } from '../src/sources/registry.ts'

describe('standalone source deployment', () => {
  it('accepts native absolute paths and rejects relative/home shorthand paths', () => {
    for (const stateDir of ['/srv/employee', 'C:\\Employees\\one', '\\\\server\\share\\employee']) {
      expect(machineOf(Config({ stateDir, standalone: true })).standalone).toBe(true)
    }
    for (const stateDir of ['../state', 'C:relative', '~/.state']) expect(() => Config({ stateDir })).toThrow()
  })
  it('becomes configured without GitHub credentials, CLI probes, or changing process environment', async () => {
    const stateDir = mkdtempSync(join(tmpdir(), 'xf-standalone-'))
    const spawn = vi.fn(() => { throw new Error('must not spawn') })
    const setup = new Setup({ context: { subprocess: { spawn } } as never, machine: testMachine({ stateDir, standalone: true }), lifetime: new AbortController().signal, restart: vi.fn() })
    const before = { ...process.env }
    expect(await setup.run(SettingsSchema.parse({}))).toBe(true)
    expect(setup.configured()).toBe(true)
    expect(setup.deployment.repository).toBe('')
    expect(spawn).not.toHaveBeenCalled()
    expect(process.env).toEqual(before)
    expect(existsSync(join(stateDir, 'worker-gitconfig'))).toBe(false)
    setup.restore()
    rmSync(stateDir, { recursive: true, force: true })
  })
  it('refuses GitHub/account activation and unenforceable command shims', async () => {
    const setup = new Setup({ context: {} as never, machine: testMachine({ standalone: true }), lifetime: new AbortController().signal, restart: vi.fn() })
    expect(await setup.run(SettingsSchema.parse({ sources: { github: { enabled: true, config: {} } } }))).toBe(false)
    expect(setup.configured()).toBe(false)
    await expect(setup.blockCommands(['curl'])).rejects.toThrow('no command shims')
  })
  it('rejects unsupported settings before persisting or notifying workers', async () => {
    const stateDir = mkdtempSync(join(tmpdir(), 'xf-settings-'))
    const store = new Store(join(stateDir, 'state.sqlite'))
    const lifetime = new AbortController().signal
    const setup = new Setup({ context: {} as never, machine: testMachine({ stateDir, standalone: true }), lifetime, restart: vi.fn() })
    const notify = vi.fn()
    try {
      await setup.run(store.settings())
      const settings = new Settings({ store, sources: new SourceRegistry(() => store.settings()), setup, context: {}, lifetime,
        sessions: { notify, delivery: vi.fn() }, engine: {}, health: {}, sourceHost: {}, requestPass: vi.fn() } as never)
      await expect(settings.save('executor', { ...store.settings().executor, blockedCommands: ['curl'] }, 0, 'panel')).rejects.toThrow('Standalone mode')
      expect(store.settings().executor.blockedCommands).toEqual([])
      expect(store.blockRevision('executor')).toBe(0)
      expect(notify).not.toHaveBeenCalled()
    } finally { store.close(); rmSync(stateDir, { recursive: true, force: true }) }
  })
})
