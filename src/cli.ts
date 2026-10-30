#!/usr/bin/env node
import { parseArgs } from 'node:util'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { readFileSync } from 'node:fs'
import { isIP } from 'node:net'
import getPort from 'get-port'
import { isGitRepo } from './git.js'
import { startServer } from './server.js'
import { isLoopback } from './guard.js'
import { loadSettings } from './settings.js'

const { values, positionals } = parseArgs({
  options: {
    port: { type: 'string', short: 'p' },
    host: { type: 'string' },
    'allow-from': { type: 'string' },
    'no-open': { type: 'boolean', default: false },
    help: { type: 'boolean' },
    version: { type: 'boolean', short: 'v' },
  },
  allowPositionals: true,
})

if (values.help) {
  console.log(`diffx - Local code review tool for git diffs

Usage: diffx [options] [-- <git diff args>]

Options:
  -p, --port <port>  Port to run the server on (default: random available port)
  --host <host>      Host address to bind to (default: 127.0.0.1). Pass this
                     machine's LAN address to review from other devices.
  --allow-from <ips> Comma-separated client IPs allowed besides this machine.
                     Every other client gets 403.
  --no-open          Don't open the browser automatically
  -v, --version      Show version number
  -h, --help         Show this help message

Examples:
  diffx                        Review uncommitted changes
  diffx -- --staged            Review staged changes
  diffx -- HEAD~3              Review last 3 commits
  diffx -- main..feature       Compare branches
  diffx --host 192.168.1.10 --allow-from 192.168.1.20
                               Allow one other device on the LAN to review`)
  process.exit(0)
}

if (values.version) {
  const __dirname = dirname(fileURLToPath(import.meta.url))
  const pkg = JSON.parse(readFileSync(resolve(__dirname, '..', 'package.json'), 'utf-8'))
  console.log(pkg.version)
  process.exit(0)
}

// Everything after -- becomes custom git diff args
const customDiffArgs = positionals.length > 0 ? positionals : undefined

if (!isGitRepo()) {
  console.error('Error: not inside a git repository')
  process.exit(1)
}

const port = await getPort(values.port ? { port: parseInt(values.port, 10) } : undefined)
const host = values.host ?? '127.0.0.1'
if (host === '0.0.0.0' || host === '::') {
  console.error(`Error: --host needs one address, such as this machine's LAN address, not ${host}`)
  process.exit(1)
}
const allowFrom = (values['allow-from'] ?? '').split(',').map((ip) => ip.trim()).filter(Boolean)
const invalidIp = allowFrom.find((ip) => !isIP(ip))
if (invalidIp) {
  console.error(`Error: --allow-from expects IP addresses, got "${invalidIp}"`)
  process.exit(1)
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const clientDir = resolve(__dirname, 'client')
const { existsSync } = await import('node:fs')
const resolvedClientDir = existsSync(clientDir)
  ? clientDir
  : resolve(process.cwd(), 'dist/client')

const { port: actualPort } = await startServer({ port, host, clientDir: resolvedClientDir, customDiffArgs, allowFrom })

const localUrl = `http://${host}:${actualPort}`

console.log(`diffx server running at ${localUrl}`)

if (!values['no-open']) {
  const settings = loadSettings()
  // Over loopback, because the server allows saving settings only from there.
  const openHost = isLoopback(host) ? host : '127.0.0.1'
  const openUrl = `http://${openHost}:${actualPort}`
  const openModule = await import('open')
  let appName: string | readonly string[] | undefined
  if (settings.browser) {
    const apps = openModule.apps as Record<string, string | readonly string[]>
    appName = apps[settings.browser] || settings.browser
  }
  const options = appName ? { app: { name: appName } } : {}
  openModule.default(openUrl, options)
}

process.on('SIGINT', () => {
  console.log('\nShutting down...')
  process.exit(0)
})
