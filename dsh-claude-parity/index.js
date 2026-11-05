/**
 * Desktop parity pieces DSH does not ship:
 * secret-path read denial, write/edit rewind, cross-session memory notes,
 * and a Chrome tool that attaches to the CDP port already used locally.
 */
import { createUserMessage } from '@deepseek-ai/dsh-llm'
import { existsSync } from 'node:fs'
import { isAbsolute, resolve } from 'node:path'
import { splitCommandLine } from './lib/chrome.js'
import { denialReason } from './lib/secret.js'
import { describeRestore, restoreSteps, rewindRootDefault, safeSessionId, snapshotFile } from './lib/rewind.js'
import { memoryRoots, readMemoryFile, readMemoryIndex, writeMemory } from './lib/memory.js'

export const name = 'dsh-claude-parity'
export const inject = ['tools', 'subprocess']

const DEFAULT_BROWSER = 'C:/Program Files/nodejs/node_modules/agent-browser/bin/agent-browser-win32-x64.exe'
const SOURCE = { kind: 'plugin:dsh-claude-parity', plugin: 'dsh-claude-parity' }

function sessionKey(execOrAgent) {
  const agent = execOrAgent?.agent ?? execOrAgent
  return safeSessionId(agent?.session?.id ?? agent?.session?.header?.id ?? 'session')
}

async function cwdFor(ctx, exec) {
  const workingDirectory = ctx.get('workingDirectory')
  if (workingDirectory !== undefined && exec?.agent !== undefined) {
    try {
      return await workingDirectory.ensure(exec.agent, exec.signal)
    } catch {
      /* fall through */
    }
  }
  const cwd = exec?.agent?.session?.cwd ?? exec?.agent?.session?.header?.cwd
  return typeof cwd === 'string' && cwd.length > 0 ? cwd : process.cwd()
}

function resolveToolPath(raw, cwd) {
  if (typeof raw !== 'string' || raw.length === 0) return undefined
  return isAbsolute(raw) ? resolve(raw) : resolve(cwd, raw)
}

async function cdpAlive(port) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 1500)
  try {
    const response = await fetch(`http://127.0.0.1:${port}/json/version`, { signal: ctrl.signal })
    return response.ok
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

export function apply(ctx, config = {}) {
  const cdpPort = Number.isInteger(config.cdpPort) && config.cdpPort > 0 ? config.cdpPort : 9222
  const browserPath = typeof config.agentBrowser === 'string' && config.agentBrowser.length > 0 ? config.agentBrowser : DEFAULT_BROWSER
  const rewindRoot = typeof config.rewindRoot === 'string' && config.rewindRoot.length > 0 ? config.rewindRoot : rewindRootDefault()

  ctx.effect(() => ctx.tools.guard((exec) => denialReason(exec?.name, exec?.arguments)))

  ctx.on('tools/pre-execute', async (exec, next) => {
    const decision = await next()
    if (decision?.kind !== 'allow') return decision
    if (exec?.name !== 'write' && exec?.name !== 'edit') return decision
    const raw = exec.arguments?.file_path
    if (typeof raw !== 'string' || raw.length === 0) return decision
    try {
      const filePath = resolveToolPath(raw, await cwdFor(ctx, exec))
      await snapshotFile(rewindRoot, sessionKey(exec), filePath)
    } catch (error) {
      ctx.logger?.warn?.(`claude-parity rewind snapshot failed: ${error instanceof Error ? error.message : String(error)}`)
    }
    return decision
  })

  ctx.on('agent/pre-step', async (payload, next) => {
    const decision = await next()
    if (decision?.kind !== 'enter' || !Array.isArray(decision.messages)) return decision
    try {
      const text = await readMemoryIndex()
      if (text.length === 0) return decision
      const message = createUserMessage({
        content: [{ type: 'text', text }],
        source: { ...SOURCE, role: 'memory' },
      })
      return { ...decision, messages: [...decision.messages, message] }
    } catch (error) {
      ctx.logger?.warn?.(`claude-parity memory inject failed: ${error instanceof Error ? error.message : String(error)}`)
      return decision
    }
  })

  const commands = ctx.get('commands')
  if (commands?.register !== undefined) {
    ctx.effect(() => commands.register({
      name: 'rewind',
      description: '恢复本会话最近的 write/edit。不带参数恢复一步，数字表示连续恢复几步。',
      input: { hint: '[步数]' },
      async handler({ agent, rawInput }) {
        const trimmed = String(rawInput ?? '').trim()
        const count = trimmed.length === 0 ? 1 : Number(trimmed)
        if (!Number.isInteger(count) || count < 1) return { kind: 'error', text: '用法：/rewind 或 /rewind 2' }
        const restored = await restoreSteps(rewindRoot, sessionKey(agent), count)
        return { kind: 'success', text: describeRestore(restored) }
      },
    }))
  }

  ctx.effect(() => ctx.tools.register({
    name: 'memory_read',
    description: '读取跨会话记忆文件。只能读 ~/.dsh/memory、~/.claude/memory，或当前工作区的 .dsh/memory.md。',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        file_path: { type: 'string', description: '记忆文件的绝对路径，或相对于 ~/.dsh/memory 的文件名。' },
      },
      required: ['file_path'],
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: { text: { type: 'string' } },
        required: ['text'],
      },
      render: (_args, value) => [{ type: 'text', text: value.text }],
    },
    async execute(args, exec) {
      const raw = args?.file_path
      if (typeof raw !== 'string' || raw.length === 0) throw new Error('memory_read 需要 file_path')
      const cwd = await cwdFor(ctx, exec)
      const candidate = isAbsolute(raw) ? resolve(raw) : resolve(memoryRoots().dsh, raw)
      const text = await readMemoryFile(candidate, [resolve(cwd, '.dsh', 'memory.md')])
      return { text }
    },
  }))

  ctx.effect(() => ctx.tools.register({
    name: 'memory_write',
    description: '把一条可复用的项目事实写到 ~/.dsh/memory，并在 MEMORY.md 里加索引。不要写入密钥、令牌或密码。',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        title: { type: 'string', description: '索引标题，一句话。' },
        body: { type: 'string', description: '记忆正文。' },
      },
      required: ['title', 'body'],
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: { file: { type: 'string' } },
        required: ['file'],
      },
      render: (_args, value) => [{ type: 'text', text: `已写入 ${value.file}` }],
    },
    async execute(args) {
      const saved = await writeMemory({ title: args?.title, body: args?.body })
      return { file: saved.file }
    },
  }))

  ctx.effect(() => ctx.tools.register({
    name: 'rewind_files',
    description: '恢复本会话最近的 write/edit。steps 默认 1。Shell 直接改的文件不在这里。',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        steps: { type: 'number', description: '连续恢复的步数，默认 1。' },
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: { text: { type: 'string' } },
        required: ['text'],
      },
      render: (_args, value) => [{ type: 'text', text: value.text }],
    },
    async execute(args, exec) {
      const steps = args?.steps === undefined ? 1 : args.steps
      if (!Number.isInteger(steps) || steps < 1) throw new Error('steps 必须是正整数')
      const restored = await restoreSteps(rewindRoot, sessionKey(exec), steps)
      return { text: describeRestore(restored) }
    },
  }))

  ctx.effect(() => ctx.tools.register({
    name: 'chrome_cdp',
    description: '操作已经开在本机调试端口上的 Chrome（默认 9222），保留登录态。命令是一条 agent-browser 子命令，例如 `snapshot -i`、`tab list`、`open http://localhost:8088/`。不要用 &&。浏览器没开调试端口时会直接说明，不会另开一套配置。',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        command: { type: 'string', description: '不含 agent-browser 前缀的一条命令。' },
      },
      required: ['command'],
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: { text: { type: 'string' } },
        required: ['text'],
      },
      render: (_args, value) => [{ type: 'text', text: value.text }],
    },
    isConcurrencySafe: () => false,
    async execute(args, exec) {
      const argv = splitCommandLine(String(args?.command ?? ''))
      if (!existsSync(browserPath)) {
        return { text: `找不到 agent-browser：${browserPath}` }
      }
      if (!(await cdpAlive(cdpPort))) {
        return {
          text: `127.0.0.1:${cdpPort} 上没有 Chrome 调试端口。日常 Chrome 需要带 --remote-debugging-port=${cdpPort} 启动后才能挂上登录态。插件不会另开一个空配置去代替它。`,
        }
      }
      const cwd = await cwdFor(ctx, exec)
      const handle = ctx.subprocess.spawn({
        argv: [browserPath, '--cdp', String(cdpPort), ...argv],
        cwd,
        stdio: {
          stdin: 'ignore',
          stdout: { maxBytes: 400_000 },
          stderr: { maxBytes: 80_000 },
        },
        graceMs: 2_000,
        env: process.env,
        signal: exec.signal,
      })
      const outcome = await handle.done
      const stdout = handle.collected.stdout?.readFrom(0)?.text ?? ''
      const stderr = handle.collected.stderr?.readFrom(0)?.text ?? ''
      const exitCode = outcome.exitCode ?? 1
      const text = [stdout, stderr.length > 0 ? `[stderr]\n${stderr}` : '', exitCode === 0 ? '' : `[exit code: ${exitCode}]`].filter(Boolean).join('\n')
      return { text: text.length > 0 ? text : '(no output)' }
    },
  }))
}

export const internals = { denialReason, splitCommandLine }
