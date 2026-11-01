// End-to-end smoke test of dsh-compaction-codex against a fake Session and a scripted model.
// Run from this directory with the Desktop executable as Node, so @deepseek-ai/* resolve to DSH's copies:
//   $env:ELECTRON_RUN_AS_NODE='1'; & 'D:\dsn\DeepSeek Harness.exe' --import ./register.mjs smoke.mjs
import assert from 'node:assert/strict'
import { CompactionEngine, isCompactCheckpointSource } from '@deepseek-ai/dsh-compaction'
import { LlmError, CONTEXT_WINDOW_EXCEEDED_CODE } from '@deepseek-ai/dsh-llm'
import Engine, { SUMMARIZATION_PROMPT, SUMMARY_PREFIX, estimateTokens, internals } from '../index.js'

let failures = 0
async function test(name, fn) {
  try {
    await fn()
    console.log(`ok   ${name}`)
  } catch (error) {
    failures += 1
    console.log(`FAIL ${name}\n     ${error?.stack ?? error}`)
  }
}

// ── fake session ─────────────────────────────────────────────────────────────
const SURFACE = new Set(['system/message', 'developer/message', 'user/message', 'assistant/message', 'tool/result'])
let idCounter = 0
const mid = () => `m${++idCounter}`

class FakeSession {
  constructor() {
    this.events = []
    this._nodes = []
    this.replaceGeneration = 0
    this.contentGeneration = 0
    this.header = undefined
    this.id = 'session-test'
  }
  get surface() {
    return { nodes: this._nodes, replaceGeneration: this.replaceGeneration, contentGeneration: this.contentGeneration }
  }
  get seq() {
    return this.events.length
  }
  eventAt(seq) {
    return this.events[seq]
  }
  append(type, data, opts) {
    const event = { type, seq: this.events.length, time: Date.now(), data, ...(opts ?? {}) }
    this.events.push(event)
    if (type === 'request/header') this.header = data.header
    if (SURFACE.has(type)) {
      const op = opts?.surfaceOp ?? 'append'
      if (op === 'append') this._nodes = [...this._nodes, event.seq]
      else {
        const a = this._nodes.indexOf(op.startSeq)
        const b = this._nodes.indexOf(op.endSeq)
        assert.ok(a >= 0 && b >= a, 'replace range must exist on the surface')
        this._nodes = [...this._nodes.slice(0, a), event.seq, ...this._nodes.slice(b + 1)]
        this.replaceGeneration += 1
      }
      this.contentGeneration += 1
    }
    return event
  }
  requestHeader() {
    return this.header
  }
  toolHistory() {
    return { tools: this.header?.tools ?? [], updates: [] }
  }
  deriveEventMessage(event) {
    switch (event.type) {
      case 'user/message':
        return event.data
      case 'system/message':
      case 'developer/message':
      case 'assistant/message':
      case 'tool/result':
        return event.data.message
      default:
        return null
    }
  }
}

const TOOLS = [{ name: 'read', description: 'read a file', parameters: { type: 'object' } }]
const FIRST_REQUEST = '把 legacy/login.cshtml 迁移到 Vue3，保持原有校验规则。'
const CORRECTION = '注意：不要改动 api 层。'
const FOLLOW_UP = '再加一个"记住我"复选框。'
const sys = (s) => s.append('system/message', { turn: 1, step: 1, message: { role: 'system', source: { kind: 'system-prompt' }, content: [{ type: 'text', text: 'You are a coding agent.' }] } }, { surfaceOp: 'append' })
const user = (s, text, kind = 'user') => s.append('user/message', { role: 'user', id: mid(), source: { kind }, content: [{ type: 'text', text }] }, { surfaceOp: 'append' })
const assistantText = (s, text) => s.append('assistant/message', { turn: 1, step: 1, message: { role: 'assistant', id: mid(), source: { kind: 'model', provider: 'p', model: 'm' }, content: [{ type: 'text', text }] }, stream: [] }, { surfaceOp: 'append' })
const assistantCall = (s, callId) => s.append('assistant/message', { turn: 1, step: 1, message: { role: 'assistant', id: mid(), source: { kind: 'model', provider: 'p', model: 'm' }, content: [{ type: 'tool-call', id: callId, name: 'read', arguments: '{}' }] }, stream: [] }, { surfaceOp: 'append' })
const toolResult = (s, callId, text) => {
  s.append('tool/call', { turn: 1, step: 1, callId, name: 'read', arguments: '{}' })
  return s.append('tool/result', { turn: 1, step: 1, message: { role: 'tool', id: mid(), source: { kind: 'tool', callId }, toolCallId: callId, content: [{ type: 'text', text }] } }, { surfaceOp: 'append', sourceEventSeqs: [s.seq - 1] })
}

function freshSession() {
  const s = new FakeSession()
  s.append('turn/start', { turn: 1 })
  sys(s)
  user(s, FIRST_REQUEST)
  user(s, 'Current runtime context: cwd D:\\code\\ms-client', 'runtime-context')
  s.append('request/header', { header: { config: { provider: 'p', model: 'm' }, tools: TOOLS }, reason: 'initial' })
  assistantCall(s, 'c1')
  toolResult(s, 'c1', 'X'.repeat(40000))
  assistantText(s, '已读取旧页面，开始迁移。')
  user(s, CORRECTION)
  assistantText(s, '好的，只改视图层。')
  return s
}

// ── fake services ────────────────────────────────────────────────────────────
function messageText(message) {
  return (message?.content ?? []).map((b) => b.text ?? b.arguments ?? '').join('\n')
}
function makeCtx({ script = [] } = {}) {
  const calls = []
  const logs = []
  const tokenMeter = {
    estimateMessage: (m) => estimateTokens(messageText(m)) + 4,
    measure(session) {
      const nodes = session.surface.nodes.map((seq) => {
        const t = estimateTokens(messageText(session.deriveEventMessage(session.eventAt(seq)))) + 4
        return { seq, tokens: t, heuristicTokens: t }
      })
      const surfaceTokens = nodes.reduce((a, n) => a + n.tokens, 0)
      return { logRevision: session.seq, baseline: { kind: 'none', tokens: 0 }, surfaceDeltaTokens: 0, totalTokens: surfaceTokens, surfaceTokens, nodes }
    },
  }
  const llm = {
    async resolveModelInfo(provider, id) {
      return { provider, id, name: id, context: { contextWindow: 200000 } }
    },
    async *stream(options) {
      calls.push(options)
      const step = script.shift()
      if (step === 'overflow') throw new LlmError('prompt is too long', CONTEXT_WINDOW_EXCEEDED_CODE)
      const text = typeof step === 'string' ? step : '## Progress\n- migrated login view\n## Next\n- wire validation'
      yield { type: 'block-start', index: 0, blockType: 'text' }
      yield { type: 'text-delta', index: 0, text }
      yield { type: 'usage', usage: { inputTokens: 100, outputTokens: 20 } }
      yield { type: 'finish', reason: { kind: 'stop' } }
    },
  }
  let flushed = 0
  const ctx = {
    llm,
    tokenMeter,
    sessions: { flush: async () => { flushed += 1 } },
    logger: { info: (m) => logs.push(['info', m]), warn: (m) => logs.push(['warn', m]) },
    waterfall: (_name, _payload, fallback) => fallback(),
    get: () => undefined,
    on: () => () => {},
  }
  return { ctx, calls, logs, flushed: () => flushed }
}

function makeEngine(ctx, config = {}) {
  const engine = Object.create(Engine.prototype)
  Object.defineProperty(engine, 'ctx', { value: ctx, writable: true })
  engine.config = internals.resolveConfig(config)
  engine.warnedTargets = new Set()
  engine.overflowRetries = new WeakMap()
  engine.overflowAgents = new WeakMap()
  engine.pressureFloor = new WeakMap()
  return engine
}
const agentFor = (session) => ({
  session,
  options: {},
  runMaintenance: (task) => task(new AbortController().signal),
})
const fullRange = (s) => internals.selectFullRange(s)
const checkpointOf = (s) => s.eventAt(s.surface.nodes[1])

// ── tests ────────────────────────────────────────────────────────────────────
await test('engine subclasses the shared CompactionEngine', () => {
  assert.ok(Engine.prototype instanceof CompactionEngine)
  for (const m of ['compactIfNeeded', 'compactNow', 'compactRegion']) assert.equal(typeof Engine.prototype[m], 'function')
})

await test('compactRegion replaces everything after the system prompt with one Codex checkpoint', async () => {
  const s = freshSession()
  const { ctx, calls } = makeCtx()
  const engine = makeEngine(ctx)
  const range = fullRange(s)
  assert.equal(range.start, s.surface.nodes[1], 'starts after the system head')
  const result = await engine.compactRegion(range.start, range.end, agentFor(s), new AbortController().signal)

  assert.equal(s.surface.nodes.length, 2, 'surface = system + checkpoint')
  assert.equal(s.eventAt(s.surface.nodes[0]).type, 'system/message')
  const cp = checkpointOf(s)
  assert.ok(isCompactCheckpointSource(cp.data.source))
  assert.equal(cp.data.source.compactionId, result.compactionId)
  const texts = cp.data.content.map((b) => b.text)
  assert.match(texts[0], /^Earlier messages from the user/)
  assert.deepEqual(internals.parseCheckpointUserMessages(cp.data.content), [FIRST_REQUEST, CORRECTION])
  assert.ok(!texts.join('\n').includes('runtime context'), 'harness-injected context is not kept')
  assert.ok(texts.at(-1).startsWith(SUMMARY_PREFIX + '\n## Progress'))

  const req = calls[0]
  assert.equal(req.purpose, 'compaction')
  assert.equal(req.messages[0].role, 'system', 'replays the system prompt first (warm prefix)')
  assert.ok(req.messages.at(-1).content[0].text.startsWith(SUMMARIZATION_PROMPT))
  assert.deepEqual(req.tools, TOOLS)

  const types = s.events.slice(-4).map((e) => e.type)
  assert.deepEqual(types, ['compaction/start', 'compaction/summary', 'user/message', 'compaction/end'])
  const end = s.events.at(-1)
  assert.equal(end.data.error, undefined)
  assert.equal(end.data.turn, 1)
})

await test('a second compaction carries the preserved user messages forward', async () => {
  const s = freshSession()
  const { ctx } = makeCtx({ script: [undefined, '## second summary'] })
  const engine = makeEngine(ctx)
  let r = fullRange(s)
  await engine.compactRegion(r.start, r.end, agentFor(s))
  user(s, FOLLOW_UP)
  assistantCall(s, 'c2')
  toolResult(s, 'c2', 'Y'.repeat(20000))
  assistantText(s, '已添加。')
  r = fullRange(s)
  await engine.compactRegion(r.start, r.end, agentFor(s))
  const kept = internals.parseCheckpointUserMessages(checkpointOf(s).data.content)
  assert.deepEqual(kept, [FIRST_REQUEST, CORRECTION, FOLLOW_UP])
  assert.ok(checkpointOf(s).data.content.at(-1).text.endsWith('## second summary'))
  assert.equal(fullRange(s), null, 'a lone checkpoint is not re-compacted')
})

await test('user-message budget keeps the newest and truncates the overflowing one (Codex rule)', () => {
  const msgs = ['old ' + 'a'.repeat(4000), 'mid ' + 'b'.repeat(400), 'new']
  // 'new' = 1 token, 'mid …' = 101 tokens, 'old …' = 1001 tokens.
  const kept = internals.selectRetainedUserMessages(msgs, 60)
  assert.equal(kept.length, 2)
  assert.equal(kept[1], 'new')
  assert.ok(kept[0].startsWith('mid ') && kept[0].includes('[truncated]'))
  const wider = internals.selectRetainedUserMessages(msgs, 150)
  assert.equal(wider.length, 3, 'mid fits whole, old is the truncated one')
  assert.equal(wider[1], msgs[1])
  assert.ok(wider[0].startsWith('old ') && wider[0].includes('[truncated]'))
  assert.deepEqual(internals.selectRetainedUserMessages(msgs, 0), [])
})

await test('summary-request overflow drops the oldest history unit and retries', async () => {
  const s = freshSession()
  const { ctx, calls, logs } = makeCtx({ script: ['overflow', undefined] })
  const engine = makeEngine(ctx)
  const r = fullRange(s)
  await engine.compactRegion(r.start, r.end, agentFor(s))
  assert.equal(calls.length, 2)
  assert.ok(calls[1].messages.length < calls[0].messages.length)
  const toolIds = (msgs) => msgs.flatMap((m) => (m.role === 'assistant' ? m.content.filter((b) => b.type === 'tool-call').map((b) => b.id) : m.role === 'tool' ? [m.toolCallId] : []))
  const ids = toolIds(calls[1].messages)
  assert.equal(ids.filter((x) => x === 'c1').length % 2, 0, 'never splits a tool call from its result')
  assert.ok(logs.some(([lvl, m]) => lvl === 'warn' && /exceeded the context window/.test(m)))
  // user messages are taken from the full span, not the trimmed request
  assert.equal(internals.parseCheckpointUserMessages(checkpointOf(s).data.content)[0], FIRST_REQUEST)
})

await test('compactNow runs idle with turn null and flushes', async () => {
  const s = freshSession()
  s.append('turn/end', { turn: 1, reason: { kind: 'completed' } })
  const { ctx, flushed } = makeCtx()
  const engine = makeEngine(ctx)
  const result = await engine.compactNow(agentFor(s), new AbortController().signal, 'cmd-1')
  assert.ok(result)
  assert.equal(result.sourceCommandId, 'cmd-1')
  const start = s.events.find((e) => e.type === 'compaction/start')
  assert.equal(start.data.turn, null)
  assert.equal(flushed(), 1)
  assert.equal(await engine.compactNow(agentFor(s), new AbortController().signal), null, 'nothing left to compact')
})

await test('a failing summary records compaction/end with the error and leaves history intact', async () => {
  const s = freshSession()
  s.append('turn/end', { turn: 1, reason: { kind: 'completed' } })
  const before = [...s.surface.nodes]
  const { ctx } = makeCtx()
  ctx.llm.stream = async function* () {
    yield { type: 'finish', reason: { kind: 'error', failure: { message: 'auth failed', code: 'AUTH' } } }
  }
  const engine = makeEngine(ctx)
  await assert.rejects(engine.compactNow(agentFor(s), new AbortController().signal), (e) => e.code === 'summary')
  assert.deepEqual(s.surface.nodes, before)
  const end = s.events.at(-1)
  assert.equal(end.type, 'compaction/end')
  assert.ok(end.data.error)
  // the lock is released: a later attempt is not "busy"
  ctx.llm.stream = makeCtx().ctx.llm.stream
  assert.ok(await engine.compactNow(agentFor(s), new AbortController().signal))
})

await test('an open tool call at the tail is left out of the range', () => {
  const s = freshSession()
  assistantCall(s, 'c9')
  const r = fullRange(s)
  const nodes = s.surface.nodes
  assert.equal(r.end, nodes[nodes.length - 2], 'stops before the unanswered call')
})

await test('pressure trigger compacts only above the threshold', async () => {
  const s = freshSession()
  const { ctx } = makeCtx()
  const engine = makeEngine(ctx, { autoCompactTokenLimit: 1000000 })
  assert.equal(await engine.compactIfNeeded(agentFor(s), 'pressure', new AbortController().signal), null)
  const low = makeEngine(ctx, { autoCompactTokenLimit: 1000 })
  const result = await low.compactIfNeeded(agentFor(s), 'pressure', new AbortController().signal)
  assert.ok(result, 'compacts once total >= trigger')
  assert.equal(s.surface.nodes.length, 2)
})

await test('config rejects unknown keys and bad values', () => {
  assert.throws(() => internals.resolveConfig({ retainRatio: 0.1 }), /unknown config key/)
  assert.throws(() => internals.resolveConfig({ thresholdRatio: 1.5 }), /thresholdRatio/)
  assert.throws(() => internals.resolveConfig({ summarizationProvider: 'x' }), /together/)
})

await test('CJK-aware estimate prices Chinese per character', () => {
  assert.equal(estimateTokens('中文测试'), 4)
  assert.equal(estimateTokens('abcdefgh'), 2)
})

console.log(failures === 0 ? '\nall passed' : `\n${failures} failed`)
process.exitCode = failures === 0 ? 0 : 1
