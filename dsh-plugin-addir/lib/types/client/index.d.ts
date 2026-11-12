/** Workspace menu adapter, persistent editor overlay and global settings page. */
import type { Context } from '@deepseek-ai/cordis';
import { type CopyKey } from './locales.ts';
export * from './api.ts';
export * from './WorkspaceAddirModal.tsx';
export * from './SettingsSection.tsx';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        addir: CopyKey;
    }
}
export declare const inject: string[];
export declare function apply(ctx: Context): void;
