import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

function readStdin() {
  return new Promise((resolve) => {
    const chunks = [];
    process.stdin.on("data", (chunk) => chunks.push(chunk));
    process.stdin.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
}

export function isFirstPartyBaseUrl(value) {
  if (!value || !String(value).trim()) return true;
  try {
    const host = new URL(value).hostname.toLowerCase();
    return host === "api.anthropic.com" || host.endsWith(".anthropic.com");
  } catch {
    return false;
  }
}

/** CC_REMOTE_SEARCH: off = never touch native tools, on = always deny them, auto (default) = native first. */
export function searchMode(value) {
  const mode = String(value ?? "").trim().toLowerCase();
  return mode === "on" || mode === "off" ? mode : "auto";
}

function truthy(value) {
  return value !== undefined && value !== "" && value !== "0" && String(value).toLowerCase() !== "false";
}

/** Direct Anthropic API. Bedrock, Vertex, Foundry and custom base URLs are not. */
export function isFirstParty(env) {
  if (["CLAUDE_CODE_USE_BEDROCK", "CLAUDE_CODE_USE_VERTEX", "CLAUDE_CODE_USE_FOUNDRY"].some((key) => truthy(env[key]))) {
    return false;
  }
  return isFirstPartyBaseUrl(env.ANTHROPIC_BASE_URL);
}

const FALLBACK_CONTEXT =
  "当前会话不是直连 Anthropic 官方接口，原生 WebSearch / WebFetch 能否用取决于网关。先用原生工具；工具不存在、报错或返回空结果时，改用 remote-search MCP 的 web_search 和 web_fetch。web_fetch 能识别 GBK 等中文编码，长页面按结尾提示的 start_index 继续读。不要用 Bash 访问搜索引擎代替它们。";

const FORCED_CONTEXT =
  "CC_REMOTE_SEARCH=on：原生 WebSearch 和 WebFetch 已停用。公开网页搜索用 remote-search MCP 的 web_search，打开链接用 web_fetch；web_fetch 长页面按结尾提示的 start_index 继续读。不要用 Bash 访问搜索引擎代替它们。";

/** Hook output for one event; {} means "no opinion". */
export function decide(input, env) {
  const mode = searchMode(env.CC_REMOTE_SEARCH);
  if (mode === "off") return {};
  if (mode === "auto" && isFirstParty(env)) return {};
  const event = input.hook_event_name || input.hookEventName || "";
  if (event === "SessionStart") {
    return {
      hookSpecificOutput: {
        hookEventName: "SessionStart",
        additionalContext: mode === "on" ? FORCED_CONTEXT : FALLBACK_CONTEXT,
      },
    };
  }
  if (mode === "on" && event === "PreToolUse" && (input.tool_name === "WebSearch" || input.tool_name === "WebFetch")) {
    const replacement = input.tool_name === "WebSearch" ? "web_search" : "web_fetch";
    return {
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: `CC_REMOTE_SEARCH=on，原生 ${input.tool_name} 已停用。改用 remote-search MCP 的 ${replacement}。`,
      },
    };
  }
  return {};
}

/** settings.json env, overridden by the real process env (which is what Claude Code applies). */
function effectiveEnv() {
  let fromSettings = {};
  try {
    const settings = JSON.parse(readFileSync(join(homedir(), ".claude", "settings.json"), "utf8").replace(/^﻿/, ""));
    if (settings?.env && typeof settings.env === "object") fromSettings = settings.env;
  } catch {
    /* no settings file: use process env only */
  }
  return { ...fromSettings, ...process.env };
}

async function main() {
  let input = {};
  try {
    input = JSON.parse((await readStdin()).replace(/^﻿/, "") || "{}");
  } catch {
    /* malformed payload: say nothing rather than block the session */
  }
  process.stdout.write(`${JSON.stringify(decide(input, effectiveEnv()))}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
