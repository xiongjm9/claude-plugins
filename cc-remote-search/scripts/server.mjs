import { webFetch, webSearch } from "./lib.mjs";

const tools = [
  {
    name: "web_search",
    description:
      "搜索公开网页，返回标题、链接和摘要。原生 WebSearch 不存在、报错或返回空结果时用它。",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "搜索词" },
        max_results: { type: "integer", minimum: 1, maximum: 8, description: "结果条数，默认 5" },
      },
      required: ["query"],
      additionalProperties: false,
    },
  },
  {
    name: "web_fetch",
    description:
      "抓取一个公开 http(s) 页面并返回纯文本，自动识别 GBK 等编码。长页面分段返回，结尾会给出下一段的 start_index。原生 WebFetch 不可用时用它。拒绝本机、内网和云 metadata 地址。",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "要读取的 http 或 https 地址" },
        max_chars: { type: "integer", minimum: 500, maximum: 50000, description: "本段最多返回的字符数，默认 12000" },
        start_index: {
          type: "integer",
          minimum: 0,
          description: "从正文第几个字符开始读，默认 0。读下一段时填上次结尾给出的值",
        },
      },
      required: ["url"],
      additionalProperties: false,
    },
  },
];

// MCP stdio transport: one JSON-RPC message per line, no Content-Length headers.
function send(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

function result(id, payload) {
  send({ jsonrpc: "2.0", id, result: payload });
}

function failure(id, message) {
  send({
    jsonrpc: "2.0",
    id,
    error: { code: -32000, message },
  });
}

async function callTool(name, args) {
  if (name === "web_search") {
    const found = await webSearch(args.query, args.max_results);
    const text = found.results
      .map((item, index) => `${index + 1}. ${item.title}\n${item.url}\n${item.snippet || ""}`.trim())
      .join("\n\n");
    return { content: [{ type: "text", text: `来源：${found.provider}\n\n${text}` }] };
  }
  if (name === "web_fetch") {
    const page = await webFetch(args.url, args.max_chars, args.start_index);
    const header = [
      page.url,
      `${page.contentType}; ${page.charset}`,
      `第 ${page.start}–${page.end} 字符，共 ${page.total} 字符`,
    ];
    if (page.bodyCapped) header.push("原始页面超过 2MB，只读取了前 2MB");
    const tail =
      page.nextStart === null
        ? "\n\n[已到结尾]"
        : `\n\n[未完，后面还有 ${page.total - page.end} 字符。继续读用 start_index=${page.nextStart}]`;
    const body = page.text.length > 0 ? page.text : `（start_index=${page.start} 已超过正文长度）`;
    return { content: [{ type: "text", text: `${header.join("\n")}\n\n${body}${tail}` }] };
  }
  throw new Error(`未知工具 ${name}`);
}

async function handle(message) {
  const { id, method, params } = message;
  if (method === "notifications/initialized" || method === "notifications/cancelled") return;
  if (id === undefined) return;
  if (method === "initialize") {
    result(id, {
      protocolVersion: params?.protocolVersion || "2024-11-05",
      capabilities: { tools: {} },
      serverInfo: { name: "cc-remote-search", version: "1.1.0" },
    });
    return;
  }
  if (method === "ping") {
    result(id, {});
    return;
  }
  if (method === "tools/list") {
    result(id, { tools });
    return;
  }
  if (method === "tools/call") {
    try {
      result(id, await callTool(params?.name, params?.arguments || {}));
    } catch (error) {
      result(id, { content: [{ type: "text", text: error.message }], isError: true });
    }
    return;
  }
  failure(id, `未实现的方法 ${method}`);
}

let buffer = Buffer.alloc(0);
process.stdin.on("data", (chunk) => {
  buffer = Buffer.concat([buffer, chunk]);
  for (;;) {
    const lineEnd = buffer.indexOf("\n");
    if (lineEnd === -1) return;
    const line = buffer.subarray(0, lineEnd).toString("utf8").trim();
    buffer = buffer.subarray(lineEnd + 1);
    if (!line) continue;
    let message;
    try {
      message = JSON.parse(line);
    } catch {
      send({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } });
      continue;
    }
    handle(message).catch((error) => process.stderr.write(`${error.message}\n`));
  }
});
