import test from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { chmodSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const launcher = new URL('../servers/docket.mjs', import.meta.url).pathname
const run = (env, input = '') => new Promise(resolve => {
  const child = spawn(process.execPath, [launcher], { env: { ...process.env, HOME: mkdtempSync(join(tmpdir(), 'home-')), ...env } })
  let out = ''
  let err = ''
  child.stdout.on('data', chunk => { out += chunk })
  child.stderr.on('data', chunk => { err += chunk })
  child.on('exit', code => resolve({ code, out, err }))
  child.stdin.end(input)
})

test('the launcher runs Docket in MCP mode and passes stdio through', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'docket-'))
  const bin = join(dir, 'docket')
  writeFileSync(bin, '#!/bin/sh\necho "args:$*"\ncat\nexit 3\n')
  chmodSync(bin, 0o755)
  const { code, out } = await run({ DOCKET_BIN: bin }, '{"jsonrpc":"2.0"}\n')
  assert.equal(out, 'args:--mcp\n{"jsonrpc":"2.0"}\n')
  assert.equal(code, 3)
})

test('the launcher explains a missing Docket install', async () => {
  const { code, err } = await run({ DOCKET_BIN: '' })
  assert.equal(code, 1)
  assert.match(err, /command-line tool was not found/)
})
