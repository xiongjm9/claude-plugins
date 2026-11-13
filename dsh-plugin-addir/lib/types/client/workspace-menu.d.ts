/** Sidebar row lookups shared by the session menu entry. */
/**
 * Workspace id rendered in the same sidebar group as a session row.
 * Desktop groups each workspace and its sessions under one section, so the
 * session "..." menu can open that workspace's editor without a second menu.
 * @param doc - document that contains the sidebar rows.
 * @param sessionId - session whose row is open.
 * @returns the workspace id, or undefined when the row is ungrouped or not mounted.
 */
export declare function workspaceKeyForSession(doc: Document, sessionId: string): string | undefined;
