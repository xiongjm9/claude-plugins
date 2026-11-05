import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { isFirstPartyBaseUrl } from "../scripts/hook.mjs";
import { isPrivateIp, parseDdgHtml, parseRss, unwrapSearchUrl } from "../scripts/lib.mjs";

test("private addresses are rejected", () => {
  assert.equal(isPrivateIp("8.8.8.8"), false);
  assert.equal(isPrivateIp("127.0.0.1"), true);
  assert.equal(isPrivateIp("10.1.2.3"), true);
  assert.equal(isPrivateIp("192.168.1.1"), true);
  assert.equal(isPrivateIp("169.254.169.254"), true);
  assert.equal(isPrivateIp("::1"), true);
  assert.equal(isPrivateIp("::ffff:127.0.0.1"), true);
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

function frame(message) {
  const body = Buffer.from(JSON.stringify(message));
  return Buffer.concat([Buffer.from(`Content-Length: ${body.length}\r\n\r\n`), body]);
}

test("mcp server lists both tools", async () => {
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
  assert.match(raw, /"name":"web_search"/);
  assert.match(raw, /"name":"web_fetch"/);
});
