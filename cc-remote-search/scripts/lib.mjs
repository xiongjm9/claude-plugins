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

function isPrivateIpv4(parts) {
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a >= 224) return true; // multicast, reserved, broadcast
  // 198.18.0.0/15 stays allowed: fake-ip proxies resolve every public name there.
  return false;
}

function parseIpv4(text) {
  const parts = text.split(".").map((part) => (/^\d{1,3}$/.test(part) ? Number(part) : NaN));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part > 255)) return null;
  return parts;
}

/** Expand an IPv6 literal into eight 16-bit words, or null when it does not parse. */
function parseIpv6(text) {
  let body = text.replace(/%.*$/, "");
  let tail = [];
  const dotted = body.match(/^(.*:)(\d+\.\d+\.\d+\.\d+)$/);
  if (dotted) {
    const v4 = parseIpv4(dotted[2]);
    if (!v4) return null;
    tail = [(v4[0] << 8) | v4[1], (v4[2] << 8) | v4[3]];
    body = dotted[1].endsWith("::") ? dotted[1] : dotted[1].slice(0, -1);
  }
  const halves = body.split("::");
  if (halves.length > 2) return null;
  const toWords = (part) => (part === "" ? [] : part.split(":"));
  const head = toWords(halves[0]);
  const rest = halves.length === 2 ? toWords(halves[1]) : [];
  if ([...head, ...rest].some((word) => !/^[0-9a-f]{1,4}$/.test(word))) return null;
  const known = head.length + rest.length + tail.length;
  if (halves.length === 1 ? known !== 8 : known > 7) return null;
  const fill = new Array(8 - known).fill(0);
  return [...head.map((w) => parseInt(w, 16)), ...fill, ...rest.map((w) => parseInt(w, 16)), ...tail];
}

export function isPrivateIp(ip) {
  const raw = String(ip).toLowerCase().replace(/^\[|\]$/g, "");
  if (!raw.includes(":")) {
    const v4 = parseIpv4(raw);
    return v4 ? isPrivateIpv4(v4) : true;
  }
  const words = parseIpv6(raw);
  if (!words) return true;
  const embedded = (hi, lo) => [hi >> 8, hi & 0xff, lo >> 8, lo & 0xff];
  // ::/96 (unspecified, loopback, IPv4-compatible) and ::ffff:0:0/96 (IPv4-mapped): judge the IPv4 tail.
  if (words.slice(0, 5).every((w) => w === 0) && (words[5] === 0 || words[5] === 0xffff)) {
    if (words[5] === 0 && words[6] === 0) return true; // :: and ::1
    return isPrivateIpv4(embedded(words[6], words[7]));
  }
  // NAT64 64:ff9b::/96 carries an IPv4 address in the last 32 bits.
  if (words[0] === 0x64 && words[1] === 0xff9b && words.slice(2, 6).every((w) => w === 0)) {
    return isPrivateIpv4(embedded(words[6], words[7]));
  }
  // 6to4 2002::/16 carries an IPv4 address in bits 16-47.
  if (words[0] === 0x2002) return isPrivateIpv4(embedded(words[1], words[2]));
  const first = words[0];
  if ((first & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
  if ((first & 0xffc0) === 0xfe80) return true; // fe80::/10 link local
  if ((first & 0xffc0) === 0xfec0) return true; // fec0::/10 site local (deprecated)
  if ((first & 0xff00) === 0xff00) return true; // multicast
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
