import { mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises'
import { basename, join, resolve } from 'node:path'

const MAX_BYTES = 32 * 1024 * 1024
const chains = new Map()

function lock(key, fn) {
  const prev = chains.get(key) ?? Promise.resolve()
  const run = prev.then(fn, fn)
  chains.set(key, run.then(() => {}, () => {}))
  return run
}

export function safeSessionId(id) {
  const cleaned = String(id ?? 'session').replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 80)
  return cleaned.length > 0 ? cleaned : 'session'
}

function sessionDir(root, sessionId) {
  return join(resolve(root), safeSessionId(sessionId))
}

async function readManifest(dir) {
  try {
    const raw = await readFile(join(dir, 'manifest.json'), 'utf8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    if (error?.code === 'ENOENT') return []
    throw error
  }
}

async function writeManifest(dir, steps) {
  const target = join(dir, 'manifest.json')
  const next = join(dir, 'manifest.json.next')
  await writeFile(next, JSON.stringify(steps), 'utf8')
  await rename(next, target)
}

/**
 * Copy the current file before a write or edit. A missing file is recorded so
 * rewind can delete a file this step created.
 */
export function snapshotFile(root, sessionId, filePath) {
  const absolute = resolve(filePath)
  return lock(safeSessionId(sessionId), async () => {
    const dir = sessionDir(root, sessionId)
    await mkdir(dir, { recursive: true })
    const steps = await readManifest(dir)
    const id = steps.length + 1
    const stepDir = join(dir, String(id))
    await mkdir(stepDir, { recursive: true })
    let existed = false
    let backup = null
    let skipped = null
    try {
      const info = await stat(absolute)
      if (!info.isFile()) {
        skipped = 'not-a-file'
      } else if (info.size > MAX_BYTES) {
        skipped = 'too-large'
      } else {
        existed = true
        backup = 'before.bin'
        await writeFile(join(stepDir, backup), await readFile(absolute))
      }
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error
    }
    const step = { id, time: Date.now(), path: absolute, existed, backup, skipped }
    steps.push(step)
    await writeManifest(dir, steps)
    return step
  })
}

/** Restore the newest `count` snapshots, newest first. */
export function restoreSteps(root, sessionId, count) {
  const stepsToRestore = Number.isInteger(count) && count > 0 ? count : 1
  return lock(safeSessionId(sessionId), async () => {
    const dir = sessionDir(root, sessionId)
    const steps = await readManifest(dir)
    if (steps.length === 0) return []
    const start = Math.max(0, steps.length - stepsToRestore)
    const chosen = steps.slice(start)
    const restored = []
    for (const step of [...chosen].reverse()) {
      if (step.skipped) {
        restored.push({ path: step.path, action: 'skipped', reason: step.skipped })
        continue
      }
      if (!step.existed) {
        await rm(step.path, { force: true })
        restored.push({ path: step.path, action: 'deleted' })
        continue
      }
      const backupPath = join(dir, String(step.id), step.backup)
      await mkdir(resolve(step.path, '..'), { recursive: true })
      await writeFile(step.path, await readFile(backupPath))
      restored.push({ path: step.path, action: 'restored' })
    }
    await writeManifest(dir, steps.slice(0, start))
    for (const step of chosen) await rm(join(dir, String(step.id)), { recursive: true, force: true })
    return restored
  })
}

export function rewindRootDefault() {
  const home = process.env.USERPROFILE || process.env.HOME || process.cwd()
  return join(home, '.dsh', 'file-rewind')
}

export function describeRestore(restored) {
  if (restored.length === 0) return '这个会话还没有可回退的 write/edit。'
  return restored.map((item) => {
    if (item.action === 'restored') return `已恢复 ${item.path}`
    if (item.action === 'deleted') return `已删除本次新建的 ${basename(item.path)}（${item.path}）`
    return `未能回退 ${item.path}（${item.reason}）`
  }).join('\n')
}
