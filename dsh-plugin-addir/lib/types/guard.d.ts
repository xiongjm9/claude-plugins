/**
 * Protection guards and sandbox policy integration for multi-directory workspaces.
 * Inspired by Codex sandbox expansion and read-only directory protection.
 *
 * @module dsh-plugin-workspace-directories/guard
 */
import type { WorkspaceDirectoriesService } from './types.ts';
export interface PathAccessCheckResult {
    allowed: boolean;
    readOnly: boolean;
    reason?: string;
}
/**
 * Check if write operations are permitted for a specific target path.
 */
export declare function checkWritePermission(service: WorkspaceDirectoriesService, targetPath: string, sessionId?: string): PathAccessCheckResult;
/**
 * Compute the full list of allowed writable directory roots for sandbox policy.
 * Expands the default workspaceRoot to include all non-read-only linked directories.
 */
export declare function getWritableWorkspaceRoots(service: WorkspaceDirectoriesService, primaryRoot: string, sessionId?: string): string[];
