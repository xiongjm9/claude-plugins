import { Context, Service } from "@deepseek-ai/cordis";
import z from "@deepseek-ai/schemastery";
import { UserMessage } from "@deepseek-ai/dsh-llm";
//#region src/types.d.ts
/**
 * Types and interfaces for the Multi-Directory Workspace plugin.
 * Inspired by Codex (--add-dir) and Antigravity (multi-root active workspaces).
 *
 * @module dsh-plugin-workspace-directories/types
 */
/**
 * Represents a directory associated with a workspace.
 */
interface LinkedDirectory {
  /**
   * Canonical, absolute filesystem path with symlinks resolved.
   */
  readonly path: string;
  /**
   * Semantic alias or unique name representing the directory
   * (e.g. 'shared-lib', 'frontend', 'docs', analogous to Antigravity's CorpusName).
   */
  readonly alias: string;
  /**
   * Human-readable description of what this directory contains and its purpose.
   */
  readonly description?: string | undefined;
  /**
   * Whether the directory is protected as read-only.
   * Read-only directories can be searched and inspected, but write operations are rejected.
   */
  readonly readOnly: boolean;
  /**
   * Timestamp when the directory was linked.
   */
  readonly addedAt: number;
  /**
   * Origin of the directory link:
   * - 'primary': Current session primary working directory (cwd)
   * - 'config': Pre-configured via Cordis configuration
   * - 'dynamic': Added dynamically at runtime by agent or user
   */
  readonly source: 'primary' | 'config' | 'dynamic';
}
/**
 * Options for adding a new directory to the workspace.
 */
interface AddDirectoryOptions {
  /**
   * Absolute or relative path to the directory.
   */
  path: string;
  /**
   * Optional custom alias. If omitted, the basename of the directory is used.
   */
  alias?: string | undefined;
  /**
   * Optional description of the directory's purpose.
   */
  description?: string | undefined;
  /**
   * Optional read-only flag. Defaults to false.
   */
  readOnly?: boolean | undefined;
}
/**
 * Core service managing multi-directory workspace associations.
 */
interface WorkspaceDirectoriesService {
  /**
   * List all linked directories for a session (or globally).
   * Always includes the primary workspace directory.
   *
   * @param sessionId - Optional session ID to scope directory queries.
   */
  list(sessionId?: string): readonly LinkedDirectory[];
  /**
   * Find a linked directory by exact path or alias.
   *
   * @param pathOrAlias - The canonical path or alias to find.
   * @param sessionId - Optional session ID.
   */
  get(pathOrAlias: string, sessionId?: string): LinkedDirectory | undefined;
  /**
   * Associate an additional directory with the workspace.
   * Validates existence, canonicalizes symlinks, and prevents duplicate aliases/paths.
   *
   * @param options - Directory options to add.
   * @param sessionId - Optional session ID for session-scoped additions.
   * @returns The registered LinkedDirectory.
   */
  add(options: AddDirectoryOptions, sessionId?: string): Promise<LinkedDirectory>;
  /**
   * Remove a linked directory by path or alias.
   * The primary workspace directory cannot be removed.
   *
   * @param pathOrAlias - The path or alias to remove.
   * @param sessionId - Optional session ID.
   * @returns true if removed, false if not found or primary.
   */
  remove(pathOrAlias: string, sessionId?: string): Promise<boolean>;
  /**
   * Resolve a path that may use an alias prefix (e.g. '[docs]/api.md' or 'docs:api.md')
   * into a fully qualified canonical absolute path.
   *
   * @param target - Target string or alias path.
   * @param sessionId - Optional session ID.
   */
  resolvePath(target: string, sessionId?: string): string;
  /**
   * Check if a target path is contained within any of the workspace directories.
   *
   * @param targetPath - The path to test.
   * @param sessionId - Optional session ID.
   */
  isUnderWorkspace(targetPath: string, sessionId?: string): boolean;
  /**
   * Check if a target path falls under a read-only workspace directory.
   *
   * @param targetPath - The path to test.
   * @param sessionId - Optional session ID.
   */
  isReadOnly(targetPath: string, sessionId?: string): boolean;
  /**
   * Set or update the primary workspace directory (cwd).
   * Automatically restores persisted directory associations for this workspace.
   *
   * @param cwd - The working directory path.
   * @param sessionId - Optional session ID.
   */
  setPrimary(cwd: string, sessionId?: string): LinkedDirectory;
  /**
   * Get all linked directories for a specific workspace root path from persistence.
   *
   * @param workspacePath - The absolute path of the workspace.
   */
  getDirectoriesForWorkspace(workspacePath: string): readonly LinkedDirectory[];
  /**
   * Associate an additional directory with a specific workspace root path, durably.
   *
   * @param workspacePath - The absolute path of the workspace.
   * @param options - Directory options to add.
   */
  addDirectoryToWorkspace(workspacePath: string, options: AddDirectoryOptions): Promise<LinkedDirectory>;
  /**
   * Remove a linked directory from a specific workspace root path durably.
   *
   * @param workspacePath - The absolute path of the workspace.
   * @param pathOrAlias - The path or alias to remove.
   */
  removeDirectoryFromWorkspace(workspacePath: string, pathOrAlias: string): Promise<boolean>;
  /** Validate every link before replacing a workspace's saved associations. */
  replaceWorkspaceDirectories(workspacePath: string, directories: readonly AddDirectoryOptions[]): readonly LinkedDirectory[];
}
type AddirService = WorkspaceDirectoriesService;
declare module '@deepseek-ai/cordis' {
  interface Context {
    /**
     * Addir (Multi-directory workspace association) service.
     */
    addir: AddirService;
  }
}
//#endregion
//#region src/config.d.ts
/**
 * Definition of a statically configured directory link.
 */
interface StaticDirectoryConfig {
  path: string;
  alias?: string;
  description?: string;
  readOnly?: boolean;
}
/**
 * User configuration for the multi-directory workspace plugin.
 */
interface Config {
  /**
   * Pre-configured directory links to associate with the workspace on launch.
   */
  defaultDirectories?: StaticDirectoryConfig[];
  /**
   * Whether to register agent-facing tools for dynamic directory management.
   * Default: true.
   */
  enableTools?: boolean;
  /**
   * Whether to inject Active Workspace Directories into the model's context before each turn.
   * Default: true.
   */
  enableContextInjection?: boolean;
  /**
   * Whether to enforce read-only restrictions on files under readOnly directories.
   * Default: true.
   */
  enforceReadOnly?: boolean;
}
interface ResolvedConfig {
  readonly defaultDirectories: readonly StaticDirectoryConfig[];
  readonly enableTools: boolean;
  readonly enableContextInjection: boolean;
  readonly enforceReadOnly: boolean;
}
/**
 * Config schema type. Annotating schema exports with it keeps emitted
 * declarations free of schemastery's internal cosmokit types, which a
 * standalone package cannot name.
 */
type ConfigSchema = z<Config>;
declare const StaticDirectoryConfigSchema: z<StaticDirectoryConfig>;
declare const Config: ConfigSchema;
declare function resolveConfig(config?: Config): ResolvedConfig;
//#endregion
//#region src/context.d.ts
declare const WORKSPACE_DIRECTORIES_CONTEXT_KIND = "workspace-directories";
declare module '@deepseek-ai/dsh-llm' {
  interface MessageSourceMap {
    'workspace-directories': {
      kind: 'workspace-directories';
      form: 'instructions';
    };
  }
}
/**
 * Format the active workspace directories into a clear Markdown guide for the model.
 */
declare function formatWorkspaceDirectoriesPrompt(directories: readonly LinkedDirectory[]): string;
/**
 * Construct a UserMessage containing the multi-directory workspace context.
 */
declare function createWorkspaceDirectoriesMessage(directories: readonly LinkedDirectory[]): UserMessage | undefined;
/**
 * Check if a UserMessage is generated by this plugin.
 */
declare function isWorkspaceDirectoriesMessage(message: UserMessage): boolean;
//#endregion
//#region src/guard.d.ts
interface PathAccessCheckResult {
  allowed: boolean;
  readOnly: boolean;
  reason?: string;
}
/**
 * Check if write operations are permitted for a specific target path.
 */
declare function checkWritePermission(service: WorkspaceDirectoriesService, targetPath: string, sessionId?: string): PathAccessCheckResult;
/**
 * Compute the full list of allowed writable directory roots for sandbox policy.
 * Expands the default workspaceRoot to include all non-read-only linked directories.
 */
declare function getWritableWorkspaceRoots(service: WorkspaceDirectoriesService, primaryRoot: string, sessionId?: string): string[];
//#endregion
//#region src/storage.d.ts
/**
 * Persistent storage for workspace-to-directories mappings.
 * Saves directory associations durably under $DSH_HOME/storages/addir.json.
 *
 * @module dsh-plugin-addir/storage
 */
interface StoredDirectoryEntry {
  path: string;
  alias: string;
  description?: string;
  readOnly: boolean;
  addedAt: number;
}
interface StoredWorkspaceMap {
  /**
   * Mapping: canonicalWorkspaceRoot -> array of associated directories
   */
  workspaces: Record<string, StoredDirectoryEntry[]>;
}
declare class AddirStorage {
  private readonly storageFilePath;
  private memoryData;
  constructor(storageFilePath?: string);
  load(): StoredWorkspaceMap;
  save(data: StoredWorkspaceMap): void;
  getDirectories(workspacePath: string): StoredDirectoryEntry[];
  addDirectory(workspacePath: string, entry: StoredDirectoryEntry): void;
  removeDirectory(workspacePath: string, pathOrAlias: string): boolean;
}
//#endregion
//#region src/service.d.ts
/**
 * Resolve path to native canonical form with symlinks dereferenced.
 * If the path does not exist, dereferences its nearest existing ancestor.
 */
declare function canonicalizePath(rawPath: string): string;
/**
 * Check whether a target path is located inside a root directory.
 */
declare function isSubPath(target: string, root: string): boolean;
/**
 * Whether a path is the Harness profile tree or lies inside it. A Desktop Host runs
 * with its working directory set to its own profile directory, so an inferred
 * primary would otherwise advertise application state as a workspace root.
 * @param target - path to test.
 * @returns true when the path lies inside `<Harness home>/profiles`.
 */
declare function isHarnessProfilePath(target: string): boolean;
declare class WorkspaceDirectoriesServiceImpl implements WorkspaceDirectoriesService {
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
//#endregion
//#region src/tools.d.ts
type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | {
  [key: string]: JsonValue;
} | JsonValue[];
/**
 * Tool: addir_list (alias: workspace_directories_list)
 * Inspect all directories currently associated with this workspace.
 */
declare function createListTool(service: WorkspaceDirectoriesService, toolName?: string): import("@deepseek-ai/dsh-tools").ToolDefinition;
/**
 * Tool: addir_add (alias: workspace_directories_add)
 * Associate an additional directory with the workspace (inspired by Codex --add-dir).
 */
declare function createAddTool(service: WorkspaceDirectoriesService, toolName?: string): import("@deepseek-ai/dsh-tools").ToolDefinition;
/**
 * Tool: addir_remove (alias: workspace_directories_remove)
 * Remove a previously linked directory from the workspace.
 */
declare function createRemoveTool(service: WorkspaceDirectoriesService, toolName?: string): import("@deepseek-ai/dsh-tools").ToolDefinition;
//#endregion
//#region src/index.d.ts
declare const name = "dsh-plugin-addir";
/**
 * Service Provider wrapping WorkspaceDirectoriesServiceImpl for Cordis.
 */
declare class AddirProvider extends Service implements AddirService {
  static Config: ConfigSchema;
  private readonly impl;
  constructor(ctx: Context, config?: Config);
  list(sessionId?: string): readonly LinkedDirectory[];
  get(pathOrAlias: string, sessionId?: string): LinkedDirectory | undefined;
  add(options: AddDirectoryOptions, sessionId?: string): Promise<LinkedDirectory>;
  remove(pathOrAlias: string, sessionId?: string): Promise<boolean>;
  resolvePath(target: string, sessionId?: string): string;
  isUnderWorkspace(targetPath: string, sessionId?: string): boolean;
  isReadOnly(targetPath: string, sessionId?: string): boolean;
  setPrimary(cwd: string, sessionId?: string): LinkedDirectory;
  getDirectoriesForWorkspace(workspacePath: string): readonly LinkedDirectory[];
  addDirectoryToWorkspace(workspacePath: string, options: any): Promise<LinkedDirectory>;
  removeDirectoryFromWorkspace(workspacePath: string, pathOrAlias: string): Promise<boolean>;
  replaceWorkspaceDirectories(workspacePath: string, directories: readonly AddDirectoryOptions[]): readonly LinkedDirectory[];
}
/**
 * Standard Cordis plugin entry function.
 */
declare function apply(ctx: Context, config?: Config): void;
//#endregion
export { AddDirectoryOptions, AddirProvider, AddirProvider as WorkspaceDirectoriesProvider, AddirProvider as default, AddirService, Config, ConfigSchema, JsonPrimitive, JsonValue, LinkedDirectory, PathAccessCheckResult, ResolvedConfig, StaticDirectoryConfig, StaticDirectoryConfigSchema, WORKSPACE_DIRECTORIES_CONTEXT_KIND, WorkspaceDirectoriesService, WorkspaceDirectoriesServiceImpl, apply, canonicalizePath, checkWritePermission, createAddTool, createListTool, createRemoveTool, createWorkspaceDirectoriesMessage, formatWorkspaceDirectoriesPrompt, getWritableWorkspaceRoots, isHarnessProfilePath, isSubPath, isWorkspaceDirectoriesMessage, name, resolveConfig };
//# sourceMappingURL=index.d.ts.map