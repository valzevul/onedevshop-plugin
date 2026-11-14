import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const candidates = [process.env.DOCKET_BIN, join(homedir(), '.local/bin/docket'), '/opt/homebrew/bin/docket', '/usr/local/bin/docket'].filter(Boolean)
const bin = candidates.find(path => existsSync(path))
if (!bin) {
  process.stderr.write("Docket's command-line tool was not found. Install it from Docket's settings, or set DOCKET_BIN to its path.\n")
  process.exit(1)
}
const child = spawn(bin, ['--mcp'], { stdio: 'inherit' })
for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(signal, () => child.kill(signal))
child.on('error', error => {
  process.stderr.write(`Docket could not start: ${error.message}\n`)
  process.exit(1)
})
child.on('exit', (code, signal) => process.exit(code ?? (signal ? 1 : 0)))
