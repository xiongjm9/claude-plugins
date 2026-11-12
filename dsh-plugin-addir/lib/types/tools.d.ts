/**
 * Agent-facing tools for multi-directory workspace management.
 * Inspired by Codex (--add-dir) and Antigravity workspace inspection.
 *
 * @module dsh-plugin-workspace-directories/tools
 */
import type { WorkspaceDirectoriesService } from './types.ts';
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | {
    [key: string]: JsonValue;
} | JsonValue[];
/**
 * Tool: addir_list (alias: workspace_directories_list)
 * Inspect all directories currently associated with this workspace.
 */
export declare function createListTool(service: WorkspaceDirectoriesService, toolName?: string): import("@deepseek-ai/dsh-tools").ToolDefinition;
/**
 * Tool: addir_add (alias: workspace_directories_add)
 * Associate an additional directory with the workspace (inspired by Codex --add-dir).
 */
export declare function createAddTool(service: WorkspaceDirectoriesService, toolName?: string): import("@deepseek-ai/dsh-tools").ToolDefinition;
/**
 * Tool: addir_remove (alias: workspace_directories_remove)
 * Remove a previously linked directory from the workspace.
 */
export declare function createRemoveTool(service: WorkspaceDirectoriesService, toolName?: string): import("@deepseek-ai/dsh-tools").ToolDefinition;
