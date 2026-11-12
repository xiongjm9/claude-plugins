/** DOM adapter for upstream Workspace menus; selectors are isolated here for version updates. */
import type { EditTarget } from './WorkspaceAddirModal.tsx';
/** Plugin-owned labels, authoritative Workspace lookup and editor activation. */
export interface WorkspaceMenuActions {
    label: () => string;
    resolve: (key: string) => EditTarget | undefined;
    open: (target: EditTarget) => void;
}
/**
 * Add Edit to the menu opened by a registered Workspace's first action button.
 * Native rows retain their handlers; the adapter copies Rename's presentation only.
 * @param doc - Client document containing Workspace rows and portaled menus.
 * @param actions - localized label, current Workspace lookup and editor callback.
 * @returns disposer removing listeners, observer and contributed rows.
 */
export declare function installWorkspaceMenu(doc: Document, actions: WorkspaceMenuActions): () => void;
