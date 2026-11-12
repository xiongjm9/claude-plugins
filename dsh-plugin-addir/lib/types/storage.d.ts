/**
 * Persistent storage for workspace-to-directories mappings.
 * Saves directory associations durably under $DSH_HOME/storages/addir.json.
 *
 * @module dsh-plugin-addir/storage
 */
export interface StoredDirectoryEntry {
    path: string;
    alias: string;
    description?: string;
    readOnly: boolean;
    addedAt: number;
}
export interface StoredWorkspaceMap {
    /**
     * Mapping: canonicalWorkspaceRoot -> array of associated directories
     */
    workspaces: Record<string, StoredDirectoryEntry[]>;
}
export declare function getDefaultStoragePath(): string;
export declare class AddirStorage {
    private readonly storageFilePath;
    private memoryData;
    constructor(storageFilePath?: string);
    load(): StoredWorkspaceMap;
    save(data: StoredWorkspaceMap): void;
    getDirectories(workspacePath: string): StoredDirectoryEntry[];
    addDirectory(workspacePath: string, entry: StoredDirectoryEntry): void;
    removeDirectory(workspacePath: string, pathOrAlias: string): boolean;
}
