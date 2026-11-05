import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { decide, isFirstParty, isFirstPartyBaseUrl, searchMode } from "../scripts/hook.mjs";
import {
  assertPublicHttpUrl,
  decodeBody,
  isPrivateIp,
  pageText,
  parseDdgHtml,
  parseRss,
  unwrapSearchUrl,
} from "../scripts/lib.mjs";

// "中文网页" in GBK.
const GBK = Buffer.from([0xd6, 0xd0, 0xce, 0xc4, 0xcd, 0xf8, 0xd2, 0xb3]);

test("bodies decode by BOM, header, meta, then a GB18030 guess", () => {
  assert.equal(decodeBody(GBK, "text/html; charset=GBK").text, "中文网页");
  const meta = Buffer.concat([Buffer.from('<html><head><meta charset="gb2312"></head><body>'), GBK]);
  assert.match(decodeBody(meta, "text/html").text, /中文网页/);
  const httpEquiv = Buffer.concat([
    Buffer.from('<meta http-equiv="Content-Type" content="text/html; charset=gbk"><p>'),
    GBK,
  ]);
  assert.match(decodeBody(httpEquiv, "text/html").text, /中文网页/);
  const guessed = decodeBody(GBK, "text/html");
  assert.equal(guessed.text, "中文网页");
  assert.match(guessed.charset, /gb18030/);
  assert.equal(decodeBody(Buffer.from("中文", "utf8"), "").charset, "utf-8");
  const bom = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from("中文", "utf8")]);
  assert.equal(decodeBody(bom, "text/html; charset=gbk").text, "中文");
});

test("utf-8 cut mid-character at the size cap is not mistaken for GBK", () => {
  const cut = Buffer.from("正文中文", "utf8").subarray(0, 10);
  assert.equal(decodeBody(cut, "text/html").charset, "utf-8");
});

test("unknown declared charsets fall back to utf-8 instead of throwing", () => {
  assert.match(decodeBody(Buffer.from("abc"), "text/html; charset=x-made-up").charset, /不支持声明的 x-made-up/);
});

test("pages slice with a next start and never split a surrogate pair", () => {
  const first = pageText("abcdefghij", 0, 4);
  assert.deepEqual([first.text, first.nextStart, first.total], ["abcd", 4, 10]);
  const last = pageText("abcdefghij", 8, 4);
  assert.deepEqual([last.text, last.nextStart], ["ij", null]);
  assert.equal(pageText("abc", 99, 4).text, "");
  const emoji = pageText("ab😀cd", 0, 3);
  assert.equal(emoji.text, "ab");
  assert.equal(pageText("ab😀cd", emoji.nextStart, 3).text, "😀c");
});

test("search mode: auto tries native tools, on denies them, off stays silent", () => {
  const gateway = { ANTHROPIC_BASE_URL: "http://gw.example.test/coding-plan" };
  const preTool = { hook_event_name: "PreToolUse", tool_name: "WebSearch" };
  const start = { hook_event_name: "SessionStart" };
  assert.equal(searchMode("ON"), "on");
  assert.equal(searchMode("bogus"), "auto");

  assert.deepEqual(decide(preTool, gateway), {});
  assert.match(decide(start, gateway).hookSpecificOutput.additionalContext, /先用原生工具/);

  const on = { ...gateway, CC_REMOTE_SEARCH: "on" };
  assert.equal(decide(preTool, on).hookSpecificOutput.permissionDecision, "deny");
  assert.match(decide(start, on).hookSpecificOutput.additionalContext, /已停用/);
  assert.equal(decide(preTool, { CC_REMOTE_SEARCH: "on" }).hookSpecificOutput.permissionDecision, "deny");

  assert.deepEqual(decide(start, { ...gateway, CC_REMOTE_SEARCH: "off" }), {});
  assert.deepEqual(decide(start, {}), {});
  assert.deepEqual(decide({ hook_event_name: "PreToolUse", tool_name: "Bash" }, on), {});
});

test("bedrock, vertex and foundry count as third party even without a base url", () => {
  assert.equal(isFirstParty({}), true);
  assert.equal(isFirstParty({ CLAUDE_CODE_USE_BEDROCK: "1" }), false);
  assert.equal(isFirstParty({ CLAUDE_CODE_USE_VERTEX: "true" }), false);
  assert.equal(isFirstParty({ CLAUDE_CODE_USE_FOUNDRY: "1" }), false);
  assert.equal(isFirstParty({ CLAUDE_CODE_USE_BEDROCK: "0" }), true);
  assert.match(
    decide({ hook_event_name: "SessionStart" }, { CLAUDE_CODE_USE_BEDROCK: "1" }).hookSpecificOutput.additionalContext,
    /remote-search/,
  );
});

test("hook process tolerates a BOM and a malformed payload", async () => {
  const run = (stdin, env) =>
    new Promise((resolve) => {
      const child = spawn(process.execPath, ["scripts/hook.mjs"], {
        cwd: fileURLToPath(new URL("..", import.meta.url)),
        env: { ...process.env, ...env },
      });
      let out = "";
      child.stdout.on("data", (chunk) => (out += chunk));
      child.on("exit", (code) => resolve({ code, out }));
      child.stdin.end(stdin);
    });
  const denied = await run('﻿{"hook_event_name":"PreToolUse","tool_name":"WebFetch"}', { CC_REMOTE_SEARCH: "on" });
  assert.equal(denied.code, 0);
  assert.equal(JSON.parse(denied.out).hookSpecificOutput.permissionDecision, "deny");
  const broken = await run("not json", { CC_REMOTE_SEARCH: "on" });
  assert.deepEqual([broken.code, JSON.parse(broken.out)], [0, {}]);
});

test("private addresses are rejected", () => {
  assert.equal(isPrivateIp("8.8.8.8"), false);
  assert.equal(isPrivateIp("127.0.0.1"), true);
  assert.equal(isPrivateIp("10.1.2.3"), true);
  assert.equal(isPrivateIp("192.168.1.1"), true);
  assert.equal(isPrivateIp("169.254.169.254"), true);
  assert.equal(isPrivateIp("::1"), true);
  assert.equal(isPrivateIp("::ffff:127.0.0.1"), true);
});

test("ipv6 forms that embed a private ipv4 are rejected", () => {
  // URL normalizes [::ffff:127.0.0.1] to this hex form.
  assert.equal(isPrivateIp("[::ffff:7f00:1]"), true);
  assert.equal(isPrivateIp("::ffff:a9fe:a9fe"), true);
  assert.equal(isPrivateIp("::7f00:1"), true);
  assert.equal(isPrivateIp("0:0:0:0:0:ffff:c0a8:0101"), true);
  assert.equal(isPrivateIp("64:ff9b::a00:1"), true);
  assert.equal(isPrivateIp("2002:7f00:1::"), true);
  assert.equal(isPrivateIp("fe80::1%12"), true);
  assert.equal(isPrivateIp("fd12:3456::1"), true);
  assert.equal(isPrivateIp("ff02::1"), true);
  assert.equal(isPrivateIp("not:an:ip::zz"), true);
  assert.equal(isPrivateIp("::ffff:8.8.8.8"), false);
  assert.equal(isPrivateIp("2606:4700:4700::1111"), false);
  assert.equal(isPrivateIp("198.18.0.1"), false);
});

test("hex-mapped loopback urls are refused before fetching", async () => {
  for (const url of ["http://[::ffff:127.0.0.1]/", "http://[::ffff:a9fe:a9fe]/latest/meta-data", "http://[::127.0.0.1]/"]) {
    await assert.rejects(assertPublicHttpUrl(url), /拒绝访问本机或内网地址/);
  }
});

test("official Anthropic hosts stay on native web tools", () => {
  assert.equal(isFirstPartyBaseUrl(""), true);
  assert.equal(isFirstPartyBaseUrl("https://api.anthropic.com"), true);
  assert.equal(isFirstPartyBaseUrl("http://ada.example.test/coding-plan"), false);
  assert.equal(isFirstPartyBaseUrl("not a url"), false);
});

test("rss and duckduckgo html parse into public links", () => {
  const rss = `<?xml version="1.0"?><rss><channel><item><title>Example</title><link>https://example.com/a</link><description>摘要</description></item></channel></rss>`;
  assert.deepEqual(parseRss(rss, 5), [{ title: "Example", url: "https://example.com/a", snippet: "摘要" }]);
  const html = `<a class="result__a" href="https://duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2Fb">标题</a><a class="result__snippet">片段</a>`;
  assert.equal(parseDdgHtml(html, 5)[0].url, "https://example.com/b");
  assert.equal(unwrapSearchUrl("https://www.bing.com/ck/a?u=a1aHR0cHM6Ly9leGFtcGxlLmNvbS9j"), "https://example.com/c");
});

// MCP stdio transport: newline-delimited JSON, the framing Claude Code sends and expects back.
function frame(message) {
  return `${JSON.stringify(message)}\n`;
}

test("mcp server speaks newline-delimited json and lists both tools", async () => {
  const child = spawn(process.execPath, ["scripts/server.mjs"], {
    cwd: fileURLToPath(new URL("..", import.meta.url)),
    stdio: ["pipe", "pipe", "pipe"],
  });
  let output = Buffer.alloc(0);
  child.stdout.on("data", (chunk) => {
    output = Buffer.concat([output, chunk]);
  });
  child.stdin.write(
    frame({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "test", version: "0" } },
    }),
  );
  child.stdin.write(frame({ jsonrpc: "2.0", method: "notifications/initialized" }));
  child.stdin.write(frame({ jsonrpc: "2.0", id: 2, method: "tools/list" }));
  child.stdin.end();
  await once(child, "exit");
  const raw = output.toString("utf8");
  assert.doesNotMatch(raw, /Content-Length/i);
  const replies = raw.split("\n").filter(Boolean).map((line) => JSON.parse(line));
  assert.deepEqual(replies.map((reply) => reply.id), [1, 2]);
  assert.equal(replies[0].result.serverInfo.name, "cc-remote-search");
  assert.deepEqual(replies[1].result.tools.map((tool) => tool.name), ["web_search", "web_fetch"]);
});
