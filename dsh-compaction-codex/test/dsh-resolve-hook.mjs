// ESM resolve hook: resolve @deepseek-ai/* as if imported from inside the DSH install.
import { pathToFileURL } from 'node:url'

const parent = pathToFileURL('D:\\dsn\\resources\\app.asar\\dsh\\node_modules\\@deepseek-ai\\dsh-desktop-host\\lib\\index.js').href

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@deepseek-ai/')) return nextResolve(specifier, { ...context, parentURL: parent })
  return nextResolve(specifier, context)
}
