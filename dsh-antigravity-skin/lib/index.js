/**
 * DeepSeek Harness 宿主侧：注入首屏 CSS，提供本地配置与壁纸接口。
 * 配置只写在 ~/.dsh/antigravity-skin.json，壁纸写在 ~/.dsh/antigravity-skin-wall.*。
 */

import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync, appendFileSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import { injectCriticalHtml, normalizeBoot, DEFAULT_BOOT } from "./theme.js";

export const name = "dsh-antigravity-skin";
export const inject = ["webServer"];

const STATE_FILENAME = "antigravity-skin.json";
const API_PREFIX = "/antigravity-skin/api";
const WALL_PREFIX = "/antigravity-skin/wall";
const MAX_BODY_BYTES = 64 * 1024;
const MAX_WALL_BYTES = 5 * 1024 * 1024;
const WALL_TYPES = { "image/webp": ".webp", "image/jpeg": ".jpg", "image/png": ".png", "image/gif": ".gif" };
const OWN_KEYS = ["theme", "studio", "savedAt", "wallImage"];
const STUDIO_KEYS = Object.keys(DEFAULT_BOOT.studio);

function statePath() {
	const home = process.env.DSH_HOME || join(homedir(), ".dsh");
	return join(home, STATE_FILENAME);
}


function wallDir() {
	return process.env.DSH_HOME || join(homedir(), ".dsh");
}

function localWallCandidates() {
	return [".webp", ".jpg", ".png", ".gif"].map((ext) => join(wallDir(), `antigravity-skin-wall${ext}`));
}


function resolveWallFile() {
	for (const file of localWallCandidates()) {
		if (existsSync(file)) return file;
	}
	return null;
}

function mimeForWall(file) {
	if (file.endsWith(".webp")) return "image/webp";
	if (file.endsWith(".jpg")) return "image/jpeg";
	if (file.endsWith(".png")) return "image/png";
	if (file.endsWith(".gif")) return "image/gif";
	return "application/octet-stream";
}

function handleWallGet(res) {
	const file = resolveWallFile();
	if (!file) {
		res.statusCode = 404;
		res.end();
		return;
	}
	const data = readFileSync(file);
	res.statusCode = 200;
	res.setHeader("content-type", mimeForWall(file));
	res.setHeader("cache-control", "private, max-age=0, must-revalidate");
	res.end(data);
}

async function handleWallPost(req, res) {
	const payload = await readBody(req, MAX_WALL_BYTES);
	const type = payload && payload.type;
	const ext = WALL_TYPES[type];
	const raw = payload && payload.data;
	if (!ext || typeof raw !== "string") {
		writeJson(res, 400, { ok: false, error: { code: "bad-type", message: "unsupported image" } });
		return;
	}
	let buffer;
	try {
		buffer = Buffer.from(raw, "base64");
	} catch {
		writeJson(res, 400, { ok: false, error: { code: "bad-data", message: "invalid image data" } });
		return;
	}
	if (buffer.length === 0 || buffer.length > MAX_WALL_BYTES) {
		writeJson(res, 413, { ok: false, error: { code: "payload-too-large", message: "image too large" } });
		return;
	}
	mkdirSync(wallDir(), { recursive: true });
	for (const leftover of localWallCandidates()) {
		try { if (existsSync(leftover)) unlinkSync(leftover); } catch {}
	}
	const dest = join(wallDir(), `antigravity-skin-wall${ext}`);
	writeFileSync(dest, buffer);
	const current = readMergedBoot();

	const boot = writeBoot({ ...current, studio: { ...current.studio, wall: "image" } });
	writeJson(res, 200, { ok: true, boot });
}

function trustedHostsOf(ctx) {
	const startup = ctx.webStartup;
	if (startup !== undefined && startup !== null && Array.isArray(startup.trustedHosts)) {
		return startup.trustedHosts;
	}
	const runtime = ctx.webRuntime;
	if (runtime !== undefined && runtime !== null && Array.isArray(runtime.trustedHosts)) {
		return runtime.trustedHosts;
	}
	return [];
}

function parseAuthority(host) {
	try {
		return new URL(`http://${host}`);
	} catch {
		return undefined;
	}
}

function isLoopbackHostname(hostname) {
	if (hostname === "localhost" || hostname === "[::1]" || hostname === "::1") return true;
	const parts = hostname.split(".");
	return parts.length === 4
		&& parts[0] === "127"
		&& parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255);
}

function isTrustedAuthority(hostUrl, trustedHosts) {
	return trustedHosts.some((entry) => {
		if (typeof entry !== "string" || entry === "") return false;
		const entryUrl = parseAuthority(entry);
		if (entryUrl === undefined) return false;
		if (entryUrl.hostname !== hostUrl.hostname) return false;
		if (entryUrl.port === "") return true;
		return entryUrl.port === hostUrl.port;
	});
}

function isTrustedApiRequest(req, trustedHosts) {
	const host = typeof req.headers.host === "string" ? req.headers.host : undefined;
	if (host === undefined) return false;
	const hostUrl = parseAuthority(host);
	if (hostUrl === undefined) return false;
	if (!isLoopbackHostname(hostUrl.hostname) && !isTrustedAuthority(hostUrl, trustedHosts)) return false;
	if (req.headers["sec-fetch-site"] === "cross-site") return false;
	const origin = req.headers.origin;
	if (origin === undefined || origin === "null") return isLoopbackHostname(hostUrl.hostname);
	try {
		const originUrl = new URL(origin);
		if (originUrl.host === hostUrl.host) return true;
		return isLoopbackHostname(hostUrl.hostname) && isLoopbackHostname(originUrl.hostname);
	} catch {
		return isLoopbackHostname(hostUrl.hostname);
	}
}

function writeJson(res, status, body) {
	const payload = JSON.stringify(body);
	res.statusCode = status;
	res.setHeader("content-type", "application/json; charset=utf-8");
	res.setHeader("cache-control", "no-store");
	res.end(payload);
}

function readJsonFile(file) {
	try {
		const parsed = JSON.parse(readFileSync(file, "utf8"));
		if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
	} catch {
		// missing or unreadable
	}
	return null;
}

function stamp(raw) {
	return Date.parse((raw && raw.savedAt) || "") || 0;
}

function unknownKeys(raw, known) {
	const out = {};
	if (!raw || typeof raw !== "object") return out;
	for (const [key, value] of Object.entries(raw)) {
		if (known.includes(key)) continue;
		if (key === "wallImage") continue;
		out[key] = value;
	}
	return out;
}

function toBoot(raw) {
	const normalized = normalizeBoot(raw || {});
	const boot = {
		...unknownKeys(raw, OWN_KEYS),
		theme: normalized.theme,
		studio: {
			...unknownKeys(raw && raw.studio, STUDIO_KEYS),
			...normalized.studio,
		},
	};
	if (normalized.savedAt) boot.savedAt = normalized.savedAt;
	return boot;
}

export function readMergedBoot() {
	const localRaw = readJsonFile(statePath());
	if (localRaw) return toBoot(localRaw);
	return toBoot(DEFAULT_BOOT);
}

function writeAtomic(file, data) {
	mkdirSync(dirname(file), { recursive: true });
	const tmp = `${file}.${process.pid}.tmp`;
	writeFileSync(tmp, `${JSON.stringify(data, null, 2)}\n`, "utf8");
	renameSync(tmp, file);
}

export function writeBoot(input) {
	const incoming = toBoot(input);
	const savedAt = new Date().toISOString();
	const localPrev = readJsonFile(statePath());
	const local = {
		...unknownKeys(localPrev, OWN_KEYS),
		theme: incoming.theme,
		studio: {
			...unknownKeys(localPrev && localPrev.studio, STUDIO_KEYS),
			...incoming.studio,
		},
		savedAt,
	};
	writeAtomic(statePath(), local);
	return local;
}

function readBody(req, maxBytes = MAX_BODY_BYTES) {
	return new Promise((resolve, reject) => {
		const chunks = [];
		let size = 0;
		req.on("data", (chunk) => {
			size += chunk.length;
			if (size > maxBytes) {
				reject(Object.assign(new Error("payload too large"), { code: "payload-too-large" }));
				req.destroy();
				return;
			}
			chunks.push(chunk);
		});
		req.on("end", () => {
			const raw = Buffer.concat(chunks).toString("utf8");
			if (raw.trim() === "") {
				resolve({});
				return;
			}
			try {
				resolve(JSON.parse(raw));
			} catch (error) {
				reject(error);
			}
		});
		req.on("error", reject);
	});
}

async function handleApi(req, res) {
	if (req.method !== "POST") {
		writeJson(res, 405, { ok: false, error: { code: "method-not-allowed", message: "POST only" } });
		return;
	}
	let payload;
	try {
		payload = await readBody(req);
	} catch (error) {
		if (error && error.code === "payload-too-large") {
			writeJson(res, 413, { ok: false, error: { code: "payload-too-large", message: "payload too large" } });
			return;
		}
		writeJson(res, 400, { ok: false, error: { code: "bad-json", message: "invalid json" } });
		return;
	}
	const method = payload && payload.method;
	if (method === "get") {
		writeJson(res, 200, { ok: true, boot: readMergedBoot() });
		return;
	}
	if (method === "set") {
		const source = payload.boot || payload.state || payload;
		const boot = writeBoot(source);
		writeJson(res, 200, { ok: true, boot });
		return;
	}
	if (method === "log") {
		try {
			const home = process.env.DSH_HOME || join(homedir(), ".dsh");
			const file = join(home, "antigravity-skin-error.log");
			const message = String((payload && payload.message) || "");
			const stack = String((payload && payload.stack) || "");
			appendFileSync(file, `${new Date().toISOString()} ${message}\n${stack}\n`, "utf8");
		} catch (error) {
			console.error("[dsh-antigravity-skin] failed to write error log:", error);
		}
		writeJson(res, 200, { ok: true });
		return;
	}
	writeJson(res, 404, { ok: false, error: { code: "not-found", message: `unknown method "${method}"` } });
}

function seedLocalState() {
	try {
		if (existsSync(statePath())) return;
		const savedAt = new Date().toISOString();
		writeAtomic(statePath(), { ...toBoot(DEFAULT_BOOT), savedAt });
	} catch (error) {
		console.error("[dsh-antigravity-skin] failed to seed local state:", error);
	}
}

export function apply(ctx) {
	seedLocalState();
	ctx.effect(() => ctx.webServer.register({
		kind: "prefix",
		path: API_PREFIX,
		handler: async (req, res) => {
			if (!isTrustedApiRequest(req, trustedHostsOf(ctx))) {
				writeJson(res, 403, { ok: false, error: { code: "forbidden", message: "forbidden" } });
				return;
			}
			try {
				await handleApi(req, res);
			} catch (error) {
				console.error("[dsh-antigravity-skin] persistence API error:", error);
				writeJson(res, 500, { ok: false, error: { code: "internal", message: "internal error" } });
			}
		},
	}), "dsh-antigravity-skin: persistence API");

	ctx.effect(() => ctx.webServer.register({
		kind: "prefix",
		path: WALL_PREFIX,
		handler: async (req, res) => {
			if (!isTrustedApiRequest(req, trustedHostsOf(ctx))) {
				writeJson(res, 403, { ok: false, error: { code: "forbidden", message: "forbidden" } });
				return;
			}
			try {
				if (req.method === "GET") {
					handleWallGet(res);
					return;
				}
				if (req.method === "POST") {
					await handleWallPost(req, res);
					return;
				}
				writeJson(res, 405, { ok: false, error: { code: "method-not-allowed", message: "GET or POST" } });
			} catch (error) {
				console.error("[dsh-antigravity-skin] wall API error:", error);
				writeJson(res, 500, { ok: false, error: { code: "internal", message: "internal error" } });
			}
		},
	}), "dsh-antigravity-skin: wallpaper");

	if (ctx.webServer && typeof ctx.webServer.tapIndex === "function") {
		ctx.effect(() => ctx.webServer.tapIndex((html) => {
			try {
				return injectCriticalHtml(html, readMergedBoot());
			} catch (error) {
				console.error("[dsh-antigravity-skin] tapIndex failed:", error);
				return html;
			}
		}), "dsh-antigravity-skin: first-paint");
	}
}
