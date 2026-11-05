import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

process.env.NODE_USE_ENV_PROXY ||= "1";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

const BLOCKED_NAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata.google.internal",
  "metadata.internal",
]);

export function isPrivateIp(ip) {
  const raw = String(ip).toLowerCase().replace(/^\[|\]$/g, "");
  const mapped = raw.startsWith("::ffff:") ? raw.slice(7) : raw;
  if (mapped.includes(":")) {
    if (mapped === "::1" || mapped === "::") return true;
    if (mapped.startsWith("fe80:")) return true;
    if (mapped.startsWith("fc") || mapped.startsWith("fd")) return true;
    return false;
  }
  const parts = mapped.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return true;
  }
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

export async function assertPublicHttpUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("URL 无法解析");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("只允许 http 或 https");
  }
  if (url.username || url.password) throw new Error("URL 不能带账号");
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!host || BLOCKED_NAMES.has(host) || host.endsWith(".local") || host.endsWith(".internal") || host.endsWith(".localhost")) {
    throw new Error("拒绝访问本机或内网地址");
  }
  const addresses = isIP(host) ? [host] : (await lookup(host, { all: true, verbatim: true })).map((item) => item.address);
  if (addresses.length === 0 || addresses.some((address) => isPrivateIp(address))) {
    throw new Error("拒绝访问本机或内网地址");
  }
  return url;
}

function decodeEntities(text) {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/\s+/g, " ")
    .trim();
}

export function unwrapSearchUrl(raw) {
  try {
    const url = new URL(raw, "https://www.bing.com");
    const uddg = url.searchParams.get("uddg");
    if (uddg && /^https?:\/\//i.test(uddg)) return uddg;
    const packed = url.searchParams.get("u");
    if (packed && /^https?:\/\//i.test(packed)) return packed;
    if (packed && packed.startsWith("a1")) {
      const decoded = Buffer.from(packed.slice(2).replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
      if (/^https?:\/\//i.test(decoded)) return decoded;
    }
    return url.href;
  } catch {
    return raw;
  }
}

export function parseRss(xml, maxResults) {
  const results = [];
  const itemRe = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRe.exec(xml)) && results.length < maxResults) {
    const block = match[1];
    const title = decodeEntities((block.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || "");
    const link = decodeEntities((block.match(/<link\b[^>]*>([\s\S]*?)<\/link>/i) || [])[1] || "");
    const snippet = decodeEntities((block.match(/<description\b[^>]*>([\s\S]*?)<\/description>/i) || [])[1] || "");
    if (!title || !/^https?:\/\//i.test(link)) continue;
    results.push({ title, url: link, snippet });
  }
  return results;
}

export function parseDdgHtml(html, maxResults) {
  const results = [];
  const re = /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = re.exec(html)) && results.length < maxResults) {
    const url = unwrapSearchUrl(decodeEntities(match[1]));
    const title = decodeEntities(match[2]);
    if (!title || !/^https?:\/\//i.test(url)) continue;
    const after = html.slice(match.index, match.index + 800);
    const snippet = decodeEntities((after.match(/class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/(?:a|td|div)>/i) || [])[1] || "");
    results.push({ title, url, snippet });
  }
  return results;
}

async function fetchText(url, timeoutMs) {
  const response = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      "user-agent": UA,
      "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

async function searchBing(query, maxResults) {
  const url = `https://www.bing.com/search?format=rss&q=${encodeURIComponent(query)}`;
  const xml = await fetchText(url, 12000);
  return parseRss(xml, maxResults);
}

async function searchDdg(query, maxResults) {
  const body = new URLSearchParams({ q: query, kl: "cn-zh" });
  const response = await fetch("https://html.duckduckgo.com/html/", {
    method: "POST",
    redirect: "follow",
    signal: AbortSignal.timeout(12000),
    headers: {
      "user-agent": UA,
      "content-type": "application/x-www-form-urlencoded",
      accept: "text/html",
    },
    body,
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return parseDdgHtml(await response.text(), maxResults);
}

export async function webSearch(query, maxResults = 5) {
  const q = String(query ?? "").trim();
  if (!q) throw new Error("query 不能为空");
  const limit = Math.min(8, Math.max(1, Number(maxResults) || 5));
  const errors = [];
  for (const provider of [
    ["bing", searchBing],
    ["duckduckgo", searchDdg],
  ]) {
    try {
      const results = await provider[1](q, limit);
      if (results.length > 0) return { provider: provider[0], results };
      errors.push(`${provider[0]}: 空结果`);
    } catch (error) {
      errors.push(`${provider[0]}: ${error.message}`);
    }
  }
  throw new Error(`搜索失败。${errors.join("；")}`);
}

function htmlToText(html) {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
      .replace(/<\/(p|div|h[1-6]|li|tr|br|section|article)>/gi, "\n"),
  );
}

export async function webFetch(rawUrl, maxChars = 12000) {
  const limit = Math.min(50000, Math.max(500, Number(maxChars) || 12000));
  let current = await assertPublicHttpUrl(rawUrl);
  let response;
  for (let hop = 0; hop < 4; hop += 1) {
    response = await fetch(current, {
      redirect: "manual",
      signal: AbortSignal.timeout(15000),
      headers: { "user-agent": UA, accept: "text/html,application/xhtml+xml,text/plain,application/json;q=0.9,*/*;q=0.8" },
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error(`重定向缺少 Location（HTTP ${response.status}）`);
      current = await assertPublicHttpUrl(new URL(location, current).href);
      continue;
    }
    break;
  }
  if (!response || !response.ok) throw new Error(`HTTP ${response ? response.status : "无响应"}`);
  const type = (response.headers.get("content-type") || "").toLowerCase();
  if (type && !/text\/|application\/(json|xml|xhtml|javascript)|application\/octet-stream/.test(type)) {
    throw new Error(`不抓取该内容类型：${type.split(";")[0]}`);
  }
  const bytes = Buffer.from(await response.arrayBuffer()).subarray(0, 500_000);
  const text = /html|xml/.test(type) || /<html[\s>]/i.test(bytes.slice(0, 400).toString("utf8"))
    ? htmlToText(bytes.toString("utf8"))
    : bytes.toString("utf8");
  const clipped = text.slice(0, limit);
  return {
    url: current.href,
    contentType: type.split(";")[0] || "unknown",
    truncated: text.length > clipped.length,
    text: clipped,
  };
}
