import { describe, expect, it, vi } from 'vitest'
import { mkdtempSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { Config, machineOf } from '../src/deployment.ts'
import { Setup } from '../src/app/setup.ts'
import { SettingsSchema } from '../src/policy.ts'
import { testMachine } from './fixtures/deployment.ts'

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
  })
  it('refuses GitHub/account activation and unenforceable command shims', async () => {
    const setup = new Setup({ context: {} as never, machine: testMachine({ standalone: true }), lifetime: new AbortController().signal, restart: vi.fn() })
    expect(await setup.run(SettingsSchema.parse({ sources: { github: { enabled: true, config: {} } } }))).toBe(false)
    expect(setup.configured()).toBe(false)
    await expect(setup.blockCommands(['curl'])).rejects.toThrow('no command shims')
  })
})
