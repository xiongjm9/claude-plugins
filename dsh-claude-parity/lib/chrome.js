/** One agent-browser command. Shell joins and redirects stay out of the argv. */
export function splitCommandLine(line) {
  if (typeof line !== 'string') throw new Error('chrome_cdp 需要一条命令')
  if (/[|&;<>\n]/.test(line) || line.includes('&&')) throw new Error('chrome_cdp 只接受一条命令，不要使用 &&、管道或重定向')
  const args = []
  let current = ''
  let quote = ''
  for (const ch of line) {
    if (quote) {
      if (ch === quote) quote = ''
      else current += ch
      continue
    }
    if (ch === '"' || ch === "'") {
      quote = ch
      continue
    }
    if (/\s/.test(ch)) {
      if (current.length > 0) args.push(current)
      current = ''
      continue
    }
    current += ch
  }
  if (quote) throw new Error('chrome_cdp 命令的引号没有闭合')
  if (current.length > 0) args.push(current)
  if (args.length === 0) throw new Error('chrome_cdp 需要一条 agent-browser 命令，例如 snapshot 或 open http://localhost:8088/')
  return args
}
