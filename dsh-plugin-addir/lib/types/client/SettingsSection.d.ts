import type { WorkspaceSource } from '@deepseek-ai/dsh-api-workspace-controller/client';
import type { Translate } from './locales.ts';
export declare function AddirSettingsSection({ t, workspaceSource, openEdit }: {
    t: Translate;
    workspaceSource: WorkspaceSource;
    openEdit: (key: string) => void;
}): import("react").JSX.Element;
