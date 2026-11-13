// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { workspaceKeyForSession } from '../src/client/workspace-menu.ts'

describe('sidebar row lookup', () => {
  it('reads the workspace id from the session row group', () => {
    document.body.innerHTML = '<div><div data-row-key="workspace:old-erp"></div><div data-row-key="session:abc"></div></div><div><div data-row-key="workspace:"></div><div data-row-key="session:loose"></div></div>'
    expect(workspaceKeyForSession(document, 'abc')).toBe('old-erp')
    expect(workspaceKeyForSession(document, 'loose')).toBeUndefined()
    expect(workspaceKeyForSession(document, 'missing')).toBeUndefined()
  })
})
