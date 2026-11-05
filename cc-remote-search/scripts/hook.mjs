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

function configuredBaseUrl() {
  if (process.env.ANTHROPIC_BASE_URL) return process.env.ANTHROPIC_BASE_URL;
  try {
    const settings = JSON.parse(readFileSync(join(homedir(), ".claude", "settings.json"), "utf8"));
    return settings?.env?.ANTHROPIC_BASE_URL || "";
  } catch {
    return "";
  }
}

async function main() {
const input = JSON.parse((await readStdin()) || "{}");
const event = input.hook_event_name || input.hookEventName || "";
const thirdParty = !isFirstPartyBaseUrl(configuredBaseUrl());

if (!thirdParty) {
  process.stdout.write("{}\n");
  process.exit(0);
}

if (event === "SessionStart") {
  process.stdout.write(
    `${JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "SessionStart",
        additionalContext:
          "当前 ANTHROPIC_BASE_URL 不是 Anthropic 官方接口，原生 WebSearch 和 WebFetch 不可用。公开网页搜索用 remote-search MCP 的 web_search，打开链接用 web_fetch。不要用 Bash 访问搜索引擎代替它们。",
      },
    })}\n`,
  );
  process.exit(0);
}

if (event === "PreToolUse" && (input.tool_name === "WebSearch" || input.tool_name === "WebFetch")) {
  const replacement = input.tool_name === "WebSearch" ? "web_search" : "web_fetch";
  process.stdout.write(
    `${JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: `原生 ${input.tool_name} 在第三方接口上不可用。改用 remote-search MCP 的 ${replacement}。`,
      },
    })}\n`,
  );
  process.exit(0);
}

process.stdout.write("{}\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
