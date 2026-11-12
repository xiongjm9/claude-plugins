/** Same-origin HTTP requests; reject HTTP and non-JSON failures before reading results. */
export interface ClientLinkedDirectory {
    path: string;
    alias: string;
    description?: string | undefined;
    readOnly: boolean;
    addedAt?: number;
    source?: 'primary' | 'config' | 'dynamic';
}
export interface GlobalConfig {
    enableTools: boolean;
    enableContextInjection: boolean;
    enforceReadOnly: boolean;
}
export declare function fetchWorkspaceDirectories(workspacePath: string, signal?: AbortSignal): Promise<ClientLinkedDirectory[]>;
export declare function replaceWorkspaceDirectories(workspacePath: string, directories: readonly ClientLinkedDirectory[]): Promise<void>;
export declare function fetchGlobalConfig(signal?: AbortSignal): Promise<GlobalConfig>;
export declare function saveGlobalConfig(config: GlobalConfig): Promise<void>;
