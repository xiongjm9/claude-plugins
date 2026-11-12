/**
 * Implementation of the WorkspaceDirectoriesService.
 *
 * @module dsh-plugin-workspace-directories/service
 */
import type { AddDirectoryOptions, LinkedDirectory, WorkspaceDirectoriesService } from './types.ts';
import type { ResolvedConfig } from './config.ts';
import { AddirStorage } from './storage.ts';
/**
 * Resolve path to native canonical form with symlinks dereferenced.
 * If the path does not exist, dereferences its nearest existing ancestor.
 */
export declare function canonicalizePath(rawPath: string): string;
/**
 * Check whether a target path is located inside a root directory.
 */
export declare function isSubPath(target: string, root: string): boolean;
/**
 * Whether a path is the Harness profile tree or lies inside it. A Desktop Host runs
 * with its working directory set to its own profile directory, so an inferred
 * primary would otherwise advertise application state as a workspace root.
 * @param target - path to test.
 * @returns true when the path lies inside `<Harness home>/profiles`.
 */
export declare function isHarnessProfilePath(target: string): boolean;
export declare class WorkspaceDirectoriesServiceImpl implements WorkspaceDirectoriesService {
    private readonly config;
    /**
     * Global directory map: canonicalPath -> LinkedDirectory
     */
    private readonly globalEntries;
    /**
     * Session-scoped directory entries: sessionId -> (canonicalPath -> LinkedDirectory)
     */
    private readonly sessionEntries;
    /**
     * Session primary cwd: sessionId -> canonicalPath
     */
    private readonly sessionPrimaries;
    /**
     * Global primary cwd fallback
     */
    private defaultPrimaryPath;
    /**
     * Persistent storage engine
     */
    readonly storage: AddirStorage;
    constructor(config: ResolvedConfig, defaultCwd?: string, storage?: AddirStorage);
    private loadFromStorageForWorkspace;
    private loadConfigDefaults;
    private registerPrimary;
    private ensureUniqueAlias;
    private getSessionMap;
    private getPrimaryPath;
    setPrimary(cwd: string, sessionId?: string): LinkedDirectory;
    getDirectoriesForWorkspace(workspacePath: string): readonly LinkedDirectory[];
    replaceWorkspaceDirectories(workspacePath: string, directories: readonly AddDirectoryOptions[]): readonly LinkedDirectory[];
    addDirectoryToWorkspace(workspacePath: string, options: AddDirectoryOptions): Promise<LinkedDirectory>;
    removeDirectoryFromWorkspace(workspacePath: string, pathOrAlias: string): Promise<boolean>;
    list(sessionId?: string): readonly LinkedDirectory[];
    get(pathOrAlias: string, sessionId?: string): LinkedDirectory | undefined;
    add(options: AddDirectoryOptions, sessionId?: string): Promise<LinkedDirectory>;
    remove(pathOrAlias: string, sessionId?: string): Promise<boolean>;
    resolvePath(target: string, sessionId?: string): string;
    isUnderWorkspace(targetPath: string, sessionId?: string): boolean;
    isReadOnly(targetPath: string, sessionId?: string): boolean;
}
