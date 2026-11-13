window.__ModuleLoader__.load({
	id: "dsh-plugin-addir",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let _deepseek_ai_dsh_client_store = require("@deepseek-ai/dsh-client-store");
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/workspace-menu.ts
		/** Sidebar row lookups shared by the session menu entry. */
		/**
		* Workspace id rendered in the same sidebar group as a session row.
		* Desktop groups each workspace and its sessions under one section, so the
		* session "..." menu can open that workspace's editor without a second menu.
		* @param doc - document that contains the sidebar rows.
		* @param sessionId - session whose row is open.
		* @returns the workspace id, or undefined when the row is ungrouped or not mounted.
		*/
		function workspaceKeyForSession(doc, sessionId) {
			const key = (doc.querySelector(`[data-row-key="session:${CSS.escape(sessionId)}"]`)?.parentElement?.querySelector("[data-row-key^=\"workspace:\"]"))?.getAttribute("data-row-key");
			if (key === null || key === void 0 || !key.startsWith("workspace:") || key.length <= 10) return void 0;
			return key.slice(10);
		}
		//#endregion
		//#region src/client/api.ts
		async function request(action, body, signal) {
			const response = await fetch(new URL(`api/addir/${action}`, document.baseURI), {
				method: body === void 0 ? "GET" : "POST",
				headers: { "Content-Type": "application/json" },
				...body === void 0 ? {} : { body: JSON.stringify(body) },
				...signal === void 0 ? {} : { signal }
			});
			if (!response.headers.get("content-type")?.includes("application/json")) throw new Error(`Addir API: HTTP ${response.status}`);
			const result = await response.json();
			if (!response.ok || result.ok === false) throw new Error(result.error || `HTTP ${response.status}`);
			return result;
		}
		async function fetchWorkspaceDirectories(workspacePath, signal) {
			return (await request("list", { workspacePath }, signal)).directories;
		}
		async function replaceWorkspaceDirectories(workspacePath, directories) {
			await request("replace", {
				workspacePath,
				directories
			});
		}
		async function fetchGlobalConfig(signal) {
			return (await request("config", void 0, signal)).config;
		}
		async function saveGlobalConfig(config) {
			await request("config", config);
		}
		//#endregion
		//#region src/client/SettingsSection.tsx
		/** Profile-wide switches; workspace associations belong to the workspace editor. */
		function AddirSettingsSection({ t, workspaceSource, openEdit }) {
			const [config, setConfig] = (0, react.useState)(null);
			const [busy, setBusy] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)(null);
			const [saved, setSaved] = (0, react.useState)(false);
			(0, react.useEffect)(() => {
				const controller = new AbortController();
				fetchGlobalConfig(controller.signal).then(setConfig).catch((reason) => {
					if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : String(reason));
				});
				return () => controller.abort();
			}, []);
			const save = async () => {
				if (!config) return;
				setBusy(true);
				setError(null);
				setSaved(false);
				try {
					await saveGlobalConfig(config);
					setSaved(true);
				} catch (reason) {
					setError(reason instanceof Error ? reason.message : String(reason));
				} finally {
					setBusy(false);
				}
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "addir-settings",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", { children: t("globalTitle") }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("globalNote") }),
					config === null ? error === null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, { state: "ongoing" }) : null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [[
						[
							"enableTools",
							"tools",
							"toolsNote"
						],
						[
							"enableContextInjection",
							"context",
							"contextNote"
						],
						[
							"enforceReadOnly",
							"guard",
							"guardNote"
						]
					].map(([key, label, note]) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "addir-setting",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
							htmlFor: `addir-${key}`,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t(label) }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t(note) })]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
							id: `addir-${key}`,
							type: "checkbox",
							checked: config[key],
							disabled: busy,
							onChange: (event) => {
								setConfig({
									...config,
									[key]: event.target.checked
								});
								setSaved(false);
							}
						})]
					}, key)), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Button, {
						variant: "primary",
						disabled: busy,
						onClick: () => {
							save();
						},
						children: [busy && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, { state: "ongoing" }), t("save")]
					}) })] }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(WorkspaceEditors, {
						source: workspaceSource,
						openEdit,
						t
					}),
					error !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "addir-error",
						role: "alert",
						children: error
					}),
					saved && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						role: "status",
						children: t("saved")
					})
				]
			});
		}
		/** Settings fallback remains available when an upstream menu layout changes. */
		function WorkspaceEditors({ source, openEdit, t }) {
			const snapshot = (0, react.useSyncExternalStore)((listener) => source.subscribe(listener), () => source.getSnapshot());
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "addir-workspace-editors",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: t("workspaceEditors") }), snapshot.items.map((workspace) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "addir-setting",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: workspace.title || workspace.path }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
						variant: "outline",
						onClick: () => openEdit(workspace.workspaceId),
						children: t("edit")
					})]
				}, workspace.workspaceId))]
			});
		}
		//#endregion
		//#region src/client/WorkspaceAddirModal.tsx
		/** Project title and folder associations remain a draft until Save. */
		const folderName = (path) => path.split(/[\\/]/).filter(Boolean).at(-1) || path;
		function WorkspaceAddirModal({ target, onClose, rename, removeWorkspace, pick, t }) {
			const [title, setTitle] = (0, react.useState)(target.displayTitle);
			const [directories, setDirectories] = (0, react.useState)([]);
			const [loading, setLoading] = (0, react.useState)(true);
			const [loaded, setLoaded] = (0, react.useState)(false);
			const [reload, setReload] = (0, react.useState)(0);
			const [busy, setBusy] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)(null);
			const [picking, setPicking] = (0, react.useState)(false);
			const [confirmRemove, setConfirmRemove] = (0, react.useState)(false);
			(0, react.useEffect)(() => {
				const controller = new AbortController();
				setLoading(true);
				setLoaded(false);
				setError(null);
				fetchWorkspaceDirectories(target.path, controller.signal).then((rows) => {
					if (!controller.signal.aborted) {
						setDirectories(rows);
						setLoaded(true);
						setLoading(false);
					}
				}).catch((reason) => {
					if (!controller.signal.aborted) {
						setError(reason instanceof Error ? reason.message : String(reason));
						setLoading(false);
					}
				});
				return () => controller.abort();
			}, [target.path, reload]);
			const close = () => {
				if (!busy && !picking) onClose();
			};
			const report = (reason) => setError(reason instanceof Error ? reason.message : String(reason));
			const add = async () => {
				setPicking(true);
				setError(null);
				try {
					const path = await pick();
					if (path === null) return;
					if ([target.path, ...directories.map((row) => row.path)].includes(path)) {
						setError(t("duplicate"));
						return;
					}
					setDirectories([...directories, {
						path,
						alias: "",
						readOnly: false
					}]);
				} catch (reason) {
					report(reason);
				} finally {
					setPicking(false);
				}
			};
			const save = async () => {
				setBusy(true);
				setError(null);
				let renamed = false;
				try {
					if (title.trim() !== target.displayTitle) {
						await rename(target.workspaceId, title.trim());
						renamed = true;
					}
					await replaceWorkspaceDirectories(target.path, directories);
					onClose();
				} catch (reason) {
					if (renamed) try {
						await rename(target.workspaceId, target.displayTitle);
					} catch (restoreError) {
						report(restoreError);
						return;
					}
					report(reason);
				} finally {
					setBusy(false);
				}
			};
			const remove = async () => {
				setBusy(true);
				setError(null);
				try {
					await removeWorkspace(target.workspaceId);
					onClose();
				} catch (reason) {
					report(reason);
				} finally {
					setBusy(false);
				}
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
				open: true,
				title: t("title"),
				closeLabel: t("close"),
				onClose: close,
				className: "addir-modal",
				contentClassName: "addir-modal-content",
				footer: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
						variant: "ghost",
						className: "addir-danger",
						disabled: busy || picking || loading,
						onClick: () => setConfirmRemove(true),
						children: t("unlink")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: "addir-footer-spacer" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
						variant: "ghost",
						disabled: busy || picking,
						onClick: close,
						children: t("cancel")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Button, {
						variant: "primary",
						className: "addir-save",
						disabled: busy || picking || !loaded || confirmRemove || !title.trim(),
						onClick: () => {
							save();
						},
						children: [busy && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, { state: "ongoing" }), t("save")]
					})
				] }),
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "addir-editor",
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Input, {
							className: "addir-name",
							icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconFolderCloseRegular, { size: 20 }),
							value: title,
							disabled: busy || picking,
							"data-modal-autofocus": true,
							"aria-label": t("name"),
							onChange: (event) => setTitle(event.target.value)
						}),
						confirmRemove ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "addir-confirm",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("unlinkNote") }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "addir-confirm-actions",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
									variant: "ghost",
									disabled: busy || picking,
									onClick: () => setConfirmRemove(false),
									children: t("cancel")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
									variant: "outline",
									className: "addir-danger",
									disabled: busy || picking,
									onClick: () => {
										remove();
									},
									children: t("confirmUnlink")
								})]
							})]
						}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "addir-source",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
								className: "addir-heading",
								children: t("folders")
							}), loading ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: "addir-status",
								role: "status",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, { state: "ongoing" }), t("loading")]
							}) : !loaded ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "outline",
								onClick: () => setReload((value) => value + 1),
								children: t("retry")
							}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "addir-folder-list",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "addir-folder",
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconFolderCloseRegular, { size: 20 }),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												className: "addir-folder-info",
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: "addir-folder-name",
													children: folderName(target.path)
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: "addir-folder-path",
													title: target.path,
													children: target.path
												})]
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: "addir-primary",
												children: t("primary")
											})
										]
									}),
									directories.map((directory, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "addir-folder",
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconFolderCloseRegular, { size: 20 }),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												className: "addir-folder-info",
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: "addir-folder-name",
													children: directory.alias || folderName(directory.path)
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: "addir-folder-path",
													title: directory.path,
													children: directory.path
												})]
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												className: "addir-folder-actions",
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
													className: "addir-check",
													children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
														type: "checkbox",
														checked: directory.readOnly,
														disabled: busy || picking,
														onChange: (event) => setDirectories((rows) => rows.map((row, i) => i === index ? {
															...row,
															readOnly: event.target.checked
														} : row))
													}), t("readOnly")]
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
													label: t("remove"),
													children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
														variant: "ghost",
														"aria-label": `${t("remove")}: ${directory.alias || directory.path}`,
														disabled: busy || picking,
														onClick: () => setDirectories((rows) => rows.filter((_, i) => i !== index)),
														children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCloseOutlineRegular, {})
													})
												})]
											})
										]
									}, directory.path)),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
										type: "button",
										className: "addir-add",
										disabled: busy || picking,
										onClick: () => {
											add();
										},
										children: [picking ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, { state: "ongoing" }) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconProjectAddOutlineRegular, { size: 20 }), t("add")]
									})
								]
							})]
						}),
						error !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "addir-error",
							role: "alert",
							children: error
						})
					]
				})
			});
		}
		//#endregion
		//#region src/client/locales.ts
		/** Copy owned by the Addir client. */
		const en = {
			workspaceEditors: "Workspaces",
			edit: "Edit",
			title: "Edit project",
			name: "Project name",
			folders: "Source folders",
			addToWorkspace: "Add to workspace",
			add: "Add folder",
			path: "Folder path",
			alias: "Alias (optional)",
			readOnly: "Read only",
			browse: "Browse…",
			select: "Select this folder",
			up: "Parent folder",
			remove: "Remove folder",
			primary: "Primary folder",
			cancel: "Cancel",
			save: "Save",
			close: "Close",
			loading: "Loading…",
			unlink: "Remove local project",
			confirmUnlink: "Remove project",
			unlinkNote: "Remove this workspace from the sidebar? Files and conversations are kept.",
			duplicate: "This folder is already in the project",
			nameRequired: "Enter a project name",
			pathRequired: "Enter a folder path",
			globalTitle: "Linked directories",
			globalNote: "Global plugin behavior. Manage each project’s folders from “Add to workspace” in the project’s right-click menu.",
			tools: "Agent directory tools",
			toolsNote: "Allow the agent to list, add and remove associated directories.",
			context: "Directory context",
			contextNote: "Include associated directories in the agent’s context.",
			guard: "Read-only protection",
			guardNote: "Enforce the read-only flags on associated directories.",
			saved: "Settings saved",
			retry: "Retry"
		};
		const zh = {
			workspaceEditors: "工作区",
			edit: "编辑",
			title: "编辑项目",
			name: "项目名称",
			folders: "源文件夹",
			addToWorkspace: "添加到工作区",
			add: "添加文件夹",
			path: "文件夹路径",
			alias: "别名（选填）",
			readOnly: "只读",
			browse: "浏览…",
			select: "选择此文件夹",
			up: "上级目录",
			remove: "移除文件夹",
			primary: "主文件夹",
			cancel: "取消",
			save: "保存",
			close: "关闭",
			loading: "加载中…",
			unlink: "移除本地项目",
			confirmUnlink: "确认移除",
			unlinkNote: "从侧边栏移除此工作区？本地文件和会话都会保留",
			duplicate: "此文件夹已在项目中",
			nameRequired: "请输入项目名称",
			pathRequired: "请输入文件夹路径",
			globalTitle: "关联目录",
			globalNote: "管理插件的全局行为。各项目的文件夹请在项目右键菜单的“添加到工作区”中管理",
			tools: "智能体目录工具",
			toolsNote: "允许智能体查看、添加和移除关联目录",
			context: "目录上下文",
			contextNote: "让智能体感知当前工作区的关联目录",
			guard: "只读保护",
			guardNote: "对标记为只读的关联目录启用写入保护",
			saved: "设置已保存",
			retry: "重试"
		};
		//#endregion
		//#region src/client/styles.ts
		/** Project dialogs and global settings use the host's light and dark theme tokens. */
		const styles = `
.addir-modal { width: min(560px, 100%); max-height: 100%; gap: 24px; }
.addir-modal-content { min-height: 0; overflow-y: auto; }
.addir-modal-content h2 { font-size: 20px; line-height: 28px; }
.addir-editor *, .addir-settings * { box-sizing: border-box; }
.addir-editor { display: flex; flex-direction: column; gap: 24px; color: var(--dsw-alias-label-primary); }
.addir-name { width: 100%; height: 44px; padding: 0 12px; gap: 12px; border-width: 1px; }
.addir-name:focus-within { box-shadow: 0 0 0 1px var(--dsw-alias-state-business-primary); }
.addir-name > span { flex: none; width: 20px; color: var(--dsw-alias-label-secondary); }
.addir-name input { font-size: 16px; }
.addir-source { display: flex; flex-direction: column; gap: 12px; }
.addir-heading { margin: 0; font-size: 14px; font-weight: 500; line-height: 22px; }
.addir-folder-list { border: 0.5px solid var(--dsw-alias-border-l3); border-radius: var(--dsw-radius-lg); overflow: hidden; }
.addir-folder { display: flex; align-items: center; gap: 12px; min-height: 76px; padding: 14px 16px; }
.addir-folder > svg { flex: none; color: var(--dsw-alias-label-secondary); }
.addir-folder + .addir-folder { border-top: 0.5px solid var(--dsw-alias-border-l3); }
.addir-folder-info { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 0; }
.addir-folder-name { font-size: 14px; line-height: 22px; }
.addir-folder-path { color: var(--dsw-alias-label-secondary); font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.addir-primary { flex: none; color: var(--dsw-alias-label-tertiary); font-size: 12px; }
.addir-folder-actions { display: flex; align-items: center; gap: 8px; }
.addir-check { display: flex; flex-direction: row; align-items: center; gap: 6px; font-size: 12px; color: var(--dsw-alias-label-secondary); white-space: nowrap; }
.addir-check input, .addir-setting input { accent-color: var(--dsw-alias-state-business-primary); }
.addir-add { box-sizing: border-box; display: flex; align-items: center; gap: 12px; width: 100%; min-height: 52px; padding: 14px 16px; border: 0; border-top: 0.5px solid var(--dsw-alias-border-l3); background: transparent; color: var(--dsw-alias-label-primary); font: inherit; font-size: 14px; text-align: left; cursor: pointer; }
.addir-add > svg { color: var(--dsw-alias-label-secondary); }
.addir-add:hover { background: var(--dsw-alias-interactive-bg-hover); }
.addir-add:focus-visible { outline: var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color); outline-offset: -3px; }
.addir-footer-spacer { flex: 1; }
.addir-danger { color: var(--dsw-alias-state-error-primary) !important; background: var(--dsw-alias-interactive-bg-hover-danger) !important; }
.addir-save { min-width: 72px; }
.addir-confirm p { font-size: 14px; line-height: 22px; margin: 0; }
.addir-confirm-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
.addir-status { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; color: var(--dsw-alias-label-secondary); }
.addir-error { color: var(--dsw-alias-state-error-primary); font-size: 13px; line-height: 20px; overflow-wrap: anywhere; }
.addir-settings { display: flex; flex-direction: column; gap: 24px; max-width: 720px; color: var(--dsw-alias-label-primary); }
.addir-settings h2 { font-size: 20px; font-weight: 500; margin: 0; }
.addir-settings p { color: var(--dsw-alias-label-secondary); margin: 0; font-size: 13px; line-height: 1.6; }
.addir-setting { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 16px 0; border-bottom: 0.5px solid var(--dsw-alias-border-l3); }
.addir-setting label { display: flex; flex-direction: column; gap: 6px; font-size: 14px; }
@media (max-width: 520px) {
  .addir-folder { flex-wrap: wrap; }
  .addir-folder-actions { margin-left: 32px; }
  .addir-primary { display: none; }
  .addir-danger { padding: 0 10px; font-size: 12px; }
}
`;
		//#endregion
		//#region src/client/index.tsx
		const inject = [
			"slots",
			"locale",
			"workspaces",
			"uiWorkspace",
			"contextMenus"
		];
		function SessionEditMenuItem({ sessionId, useMenuOpenState, t, resolveSession, open }) {
			const [, setMenuOpen] = useMenuOpenState();
			const target = resolveSession(sessionId);
			if (target === void 0) return null;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.MenuItemButton, {
				separatorBefore: true,
				icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconEditOutlineRegular, {}),
				onSelect: () => {
					setMenuOpen(false);
					open(target);
				},
				children: t("edit")
			});
		}
		function EditOverlay({ useEditRequest, closeEdit, t, ...actions }) {
			const target = useEditRequest((value) => value);
			return target === null ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(WorkspaceAddirModal, {
				target,
				onClose: closeEdit,
				t,
				...actions
			}, target.workspaceId);
		}
		function apply(ctx) {
			const editRequest = (0, _deepseek_ai_dsh_client_store.createSnapshotStore)(null);
			ctx.effect(() => ctx.locale.register("addir", {
				zh,
				en
			}), "addir: localized copy");
			ctx.effect(() => {
				const tag = document.createElement("style");
				tag.dataset.plugin = "dsh-plugin-addir";
				tag.textContent = styles;
				document.head.append(tag);
				return () => {
					tag.remove();
				};
			}, "addir: editor styles");
			const t = ctx.locale.bind("addir");
			const resolveWorkspace = (key) => {
				const workspace = ctx.workspaces.list.getSnapshot().items.find((item) => item.workspaceId === key);
				if (workspace === void 0) return void 0;
				const basename = workspace.path.split(/[\\/]/).filter(Boolean).at(-1) || workspace.path;
				return {
					workspaceId: workspace.workspaceId,
					displayTitle: workspace.title || basename,
					path: workspace.path
				};
			};
			const resolveSession = (sessionId) => {
				const key = ctx.workspaces.list.getSnapshot().items.find((item) => item.sessionIds?.includes(sessionId))?.workspaceId ?? workspaceKeyForSession(document, sessionId);
				return key === void 0 ? void 0 : resolveWorkspace(key);
			};
			ctx.effect(() => ctx.contextMenus.register({
				id: "dsh-plugin-addir.add",
				target: "workspace",
				order: 200,
				resolve: ({ workspaceId, path, displayTitle }) => [{
					id: "add",
					label: t("addToWorkspace"),
					icon: { key: "dsh-plugin-addir.add" },
					run: () => {
						editRequest.set({
							workspaceId,
							path,
							displayTitle
						});
					}
				}]
			}), "addir: workspace context menu");
			ctx.slots.inject("contextMenu.icon", () => ctx.slots.register({
				name: "contextMenu.icon",
				key: "dsh-plugin-addir.add"
			}, _deepseek_ai_dsh_client_ui_primitives.IconProjectAddOutlineRegular));
			ctx.slots.inject("sidebar.workspaces.session.menu.item", () => ctx.slots.register({
				name: "sidebar.workspaces.session.menu.item",
				id: "dsh-plugin-addir.edit",
				order: 500,
				locale: "addir",
				inject: () => ({
					resolveSession,
					open: (target) => {
						editRequest.set(target);
					}
				})
			}, SessionEditMenuItem));
			ctx.slots.inject("shell.overlay", () => ctx.slots.register({
				name: "shell.overlay",
				id: "dsh-plugin-addir.editor",
				locale: "addir",
				inject: () => ({
					hooks: { editRequest },
					closeEdit: () => {
						editRequest.set(null);
					},
					rename: async (id, title) => {
						await ctx.workspaces.rename(id, title);
					},
					removeWorkspace: (id) => ctx.workspaces.delete(id),
					pick: () => ctx.uiWorkspace.pickDirectory()
				})
			}, EditOverlay));
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "addir-directories",
				order: 250,
				label: () => t("globalTitle"),
				locale: "addir",
				inject: () => ({
					workspaceSource: ctx.workspaces.list,
					openEdit: (key) => {
						const target = resolveWorkspace(key);
						if (target !== void 0) editRequest.set(target);
					}
				})
			}, AddirSettingsSection));
		}
		//#endregion
		exports.AddirSettingsSection = AddirSettingsSection;
		exports.WorkspaceAddirModal = WorkspaceAddirModal;
		exports.apply = apply;
		exports.fetchGlobalConfig = fetchGlobalConfig;
		exports.fetchWorkspaceDirectories = fetchWorkspaceDirectories;
		exports.inject = inject;
		exports.replaceWorkspaceDirectories = replaceWorkspaceDirectories;
		exports.saveGlobalConfig = saveGlobalConfig;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map