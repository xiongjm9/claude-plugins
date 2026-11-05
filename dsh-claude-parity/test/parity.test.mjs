import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { splitCommandLine } from '../lib/chrome.js'
import { readMemoryFile, writeMemory } from '../lib/memory.js'
import { describeRestore, restoreSteps, snapshotFile } from '../lib/rewind.js'
import { commandMentionsSecret, denialReason, isSecretPath } from '../lib/secret.js'

test('secret paths match the Claude Code read deny list', () => {
  assert.equal(isSecretPath('.env'), true)
  assert.equal(isSecretPath('./.env.local'), true)
  assert.equal(isSecretPath('D:/code/app/.env.production'), true)
  assert.equal(isSecretPath('src/secrets/token.txt'), true)
  assert.equal(isSecretPath('config/credentials.json'), true)
  assert.equal(isSecretPath('src/config.ts'), false)
  assert.equal(isSecretPath('credentials.json'), false)
  assert.equal(denialReason('read', { file_path: '.env' })?.includes('拒绝读取'), true)
  assert.equal(denialReason('grep', { path: 'src', pattern: 'token' }), undefined)
  assert.equal(denialReason('glob', { pattern: '**/.env' })?.includes('拒绝枚举'), true)
  assert.equal(denialReason('write', { file_path: '.env' }), undefined)
  assert.equal(commandMentionsSecret('Get-Content .env'), true)
  assert.equal(commandMentionsSecret('Get-ChildItem src'), false)
  assert.equal(denialReason('pwsh', { command: 'type secrets\\key.txt' })?.includes('拒绝读取'), true)
})

test('chrome command is one argv vector', () => {
  assert.deepEqual(splitCommandLine('snapshot -i'), ['snapshot', '-i'])
  assert.deepEqual(splitCommandLine('open "http://localhost:8088/#/dock"'), ['open', 'http://localhost:8088/#/dock'])
  assert.throws(() => splitCommandLine('snapshot && click @e1'))
})

test('rewind restores the previous file and deletes a created file', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-rewind-'))
  const file = join(root, 'note.txt')
  await writeFile(file, 'one', 'utf8')
  await snapshotFile(root, 'session-a', file)
  await writeFile(file, 'two', 'utf8')
  const created = join(root, 'new.txt')
  await snapshotFile(root, 'session-a', created)
  await writeFile(created, 'fresh', 'utf8')
  const first = await restoreSteps(root, 'session-a', 1)
  assert.equal(first[0].action, 'deleted')
  await assert.rejects(readFile(created, 'utf8'))
  const second = await restoreSteps(root, 'session-a', 1)
  assert.equal(second[0].action, 'restored')
  assert.equal(await readFile(file, 'utf8'), 'one')
  assert.match(describeRestore([]), /没有可回退/)
  await rm(root, { recursive: true, force: true })
})

test('memory write stays inside its directory', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'dsh-memory-'))
  try {
    const saved = await writeMemory({ title: 'parity test note', body: 'temporary note from the parity test', root: dir })
    assert.equal(saved.file.startsWith(dir), true)
    const text = await readMemoryFile(saved.file, [saved.file])
    assert.match(text, /temporary note/)
    await assert.rejects(readMemoryFile(join(dir, '..', 'secrets.txt')))
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
