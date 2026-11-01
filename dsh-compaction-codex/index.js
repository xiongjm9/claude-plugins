/**
 * dsh-compaction-codex: a Codex-style compaction backend for DeepSeek Harness.
 *
 * Algorithm (after openai/codex `codex-rs/core/src/compact.rs`, Apache-2.0):
 *   1. Summarize the WHOLE visible history (everything after the system prompt,
 *      up to the last balanced tool boundary) with the conversation model, by
 *      replaying that history and appending Codex's checkpoint prompt as the
 *      final user message, so the provider prefix cache stays warm.
 *   2. If the summary request itself overflows, drop the oldest history units
 *      and retry (Codex trims from the front for the same reason).
 *   3. Rebuild history as ONE checkpoint message:
 *        the most recent real user messages verbatim, newest-first within
 *        `userMessageMaxTokens` (the overflowing one truncated), then the
 *        summary behind Codex's "Another language model started…" prefix.
 *      Assistant messages, tool calls and tool outputs are dropped. Later
 *      compactions re-read the preserved user messages out of the checkpoint,
 *      so user intent survives any number of compactions.
 *
 * The durable transaction (compaction/start → summary → replace → end, the
 * log-recorded lock, stability checks, manual-error taxonomy) follows the
 * `@deepseek-ai/dsh-compaction` contract and mirrors the shipped
 * `@deepseek-ai/dsh-compaction-basic` (MIT) implementation of it.
 */
import z from '@deepseek-ai/schemastery'
import {
  CompactionEngine,
  CompactionId,
  ManualCompactionError,
  compactCheckpointSource,
  isCompactCheckpointSource,
  toolPairingBalancedAfter,
  toolPairingBalancedBefore,
} from '@deepseek-ai/dsh-compaction'
import {
  BlockAssembler,
  CONTEXT_WINDOW_EXCEEDED_CODE,
  LlmError,
  contentHasImage,
  createUserMessage,
  errorChain,
} from '@deepseek-ai/dsh-llm'
import { SessionSeq } from '@deepseek-ai/dsh-session'
import { randomUUID } from 'node:crypto'
import { isDeepStrictEqual } from 'node:util'

// ── Codex prompts ─────────────────────────────────────────────────────────────

/** Verbatim `codex-rs/prompts/templates/compact/prompt.md`. */
export const SUMMARIZATION_PROMPT = [
  'You are performing a CONTEXT CHECKPOINT COMPACTION. Create a handoff summary for another LLM that will resume the task.',
  '',
  'Include:',
  '- Current progress and key decisions made',
  '- Important context, constraints, or user preferences',
  '- What remains to be done (clear next steps)',
  '- Any critical data, examples, or references needed to continue',
  '',
  'Be concise, structured, and focused on helping the next LLM seamlessly continue the work.',
].join('\n')

/**
 * DSH addition. The replayed request keeps its tool declarations (providers
 * reject tool history without them), so the model must be told not to call one.
 */
const TEXT_ONLY_NOTE = 'Reply with the summary text only. Do not call any tool.'

/** Verbatim `codex-rs/prompts/templates/compact/summary_prefix.md`. */
export const SUMMARY_PREFIX =
  'Another language model started to solve this problem and produced a summary of its thinking process. You also have access to the state of the tools that were used by that language model. Use this to build on the work that has already been done and avoid duplicating work. Here is the summary produced by the other language model, use the information in this summary to assist with your own analysis:'

/**
 * Codex keeps preserved user messages as separate history items. The DSH
 * contract replaces a span with exactly one message, so they are carried as
 * tagged blocks inside the checkpoint, introduced by this line.
 */
const USER_MESSAGES_HEADER = 'Earlier messages from the user in this conversation, verbatim, oldest first:'
const USER_OPEN = '<user_message>\n'
const USER_CLOSE = '\n</user_message>'
const TRUNCATION_MARK = '\n…[truncated]…\n'

// ── configuration ─────────────────────────────────────────────────────────────

const DEFAULTS = Object.freeze({
  auto: true,
  thresholdRatio: 0.8,
  autoCompactTokenLimit: 0,
  maxTokens: 32768,
  userMessageMaxTokens: 20000,
  summarizationProvider: '',
  summarizationModel: '',
  prompt: '',
  maxOverflowRetries: 1,
  summaryRetries: 3,
})

/** Provider failure codes worth retrying for one summary request. */
const TRANSIENT_CODES = new Set(['RATE_LIMIT', 'SERVER', 'TIMEOUT', 'TRANSPORT', 'EMPTY_RESPONSE'])

function resolveConfig(raw = {}) {
  const config = { ...DEFAULTS }
  for (const [key, value] of Object.entries(raw ?? {})) {
    if (!(key in DEFAULTS)) throw new Error(`dsh-compaction-codex: unknown config key "${key}"`)
    if (value !== undefined && value !== null) config[key] = value
  }
  const ratio = config.thresholdRatio
  if (typeof ratio !== 'number' || !(ratio > 0 && ratio <= 1)) throw new Error(`dsh-compaction-codex: thresholdRatio (${ratio}) must be in (0, 1]`)
  for (const key of ['autoCompactTokenLimit', 'maxOverflowRetries', 'summaryRetries', 'userMessageMaxTokens']) {
    if (!Number.isInteger(config[key]) || config[key] < 0) throw new Error(`dsh-compaction-codex: ${key} (${config[key]}) must be a non-negative integer`)
  }
  if (!Number.isInteger(config.maxTokens) || config.maxTokens <= 0) throw new Error(`dsh-compaction-codex: maxTokens (${config.maxTokens}) must be a positive integer`)
  if ((config.summarizationProvider === '') !== (config.summarizationModel === '')) {
    throw new Error('dsh-compaction-codex: summarizationProvider and summarizationModel must be set together')
  }
  return Object.freeze(config)
}

/** A target-specific pressure configuration problem, warned about once per target. */
class TargetConfigError extends Error {
  constructor(targetKey, message) {
    super(message)
    this.targetKey = targetKey
  }
}

/** The selected span no longer matches what the summary was built from. */
class SurfaceChangedError extends Error {}

// ── small helpers ─────────────────────────────────────────────────────────────

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(value)) deepFreeze(child)
  }
  return value
}

function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason)
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    const onAbort = () => {
      clearTimeout(timer)
      reject(signal.reason)
    }
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

function errorCode(error) {
  return error?.code ?? error?.failure?.code
}

function isOverflow(error) {
  return errorCode(error) === CONTEXT_WINDOW_EXCEEDED_CODE
}

/** Token estimate that prices CJK at one token per character, other text at ~4 chars/token. */
export function estimateTokens(text) {
  let cjk = 0
  for (const ch of text) {
    const cp = ch.codePointAt(0)
    if (
      (cp >= 0x3040 && cp <= 0x30ff) || // kana
      (cp >= 0x3400 && cp <= 0x4dbf) ||
      (cp >= 0x4e00 && cp <= 0x9fff) ||
      (cp >= 0xac00 && cp <= 0xd7af) || // hangul
      (cp >= 0xf900 && cp <= 0xfaff) ||
      (cp >= 0xff00 && cp <= 0xffef) || // full-width forms
      (cp >= 0x20000 && cp <= 0x2fa1f)
    ) cjk += 1
  }
  const rest = text.length - cjk
  return cjk + Math.ceil(Math.max(0, rest) / 4)
}

/** Keep head and tail of `text` within roughly `budget` tokens. */
function truncateToTokens(text, budget) {
  const tokens = estimateTokens(text)
  if (tokens <= budget) return text
  if (budget <= 0) return ''
  const keepChars = Math.max(1, Math.floor((text.length * budget) / tokens) - TRUNCATION_MARK.length)
  const head = Math.ceil(keepChars / 2)
  const tail = keepChars - head
  return text.slice(0, head) + TRUNCATION_MARK + (tail > 0 ? text.slice(text.length - tail) : '')
}

/** Model-visible text of a user message; non-text parts become short placeholders. */
function userText(content) {
  const parts = []
  for (const block of content ?? []) {
    if (block.type === 'text') parts.push(block.text)
    else if (block.type === 'image') parts.push('[image]')
    else if (block.type === 'file') parts.push(`[file: ${block.attachment?.name ?? 'attachment'}]`)
  }
  return parts.join('\n')
}

// ── checkpoint format ─────────────────────────────────────────────────────────

function isOwnCheckpointContent(content) {
  const last = content?.[content.length - 1]
  return last?.type === 'text' && last.text.startsWith(SUMMARY_PREFIX)
}

/** The verbatim user messages a previous checkpoint of this backend carried. */
function parseCheckpointUserMessages(content) {
  if (!isOwnCheckpointContent(content)) return []
  const out = []
  for (const block of content) {
    if (block.type !== 'text') continue
    if (block.text.startsWith(USER_OPEN) && block.text.endsWith(USER_CLOSE)) {
      out.push(block.text.slice(USER_OPEN.length, block.text.length - USER_CLOSE.length))
    }
  }
  return out
}

/** Real user messages in the shadowed span, oldest first, including ones a prior checkpoint kept. */
function collectUserMessages(session, shadowedSeqs) {
  const out = []
  for (const seq of shadowedSeqs) {
    const event = session.eventAt(seq)
    if (event?.type !== 'user/message') continue
    const source = event.data.source
    if (source !== undefined && isCompactCheckpointSource(source)) {
      out.push(...parseCheckpointUserMessages(event.data.content))
      continue
    }
    // Harness-injected context (runtime context, skill catalog, time, goal
    // rounds, reminders) carries its own source kind and is re-published by
    // its owner once it leaves the surface, as Codex re-injects its context.
    if (source !== undefined && source.kind !== 'user') continue
    const text = userText(event.data.content)
    if (text.trim().length > 0) out.push(text)
  }
  return out
}

/** Codex `build_compacted_history_with_limit`: newest-first within budget, truncate the overflow, stop. */
function selectRetainedUserMessages(messages, maxTokens) {
  const selected = []
  let remaining = maxTokens
  for (let i = messages.length - 1; i >= 0 && remaining > 0; i -= 1) {
    const text = messages[i]
    const tokens = estimateTokens(text)
    if (tokens <= remaining) {
      selected.push(text)
      remaining -= tokens
      continue
    }
    const truncated = truncateToTokens(text, remaining)
    if (truncated.length > 0) selected.push(truncated)
    break
  }
  return selected.reverse()
}

function buildCheckpointContent(userMessages, summaryText) {
  const blocks = []
  if (userMessages.length > 0) {
    blocks.push({ type: 'text', text: USER_MESSAGES_HEADER })
    for (const text of userMessages) blocks.push({ type: 'text', text: USER_OPEN + text + USER_CLOSE })
  }
  const summary = summaryText.trim().length > 0 ? summaryText : '(no summary available)'
  blocks.push({ type: 'text', text: `${SUMMARY_PREFIX}\n${summary}` })
  return blocks
}

// ── surface selection and replay ──────────────────────────────────────────────

function systemHead(session, headSeq) {
  const head = session.eventAt(headSeq)
  return head?.type === 'system/message' ? head : undefined
}

/**
 * Everything after the system prompt up to the last balanced cut. Returns null
 * when nothing useful is left, e.g. the surface is only our own checkpoint.
 */
function selectFullRange(session) {
  const nodes = session.surface.nodes
  if (nodes.length === 0) return null
  const firstIdx = systemHead(session, nodes[0]) === undefined ? 0 : 1
  let endIdx = nodes.length - 1
  while (endIdx >= firstIdx && !toolPairingBalancedAfter(session, nodes[endIdx])) endIdx -= 1
  if (endIdx < firstIdx) return null
  if (endIdx === firstIdx) {
    const only = session.eventAt(nodes[firstIdx])
    if (only?.type === 'user/message' && only.data.source !== undefined && isCompactCheckpointSource(only.data.source)) return null
  }
  return { start: nodes[firstIdx], end: nodes[endIdx] }
}

/**
 * Replay input: the system head plus the span's messages grouped into balanced
 * units, so overflow trimming never separates a tool call from its result.
 */
function buildSummarizationInput(session, shadowedSeqs) {
  const header = session.requestHeader()
  const head = systemHead(session, session.surface.nodes[0])
  const system = head === undefined ? null : session.deriveEventMessage(head)
  const units = []
  let current = []
  let open = 0
  for (const seq of shadowedSeqs) {
    const event = session.eventAt(seq)
    const message = event === undefined ? null : session.deriveEventMessage(event)
    if (event?.type === 'assistant/message') open += event.data.message.content.filter((b) => b.type === 'tool-call').length
    else if (event?.type === 'tool/result') open -= 1
    if (message !== null) current.push(message)
    if (open <= 0 && current.length > 0) {
      units.push(current)
      current = []
      open = 0
    }
  }
  if (current.length > 0) units.push(current)
  return { system, units, ...(header?.tools === undefined ? {} : { tools: header.tools }) }
}

// ── durable lock and region validation (dsh-compaction contract) ──────────────

function inspectCompactionEntryState(session) {
  let openTurn = null
  let openTurnKnown = false
  let unmatchedStart
  let compactionKnown = false
  let latestEndSeedSeq
  for (let seq = session.seq - 1; seq >= 0; seq -= 1) {
    const event = session.eventAt(SessionSeq(seq))
    if (event === undefined) continue
    if (latestEndSeedSeq === undefined && event.type === 'session/end-seed') latestEndSeedSeq = event.seq
    if (!compactionKnown) {
      if (event.type === 'compaction/start') {
        unmatchedStart = event
        compactionKnown = true
      } else if (event.type === 'compaction/end') compactionKnown = true
    }
    if (!openTurnKnown) {
      if (event.type === 'turn/start') {
        openTurn = event.data.turn
        openTurnKnown = true
      } else if (event.type === 'turn/end') openTurnKnown = true
    }
    if (openTurnKnown && compactionKnown && latestEndSeedSeq !== undefined) break
  }
  return { openTurn, unmatchedStart, latestEndSeedSeq }
}

function assertCompactionInactive(unmatchedStart, latestEndSeedSeq, stage) {
  if (unmatchedStart === undefined || (latestEndSeedSeq !== undefined && latestEndSeedSeq > unmatchedStart.seq)) return
  throw new ManualCompactionError('busy', `${stage}: compaction already in progress; the session compaction lock is already active`)
}

function assertNoActiveCompaction(session, stage) {
  const state = inspectCompactionEntryState(session)
  assertCompactionInactive(state.unmatchedStart, state.latestEndSeedSeq, stage)
}

function validateSurfaceRegion(session, start, end) {
  const nodes = session.surface.nodes
  const startIdx = nodes.indexOf(start)
  const endIdx = nodes.indexOf(end)
  if (startIdx === -1) throw new Error(`compactRegion: start seq ${start} not found in surface`)
  if (endIdx === -1) throw new Error(`compactRegion: end seq ${end} not found in surface`)
  if (startIdx > endIdx) throw new Error(`compactRegion: start seq ${start} (position ${startIdx}) is after end seq ${end} (position ${endIdx})`)
  if (!toolPairingBalancedBefore(session, nodes[startIdx])) throw new Error(`compactRegion: start seq ${start} is not a balanced boundary`)
  if (!toolPairingBalancedAfter(session, nodes[endIdx])) throw new Error(`compactRegion: end seq ${end} is not a balanced boundary`)
  return { start, end, startIdx, endIdx, shadowedSeqs: nodes.slice(startIdx, endIdx + 1) }
}

function routedTarget(session) {
  const config = session.requestHeader()?.config
  if (config === undefined || !config.provider || !config.model) return undefined
  return { provider: config.provider, model: config.model }
}

function finishError(finish) {
  switch (finish?.kind) {
    case 'error':
    case 'aborted':
      return new LlmError(finish.failure.message, finish.failure.code, finish.failure)
    case 'max-tokens': {
      const error = new Error('summarization truncated at the token cap (incomplete checkpoint)')
      error.code = 'MAX_TOKENS'
      return error
    }
    default:
      return undefined
  }
}

// ── the engine ────────────────────────────────────────────────────────────────

export default class CodexCompactionEngine extends CompactionEngine {
  static inject = ['llm', 'tokenMeter', 'sessions']

  static Config = z.object({
    auto: z.boolean().default(DEFAULTS.auto).description('Compact automatically near the context limit and after a context-overflow error.'),
    thresholdRatio: z.number().min(0.05).max(1).default(DEFAULTS.thresholdRatio).description('Auto-compact when the request reaches this fraction of the context window.'),
    autoCompactTokenLimit: z.natural().default(DEFAULTS.autoCompactTokenLimit).description('Absolute auto-compact trigger in tokens (Codex model_auto_compact_token_limit). 0 uses thresholdRatio.'),
    maxTokens: z.natural().min(1).default(DEFAULTS.maxTokens).description('Output cap for the summary request.'),
    userMessageMaxTokens: z.natural().default(DEFAULTS.userMessageMaxTokens).description('Budget for user messages kept verbatim (Codex: 20000).'),
    summarizationProvider: z.string().default(DEFAULTS.summarizationProvider).description('Provider for the summary request; empty uses the conversation route. Set together with summarizationModel.'),
    summarizationModel: z.string().default(DEFAULTS.summarizationModel).description('Model for the summary request; empty uses the conversation route.'),
    prompt: z.string().role('textarea').default(DEFAULTS.prompt).description('Replacement summarization prompt (Codex compact_prompt). Empty uses the Codex prompt.'),
    maxOverflowRetries: z.natural().default(DEFAULTS.maxOverflowRetries).description('Recoveries per turn after a provider context-overflow error.'),
    summaryRetries: z.natural().default(DEFAULTS.summaryRetries).description('Retries for a summary request that fails with a transient provider error.'),
  })

  constructor(ctx, config = {}) {
    super(ctx)
    this.config = resolveConfig(config)
    this.warnedTargets = new Set()
    this.overflowRetries = new WeakMap()
    this.overflowAgents = new WeakMap()
    this.pressureFloor = new WeakMap()
    if (this.config.auto) this._registerAutomaticCompaction()
  }

  _registerAutomaticCompaction() {
    const { ctx } = this
    const logResult = (result, trigger) => {
      ctx.logger.info(`codex compaction (${trigger}): replaced ${result.shadowedSeqs.length} surface nodes (~${result.shadowedTokenCount} tokens)`)
    }
    ctx.on('agent/pre-step', async ({ agent, signal }, next) => {
      if (!signal.aborted) {
        try {
          const result = await this.compactIfNeeded(agent, 'pressure', signal)
          if (result !== null) logResult(result, 'pressure')
        } catch (error) {
          if (error instanceof TargetConfigError) {
            if (this.warnedTargets.has(error.targetKey)) return next()
            this.warnedTargets.add(error.targetKey)
          }
          ctx.logger.warn(`codex compaction failed: ${error instanceof Error ? error.message : String(error)}; continuing the turn`)
        }
      }
      return next()
    })
    ctx.on('agent/status', ({ agent, status }) => {
      if (status === 'idle') this.overflowRetries.delete(agent)
    })
    ctx.on('session/event', (session, event) => {
      if (event.type !== 'assistant/message') return
      const agent = this.overflowAgents.get(session)
      if (agent !== undefined) this.overflowRetries.delete(agent)
    })
    ctx.on('agent/request-error', async ({ agent, failure, signal }, next) => {
      if (failure.code !== CONTEXT_WINDOW_EXCEEDED_CODE || signal.aborted) return next()
      this.overflowAgents.set(agent.session, agent)
      if (routedTarget(agent.session) === undefined) return next()
      const retries = this.overflowRetries.get(agent) ?? 0
      if (retries >= this.config.maxOverflowRetries) return next()
      const generation = agent.session.surface.replaceGeneration
      let result
      try {
        result = await this.compactIfNeeded(agent, 'context-overflow', signal)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        if (!signal.aborted && agent.session.surface.replaceGeneration > generation) {
          ctx.logger.warn(`codex overflow compaction failed after surface progress: ${message}; retrying`)
          this.overflowRetries.set(agent, retries + 1)
          return { kind: 'retry' }
        }
        ctx.logger.warn(`codex overflow compaction failed: ${message}`)
        return next()
      }
      if (signal.aborted || agent.session.surface.replaceGeneration <= generation) return next()
      if (result !== null) logResult(result, 'context overflow')
      this.overflowRetries.set(agent, retries + 1)
      return { kind: 'retry' }
    })
  }

  /** Pressure: compact the whole history once it crosses the trigger. Overflow: compact unconditionally. */
  async compactIfNeeded(agent, trigger, signal) {
    const session = agent.session
    const target = routedTarget(session)
    if (target === undefined) return null
    if (trigger === 'context-overflow') {
      this.ctx.get('toolResultPruner')?.pruneSession(session)
      const range = selectFullRange(session)
      if (range === null) return null
      return this.compactRegion(range.start, range.end, agent, signal)
    }
    if (trigger !== 'pressure') throw new Error(`unknown compaction trigger ${trigger}`)

    const info = await this.ctx.llm.resolveModelInfo(target.provider, target.model, signal)
    assertNoActiveCompaction(session, 'automatic pressure compaction')
    const targetKey = `${target.provider}/${target.model}`
    const window = info.context?.contextWindow
    if (!Number.isInteger(window) || window <= 0) {
      throw new TargetConfigError(targetKey, `dsh-compaction-codex: no context window for ${targetKey}; configure contextWindow on that model`)
    }
    const reserved = session.requestHeader()?.config.maxTokens ?? info.defaultMaxTokens ?? 0
    const threshold = this.thresholdTokens(window, reserved)
    if (threshold <= 0) {
      throw new TargetConfigError(targetKey, `dsh-compaction-codex: ${targetKey} has no room below its ${window}-token window after ${reserved} reserved output tokens`)
    }
    const total = this.ctx.tokenMeter.measure(session).totalTokens
    if (total < threshold) {
      this.pressureFloor.delete(session)
      return null
    }
    // A compaction that could not get below the trigger (huge prompt/tools)
    // must not resummarize every step: wait for 10% of the window of new growth.
    const floor = this.pressureFloor.get(session)
    if (floor !== undefined && total < floor + Math.floor(window * 0.1)) return null

    const range = selectFullRange(session)
    if (range === null) return null
    const result = await this.compactRegion(range.start, range.end, agent, signal)
    const after = this.ctx.tokenMeter.measure(session).totalTokens
    if (after >= threshold) {
      this.pressureFloor.set(session, after)
      this.ctx.logger.warn(`codex compaction left ${after} tokens, still at or above the ${threshold}-token trigger`)
    } else this.pressureFloor.delete(session)
    return result
  }

  thresholdTokens(window, reserved) {
    const byConfig = this.config.autoCompactTokenLimit > 0 ? this.config.autoCompactTokenLimit : window * this.config.thresholdRatio
    const roomForSummary = window - reserved - this.config.maxTokens
    return Math.floor(Math.min(byConfig, roomForSummary > 0 ? roomForSummary : byConfig))
  }

  async compactRegion(start, end, agent, signal) {
    return this._transaction(agent.session, start, end, agent, { owner: 'current-turn', stability: 'whole-surface' }, signal)
  }

  compactNow(agent, signal, sourceCommandId) {
    signal.throwIfAborted()
    try {
      return agent.runMaintenance(async (agentSignal) => {
        const operationSignal = AbortSignal.any([agentSignal, signal])
        try {
          operationSignal.throwIfAborted()
          const range = selectFullRange(agent.session)
          if (range === null) return null
          return await this._transaction(
            agent.session,
            range.start,
            range.end,
            agent,
            {
              owner: null,
              stability: 'selected-span',
              ...(sourceCommandId === undefined ? {} : { sourceCommandId }),
              flush: async () => {
                await this.ctx.sessions.flush(agent.session)
              },
            },
            operationSignal,
          )
        } catch (error) {
          if (agentSignal.aborted && operationSignal.reason === agentSignal.reason) {
            throw new ManualCompactionError('cancelled', 'manual compaction was cancelled', { cause: error })
          }
          operationSignal.throwIfAborted()
          throw error
        }
      })
    } catch (error) {
      throw new ManualCompactionError('busy', 'manual compaction requires an idle agent with no waking queued work', { cause: error })
    }
  }

  // ── summary request ─────────────────────────────────────────────────────────

  summaryTarget(agent) {
    if (this.config.summarizationProvider !== '') {
      return { provider: this.config.summarizationProvider, model: this.config.summarizationModel }
    }
    const routed = routedTarget(agent.session)
    if (routed !== undefined) return routed
    const { provider, model } = agent.options ?? {}
    if (provider && model) return { provider, model }
    throw new Error('no provider/model available for summarization: route one request or set summarizationProvider and summarizationModel')
  }

  /** Input-token room for the replayed history, or undefined when the window is unknown. */
  async historyBudget(target, input, instruction, signal) {
    let info
    try {
      info = await this.ctx.llm.resolveModelInfo(target.provider, target.model, signal)
    } catch {
      return undefined
    }
    const window = info.context?.contextWindow
    if (!Number.isInteger(window) || window <= 0) return undefined
    const meter = this.ctx.tokenMeter
    const fixed =
      (input.system === null ? 0 : meter.estimateMessage(input.system)) +
      meter.estimateMessage(instruction) +
      (input.tools === undefined ? 0 : Math.ceil(JSON.stringify(input.tools).length / 4))
    return window - this.config.maxTokens - fixed
  }

  /**
   * Summarize the replayed history. Overflow drops the oldest units and
   * retries (Codex `remove_first_item`); transient failures back off and retry.
   */
  async summarize(input, agent, signal) {
    const target = this.summaryTarget(agent)
    const prompt = `${this.config.prompt.trim() || SUMMARIZATION_PROMPT}\n\n${TEXT_ONLY_NOTE}`
    const instruction = deepFreeze({ role: 'user', content: [{ type: 'text', text: prompt }] })
    const meter = this.ctx.tokenMeter

    let units = input.units
    const budget = await this.historyBudget(target, input, instruction, signal)
    if (budget !== undefined) {
      let total = units.reduce((sum, unit) => sum + unit.reduce((s, m) => s + meter.estimateMessage(m), 0), 0)
      let drop = 0
      while (total > budget && drop < units.length - 1) {
        total -= units[drop].reduce((s, m) => s + meter.estimateMessage(m), 0)
        drop += 1
      }
      units = units.slice(drop)
    }

    let transient = 0
    for (;;) {
      signal?.throwIfAborted()
      const messages = [...(input.system === null ? [] : [input.system]), ...units.flat(), instruction]
      try {
        const result = await this.streamSummary(target, messages, input.tools, agent, signal)
        return { ...result, droppedUnits: input.units.length - units.length }
      } catch (error) {
        if (signal?.aborted) throw error
        if (isOverflow(error) && units.length > 1) {
          const drop = Math.min(units.length - 1, Math.max(1, Math.ceil(units.length * 0.1)))
          this.ctx.logger.warn(`codex compaction: summary request exceeded the context window; dropping the oldest ${drop} of ${units.length} history units`)
          units = units.slice(drop)
          transient = 0
          continue
        }
        if (TRANSIENT_CODES.has(errorCode(error)) && transient < this.config.summaryRetries) {
          transient += 1
          await sleep(Math.min(1000 * 2 ** (transient - 1), 10000), signal)
          continue
        }
        throw error
      }
    }
  }

  async streamSummary(target, messages, tools, agent, signal) {
    const assembler = new BlockAssembler()
    const options = {
      provider: target.provider,
      model: target.model,
      messages,
      toolHistory: agent.session.toolHistory(),
      ...(tools === undefined ? {} : { tools: [...tools] }),
      maxTokens: this.config.maxTokens,
      sessionId: agent.session.id,
      purpose: 'compaction',
      ...(signal === undefined ? {} : { signal }),
    }
    for await (const chunk of this.ctx.llm.stream(options)) assembler.push(chunk)
    const error = finishError(assembler.finish)
    if (error !== undefined) throw error
    const rawOutput = assembler.blocks()
    if (contentHasImage(rawOutput)) throw new LlmError('compaction summary cannot contain image output', 'UNSUPPORTED_CONTENT')
    const summaryText = rawOutput
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
      .trim()
    if (summaryText.length === 0) throw new Error('summarization produced no text summary content')
    return {
      summary: [{ type: 'text', text: summaryText }],
      summaryText,
      rawOutput,
      llmStreamCall: true,
      provider: options.provider,
      model: options.model,
      maxTokens: this.config.maxTokens,
      ...(assembler.usage === undefined ? {} : { usage: assembler.usage }),
    }
  }

  // ── the region transaction ──────────────────────────────────────────────────

  _prepare(session, selection) {
    const measurement = this.ctx.tokenMeter.measure(session)
    const selectedNodes = measurement.nodes.slice(selection.startIdx, selection.endIdx + 1)
    if (selectedNodes.length !== selection.shadowedSeqs.length || selectedNodes.some((node, i) => node.seq !== selection.shadowedSeqs[i])) {
      throw new SurfaceChangedError('compaction: selected surface changed before summarization began')
    }
    return {
      ...selection,
      measurement,
      selectedNodes,
      shadowedTokenCount: selectedNodes.reduce((sum, node) => sum + node.heuristicTokens, 0),
      shadowedRouteTokenCount: selectedNodes.reduce((sum, node) => sum + node.tokens, 0),
      input: buildSummarizationInput(session, selection.shadowedSeqs),
      userMessages: collectUserMessages(session, selection.shadowedSeqs),
    }
  }

  _assertWholeSurfaceUnchanged(session, prepared) {
    if (!isDeepStrictEqual(this.ctx.tokenMeter.measure(session).nodes, prepared.measurement.nodes)) {
      throw new SurfaceChangedError('compaction: session surface changed during summarization')
    }
  }

  _assertSelectedSpanStable(session, prepared) {
    let current
    try {
      current = validateSurfaceRegion(session, prepared.start, prepared.end)
    } catch (error) {
      throw new SurfaceChangedError('compaction: the selected span is no longer a valid replacement target', { cause: error })
    }
    if (!isDeepStrictEqual([...current.shadowedSeqs], [...prepared.shadowedSeqs])) {
      throw new SurfaceChangedError('compaction: the selected span changed during summarization')
    }
    if (!isDeepStrictEqual(this.ctx.tokenMeter.measure(session).nodes.slice(current.startIdx, current.endIdx + 1), prepared.selectedNodes)) {
      throw new SurfaceChangedError('compaction: the selected span was rewritten during summarization')
    }
  }

  _recover(error, agent, sourceEventSeqs, signal) {
    return this.ctx.waterfall(
      'compaction/summary-error',
      { session: agent.session, sourceEventSeqs, error, ...(signal === undefined ? {} : { signal }) },
      () => false,
    )
  }

  async _summarizeStage(prepared, agent, compactionId, sourceCommandId, assertStable, signal) {
    let result
    for (;;) {
      signal?.throwIfAborted()
      try {
        result = await this.summarize(prepared.input, agent, signal)
        break
      } catch (error) {
        if (signal?.aborted === true) throw error
        assertStable(agent.session, prepared)
        if (!this._recover(error, agent, prepared.shadowedSeqs, signal)) throw error
        prepared = this._prepare(agent.session, validateSurfaceRegion(agent.session, prepared.start, prepared.end))
      }
    }
    const retained = selectRetainedUserMessages(prepared.userMessages, this.config.userMessageMaxTokens)
    const checkpointMessage = createUserMessage({
      content: buildCheckpointContent(retained, result.summaryText),
      source: compactCheckpointSource(compactionId, sourceCommandId),
    })
    const checkpointTokens = this.ctx.tokenMeter.estimateMessage(checkpointMessage)
    if (checkpointTokens >= prepared.shadowedRouteTokenCount) {
      throw new Error(`checkpoint is not smaller than the history it replaces (${checkpointTokens} >= ${prepared.shadowedRouteTokenCount} estimated tokens)`)
    }
    return { ...prepared, ...result, retainedUserMessages: retained.length, checkpointMessage }
  }

  _commit(session, startEvent, summarized) {
    const { start, end, shadowedSeqs, shadowedTokenCount, summary, rawOutput, provider, model, maxTokens, usage, checkpointMessage } = summarized
    const summaryEvent = session.append('compaction/summary', {
      compactionId: startEvent.data.compactionId,
      ...(startEvent.data.sourceCommandId === undefined ? {} : { sourceCommandId: startEvent.data.sourceCommandId }),
      summary,
      rawOutput,
      llmStreamCall: true,
      shadowedRange: { start, end },
      shadowedSeqs: [...shadowedSeqs],
      shadowedTokenCount,
      provider,
      model,
      ...(maxTokens === undefined ? {} : { maxTokens }),
      ...(usage === undefined ? {} : { usage }),
    })
    session.append('user/message', checkpointMessage, {
      surfaceOp: { op: 'replace', startSeq: start, endSeq: end },
      sourceEventSeqs: [startEvent.seq, summaryEvent.seq, ...shadowedSeqs],
    })
    return {
      compactionId: startEvent.data.compactionId,
      ...(startEvent.data.sourceCommandId === undefined ? {} : { sourceCommandId: startEvent.data.sourceCommandId }),
      startSeq: startEvent.seq,
      summarySeq: summaryEvent.seq,
      summary,
      shadowedRange: { start, end },
      shadowedSeqs: [...shadowedSeqs],
      shadowedTokenCount,
    }
  }

  async _transaction(session, start, end, agent, options, signal) {
    if (options.owner === null) signal?.throwIfAborted()
    const selection = validateSurfaceRegion(session, start, end)
    const entry = inspectCompactionEntryState(session)
    assertCompactionInactive(entry.unmatchedStart, entry.latestEndSeedSeq, 'compaction')
    let owner
    if (options.owner === null) {
      if (entry.openTurn !== null) throw new ManualCompactionError('busy', 'manual compaction: the session already has an open turn')
      owner = null
    } else {
      if (entry.openTurn === null) throw new Error('compactRegion: no open turn; automatic compaction events must be enclosed in a turn')
      owner = entry.openTurn
    }
    const compactionId = CompactionId(randomUUID())
    const lifecycle = {
      compactionId,
      ...(options.sourceCommandId === undefined ? {} : { sourceCommandId: options.sourceCommandId }),
      turn: owner,
    }
    // Synchronously adjacent to the checks above: this marker is the lock.
    const startEvent = session.append('compaction/start', lifecycle)
    const assertStable = options.stability === 'whole-surface'
      ? (s, p) => this._assertWholeSurfaceUnchanged(s, p)
      : (s, p) => this._assertSelectedSpanStable(s, p)

    let failure
    let flushFailure
    let result
    let closed = false
    let closing = false
    let stage = 'summary'
    try {
      const summarized = await this._summarizeStage(this._prepare(session, selection), agent, compactionId, options.sourceCommandId, assertStable, signal)
      if (options.owner === null) signal?.throwIfAborted()
      assertStable(session, summarized)
      stage = 'commit'
      const pending = this._commit(session, startEvent, summarized)
      closing = true
      const endEvent = session.append('compaction/end', lifecycle)
      closed = true
      result = { ...pending, endSeq: endEvent.seq }
      this.ctx.logger.info(
        `codex compaction committed: ${summarized.shadowedSeqs.length} nodes → 1 checkpoint (${summarized.retainedUserMessages} user messages kept verbatim, ${summarized.droppedUnits ?? 0} oldest units trimmed from the summary input)`,
      )
    } catch (error) {
      failure = { error, stage: closing ? 'commit' : stage }
      if (!closing) {
        closing = true
        try {
          session.append('compaction/end', { ...lifecycle, error: errorChain(error) })
          closed = true
        } catch (closeError) {
          failure = { error: closeError, stage: 'commit' }
        }
      }
    }
    if (closed && options.flush !== undefined) {
      try {
        await options.flush()
      } catch (error) {
        flushFailure = error
      }
    }
    if (options.owner === null) signal?.throwIfAborted()
    if (failure !== undefined) {
      if (options.owner === null) {
        if (failure.stage === 'commit') throw new ManualCompactionError('commit', 'manual compaction did not commit cleanly', { cause: failure.error })
        if (failure.error instanceof SurfaceChangedError) throw new ManualCompactionError('changed', 'the compacted history changed during manual compaction', { cause: failure.error })
        throw new ManualCompactionError('summary', 'manual compaction could not produce a smaller summary', { cause: failure.error })
      }
      throw failure.error
    }
    if (flushFailure !== undefined) throw new ManualCompactionError('persistence', 'manual compaction durability checkpoint failed', { cause: flushFailure })
    if (result === undefined) throw new Error('compaction committed without a result')
    return result
  }
}

/** Exposed for tests and tooling; not part of the service contract. */
export const internals = {
  resolveConfig,
  collectUserMessages,
  selectRetainedUserMessages,
  buildCheckpointContent,
  parseCheckpointUserMessages,
  buildSummarizationInput,
  selectFullRange,
  truncateToTokens,
}
