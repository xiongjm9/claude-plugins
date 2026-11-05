/**
 * Claude Code settings.json deny list, applied to DSH read tools and shell text:
 *   Read(./.env)  Read(./.env.*)  Read(./secrets/**)  Read(./config/credentials.json)
 */

const READ_TOOLS = new Set(['read', 'read_image', 'grep', 'glob'])
const SHELL_TOOLS = new Set(['bash', 'pwsh'])
const PATH_KEYS = ['file_path', 'path', 'directory', 'cwd']

export function isSecretPath(input) {
  if (typeof input !== 'string' || input.trim().length === 0) return false
  const normalized = input.replace(/\\/g, '/').replace(/^\.\//, '')
  const parts = normalized.split('/').filter((part) => part.length > 0 && part !== '.')
  const base = parts[parts.length - 1] ?? ''
  if (base === '.env' || base.startsWith('.env.')) return true
  if (parts.includes('secrets')) return true
  if (parts.length >= 2 && parts[parts.length - 2] === 'config' && base === 'credentials.json') return true
  return false
}

export function commandMentionsSecret(command) {
  if (typeof command !== 'string' || command.length === 0) return false
  const text = command.replace(/\\/g, '/')
  if (/(^|[\s"'`=:(])\.env(\.[A-Za-z0-9_-]+)?(?=$|[\s"'`])/m.test(text)) return true
  if (/(^|[\s"'`=:(])secrets\//.test(text)) return true
  if (/config\/credentials\.json/.test(text)) return true
  return false
}

function globPatternIsSecret(pattern) {
  if (typeof pattern !== 'string') return false
  const leaf = pattern.replace(/\\/g, '/').split('/').pop() ?? ''
  if (/^\.env(\.|$|\*)/.test(leaf)) return true
  return isSecretPath(pattern.replace(/\*/g, 'x'))
}

/** A denial string, or undefined when the call may proceed. */
export function denialReason(name, args) {
  if (SHELL_TOOLS.has(name)) {
    for (const key of ['command', 'script', 'cmd']) {
      const value = args?.[key]
      if (typeof value === 'string' && commandMentionsSecret(value)) {
        return `拒绝读取密钥文件（命令提到了受保护路径）。规则与 Claude Code 一致：.env、.env.*、secrets/**、config/credentials.json。`
      }
    }
    return undefined
  }
  if (!READ_TOOLS.has(name) || args === null || typeof args !== 'object') return undefined
  for (const key of PATH_KEYS) {
    const value = args[key]
    if (typeof value === 'string' && isSecretPath(value)) {
      return `拒绝读取密钥文件：${value}。规则与 Claude Code 一致：.env、.env.*、secrets/**、config/credentials.json。`
    }
  }
  if (name === 'glob' && globPatternIsSecret(args.pattern)) {
    return `拒绝枚举密钥文件：${args.pattern}。规则与 Claude Code 一致：.env、.env.*、secrets/**、config/credentials.json。`
  }
  return undefined
}
