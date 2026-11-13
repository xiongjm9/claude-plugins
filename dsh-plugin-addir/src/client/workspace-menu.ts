/** Sidebar row lookups shared by the session menu entry. */

/**
 * Workspace id rendered in the same sidebar group as a session row.
 * Desktop groups each workspace and its sessions under one section, so the
 * session "..." menu can open that workspace's editor without a second menu.
 * @param doc - document that contains the sidebar rows.
 * @param sessionId - session whose row is open.
 * @returns the workspace id, or undefined when the row is ungrouped or not mounted.
 */
export function workspaceKeyForSession(doc: Document, sessionId: string): string | undefined {
  const row = doc.querySelector(`[data-row-key="session:${CSS.escape(sessionId)}"]`)
  const keyed = row?.parentElement?.querySelector('[data-row-key^="workspace:"]')
  const key = keyed?.getAttribute('data-row-key')
  if (key === null || key === undefined || !key.startsWith('workspace:') || key.length <= 'workspace:'.length) return undefined
  return key.slice('workspace:'.length)
}
