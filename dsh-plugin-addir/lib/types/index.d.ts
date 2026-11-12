/**
 * Multi-Directory Workspace plugin entry for DeepSeek Harness.
 * Inspired by Codex (--add-dir) and Google Antigravity (active multi-root workspaces).
 *
 * @module dsh-plugin-workspace-directories
 */
import { Context, Service } from '@deepseek-ai/cordis';
import { Config, type ConfigSchema } from './config.ts';
import type { AddDirectoryOptions, AddirService } from './types.ts';
export * from './config.ts';
export * from './context.ts';
export * from './guard.ts';
export * from './service.ts';
export * from './tools.ts';
export * from './types.ts';
export declare const name = "dsh-plugin-addir";
/**
 * Service Provider wrapping WorkspaceDirectoriesServiceImpl for Cordis.
 */
export declare class AddirProvider extends Service implements AddirService {
    static Config: ConfigSchema;
    private readonly impl;
    constructor(ctx: Context, config?: Config);
    list(sessionId?: string): readonly import("./types.ts").LinkedDirectory[];
    get(pathOrAlias: string, sessionId?: string): import("./types.ts").LinkedDirectory | undefined;
    add(options: AddDirectoryOptions, sessionId?: string): Promise<import("./types.ts").LinkedDirectory>;
    remove(pathOrAlias: string, sessionId?: string): Promise<boolean>;
    resolvePath(target: string, sessionId?: string): string;
    isUnderWorkspace(targetPath: string, sessionId?: string): boolean;
    isReadOnly(targetPath: string, sessionId?: string): boolean;
    setPrimary(cwd: string, sessionId?: string): import("./types.ts").LinkedDirectory;
    getDirectoriesForWorkspace(workspacePath: string): readonly import("./types.ts").LinkedDirectory[];
    addDirectoryToWorkspace(workspacePath: string, options: any): Promise<import("./types.ts").LinkedDirectory>;
    removeDirectoryFromWorkspace(workspacePath: string, pathOrAlias: string): Promise<boolean>;
    replaceWorkspaceDirectories(workspacePath: string, directories: readonly import('./types.ts').AddDirectoryOptions[]): readonly import("./types.ts").LinkedDirectory[];
}
/**
 * Standard Cordis plugin entry function.
 */
export declare function apply(ctx: Context, config?: Config): void;
export { AddirProvider as WorkspaceDirectoriesProvider };
export default AddirProvider;
