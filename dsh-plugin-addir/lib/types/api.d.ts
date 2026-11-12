/**
 * HTTP / REST API routes for Addir directory management.
 * Consumed by the workspace editor and profile-wide settings.
 *
 * @module dsh-plugin-addir/api
 */
import type { Context } from '@deepseek-ai/cordis';
import { type ResolvedConfig } from './config.ts';
import type { WorkspaceDirectoriesService } from './types.ts';
export declare function registerAddirRoutes(ctx: Context, service: WorkspaceDirectoriesService, config?: ResolvedConfig): import("@deepseek-ai/cordis").Fiber & PromiseLike<import("@deepseek-ai/cordis").Fiber>;
