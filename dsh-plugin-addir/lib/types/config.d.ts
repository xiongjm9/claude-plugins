import z from '@deepseek-ai/schemastery';
/**
 * Definition of a statically configured directory link.
 */
export interface StaticDirectoryConfig {
    path: string;
    alias?: string;
    description?: string;
    readOnly?: boolean;
}
/**
 * User configuration for the multi-directory workspace plugin.
 */
export interface Config {
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
export interface ResolvedConfig {
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
export type ConfigSchema = z<Config>;
export declare const StaticDirectoryConfigSchema: z<StaticDirectoryConfig>;
export declare const Config: ConfigSchema;
export declare function resolveConfig(config?: Config): ResolvedConfig;
