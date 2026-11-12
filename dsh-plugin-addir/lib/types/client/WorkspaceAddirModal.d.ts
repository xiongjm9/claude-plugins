import type { WorkspaceId } from '@deepseek-ai/dsh-api-workspace-controller/client';
import type { Translate } from './locales.ts';
export interface EditTarget {
    workspaceId: WorkspaceId;
    displayTitle: string;
    path: string;
}
export interface EditorActions {
    rename: (id: WorkspaceId, title: string) => Promise<void>;
    removeWorkspace: (id: WorkspaceId) => Promise<void>;
    pick: () => Promise<string | null>;
}
export interface WorkspaceEditorProps extends EditorActions {
    target: EditTarget;
    onClose: () => void;
    t: Translate;
}
export declare function WorkspaceAddirModal({ target, onClose, rename, removeWorkspace, pick, t }: WorkspaceEditorProps): import("react").JSX.Element;
