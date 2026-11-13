// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import type { Context } from '@deepseek-ai/cordis'
import type { WorkspaceId } from '@deepseek-ai/dsh-api-workspace-controller/client'
import { apply } from '../src/client/index.tsx'
import { zh } from '../src/client/locales.ts'
import type { EditTarget } from '../src/client/WorkspaceAddirModal.tsx'

interface MenuRegistration {
  id: string
  target: string
  order: number
  resolve: (target: { workspaceId: WorkspaceId; path: string; displayTitle: string }, signal: AbortSignal) => readonly { id: string; label: string; icon?: { key: string }; run?: () => void }[]
}

function createCtx() {
  const menus: MenuRegistration[] = []
  const slots: { descriptor: { name: string; inject?: () => { hooks?: { editRequest: { getSnapshot: () => EditTarget | null } } } }; component?: unknown }[] = []
  const ctx = {
    locale: {
      register: vi.fn(),
      bind: (_namespace: string) => (key: keyof typeof zh) => zh[key],
    },
    effect: (fn: () => unknown) => { fn(); return () => {} },
    slots: {
      inject: vi.fn((_name: string, factory: () => unknown) => { factory() }),
      register: vi.fn((descriptor: never, component?: unknown) => {
        slots.push({ descriptor, component })
        return () => {}
      }),
    },
    workspaces: {
      list: { getSnapshot: () => ({ items: [] }) },
      rename: vi.fn(async () => {}),
      delete: vi.fn(async () => {}),
    },
    uiWorkspace: { pickDirectory: vi.fn(async () => null) },
    contextMenus: {
      register: vi.fn((input: MenuRegistration) => { menus.push(input); return () => {} }),
    },
  }
  return { ctx: ctx as unknown as Context, menus, slots }
}

describe('project context menu entry', () => {
  it('offers Add to workspace on the project row and opens that project', async () => {
    const { ctx, menus, slots } = createCtx()
    apply(ctx)
    const menu = menus.find(item => item.target === 'workspace')
    expect(menu).toBeDefined()
    expect(menu!.id).toBe('dsh-plugin-addir.add')

    const target = { workspaceId: 'project' as WorkspaceId, path: 'D:/code/app', displayTitle: 'app' }
    const actions = await menu!.resolve(target, new AbortController().signal)
    expect(actions).toHaveLength(1)
    expect(actions[0]!.label).toBe('添加到工作区')
    expect(actions[0]!.icon?.key).toBe('dsh-plugin-addir.add')

    const overlay = slots.find(slot => slot.descriptor.name === 'shell.overlay')!
    expect(overlay.descriptor.inject!().hooks!.editRequest.getSnapshot()).toBeNull()
    actions[0]!.run!()
    expect(overlay.descriptor.inject!().hooks!.editRequest.getSnapshot()).toEqual(target)
  })

  it('keeps the session menu entry registered', () => {
    const { ctx, slots } = createCtx()
    apply(ctx)
    const sessionEntry = slots.find(slot => slot.descriptor.name === 'sidebar.workspaces.session.menu.item')
    expect(sessionEntry).toBeDefined()
  })
})
