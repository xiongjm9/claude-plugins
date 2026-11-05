import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { basename, join, relative, resolve } from 'node:path'

const MAX_INJECT_CHARS = 8000

export function memoryRoots() {
  const home = homedir()
  return {
    dsh: join(home, '.dsh', 'memory'),
    claude: join(home, '.claude', 'memory'),
  }
}

function isInside(root, target) {
  const base = resolve(root)
  const file = resolve(target)
  const rel = relative(base, file)
  return rel === '' || (!rel.startsWith('..') && resolve(base, rel) === file)
}

export function allowedMemoryFile(filePath, extraRoots = []) {
  const roots = [memoryRoots().dsh, memoryRoots().claude, ...extraRoots]
  const file = resolve(filePath)
  return roots.some((root) => isInside(root, file))
}

export async function readMemoryIndex() {
  const roots = memoryRoots()
  const sections = []
  for (const [label, file] of [['DSH', join(roots.dsh, 'MEMORY.md')], ['Claude Code', join(roots.claude, 'MEMORY.md')]]) {
    try {
      const text = await readFile(file, 'utf8')
      if (text.trim().length === 0) continue
      sections.push(`## ${label}\n${file}\n\n${text.trim()}`)
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error
    }
  }
  if (sections.length === 0) return ''
  let body = sections.join('\n\n')
  if (body.length > MAX_INJECT_CHARS) body = `${body.slice(0, MAX_INJECT_CHARS)}\n…[记忆索引已截断]`
  return [
    '跨会话记忆索引。详细内容用 memory_read 读取对应文件。新增一条用 memory_write，写入 ~/.dsh/memory。不要把密钥、令牌写进记忆。',
    body,
  ].join('\n\n')
}

function slug(title) {
  const cleaned = String(title ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  return cleaned.length > 0 ? cleaned : `note-${Date.now()}`
}

/** Write one topic under ~/.dsh/memory and add an index line when it is new. */
export async function writeMemory({ title, body, root }) {
  const text = String(body ?? '').trim()
  const heading = String(title ?? '').trim()
  if (heading.length === 0 || text.length === 0) throw new Error('memory_write 需要 title 和 body')
  const dir = root ?? memoryRoots().dsh
  await mkdir(dir, { recursive: true })
  const name = `${slug(heading)}.md`
  const file = join(dir, name)
  if (!isInside(dir, file)) throw new Error('记忆路径超出记忆目录')
  await writeFile(file, `# ${heading}\n\n${text}\n`, 'utf8')
  const indexPath = join(dir, 'MEMORY.md')
  let index = ''
  try {
    index = await readFile(indexPath, 'utf8')
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error
    index = '# MEMORY\n'
  }
  const line = `- [${heading}](${name})`
  if (!index.includes(`(${name})`)) {
    if (!index.endsWith('\n')) index += '\n'
    index += `${line}\n`
    await writeFile(indexPath, index, 'utf8')
  }
  return { file, indexPath }
}

export async function readMemoryFile(filePath, extraFiles = []) {
  const file = resolve(filePath)
  const extras = extraFiles.map((item) => resolve(item))
  if ((!allowedMemoryFile(file) && !extras.includes(file)) || basename(file).length === 0) {
    throw new Error('memory_read 只能读 ~/.dsh/memory、~/.claude/memory，或当前工作区的 .dsh/memory.md')
  }
  return readFile(file, 'utf8')
}
