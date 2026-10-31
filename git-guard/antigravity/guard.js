// git-guard PreToolUse hook for Antigravity run_command.
// Destructive git commands get "force_ask" (always prompts, ignores cached grants).
// Everything else gets SAFE, which matches CASCADE_COMMANDS_AUTO_EXECUTION_EAGER; any internal error also returns SAFE.
"use strict";
const fs = require("fs");
const path = require("path");

const SAFE = { decision: "allow" };
const LOG = process.env.GIT_GUARD_LOG || path.join(process.env.APPDATA || __dirname, "git-guard", "antigravity.log");

function splitSegments(s) {
  const out = [];
  let cur = "";
  let q = null;
  for (const ch of s) {
    if (q) {
      cur += ch;
      if (ch === q) q = null;
    } else if (ch === '"' || ch === "'") {
      q = ch;
      cur += ch;
    } else if (ch === ";" || ch === "|" || ch === "&" || ch === "\n" || ch === "\r") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((x) => x.trim()).filter(Boolean);
}

function tokenize(s) {
  const out = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let m;
  while ((m = re.exec(s))) {
    out.push(m[1] !== undefined ? m[1] : m[2] !== undefined ? m[2] : m[3]);
  }
  return out;
}

const GIT_BIN = /(^|[\\\/])git(\.exe)?$/i;
const VALUE_FLAGS = new Set(["-C", "-c", "--git-dir", "--work-tree", "--namespace", "--exec-path", "--config-env"]);

function parseGit(tokens, i) {
  let j = i + 1;
  while (j < tokens.length && tokens[j].startsWith("-")) {
    if (VALUE_FLAGS.has(tokens[j])) j += 2;
    else j += 1;
  }
  if (j >= tokens.length) return null;
  return { sub: tokens[j].toLowerCase(), args: tokens.slice(j + 1) };
}

const hasLong = (args, names) => args.some((a) => names.some((n) => a === n || a.startsWith(n + "=")));
const hasShort = (args, letters) =>
  args.some((a) => /^-[A-Za-z]+$/.test(a) && [...a.slice(1)].some((c) => letters.includes(c)));

function danger(sub, args) {
  const pos = args.filter((a) => !a.startsWith("-"));
  switch (sub) {
    case "push":
      if (hasLong(args, ["--force", "--force-with-lease", "--force-if-includes", "--delete", "--mirror", "--prune", "--no-verify"])) return "git push 强推/删除/跳过钩子";
      if (hasShort(args, ["f", "d"])) return "git push 强推或删除分支";
      if (pos.some((a) => a.startsWith("+") || a.startsWith(":"))) return "git push 强制或删除 refspec";
      return null;
    case "reset":
      return hasLong(args, ["--hard", "--merge"]) ? "git reset --hard 会丢弃未提交改动" : null;
    case "clean":
      if (hasLong(args, ["--dry-run"]) || hasShort(args, ["n"])) return null;
      return hasLong(args, ["--force"]) || hasShort(args, ["f"]) ? "git clean 会删除未跟踪文件" : null;
    case "checkout":
      if (hasLong(args, ["--force"]) || hasShort(args, ["f", "B"])) return "git checkout 强制覆盖本地改动";
      if (args.includes("--") || args.includes(".")) return "git checkout <文件> 会覆盖工作区改动";
      if (pos.some((a) => /\.[A-Za-z0-9]{1,8}$/.test(a) || /^\.{0,2}[\\\/]/.test(a))) return "git checkout <文件> 会覆盖工作区改动";
      return null;
    case "restore": {
      const staged = hasLong(args, ["--staged"]) || hasShort(args, ["S"]);
      const worktree = hasLong(args, ["--worktree"]) || hasShort(args, ["W"]);
      return !staged || worktree ? "git restore 会覆盖工作区改动" : null;
    }
    case "switch":
      return hasLong(args, ["--force", "--discard-changes"]) || hasShort(args, ["f", "C"]) ? "git switch 强制丢弃改动或重置分支" : null;
    case "branch":
      if (hasShort(args, ["D", "f", "M", "C"]) || hasLong(args, ["--force"])) return "git branch 强制删除/移动分支";
      return null;
    case "stash":
      return pos[0] === "drop" || pos[0] === "clear" ? "git stash drop/clear 会丢弃暂存的改动" : null;
    case "update-ref":
      return hasLong(args, ["--delete"]) || hasShort(args, ["d"]) ? "git update-ref -d 删除引用" : null;
    case "reflog":
      return pos[0] === "expire" || pos[0] === "delete" ? "git reflog expire/delete 清除恢复记录" : null;
    case "gc":
      return args.some((a) => /^--prune=(now|all)$/.test(a)) ? "git gc --prune=now 清除不可达提交" : null;
    case "prune":
    case "filter-branch":
    case "filter-repo":
      return "git " + sub + " 改写历史或清理对象";
    default:
      return null;
  }
}

const BYPASS = /(gitguard\.allow|GIT_GUARD_ALLOW|HUSKY\s*=\s*0|\$env:HUSKY\s*=)/i;

function classify(cmd, depth = 0) {
  const reasons = [];
  if (!cmd || depth > 3) return reasons;
  for (const seg of splitSegments(cmd)) {
    const toks = tokenize(seg);
    for (let i = 0; i < toks.length; i++) {
      const t = toks[i];
      if (GIT_BIN.test(t)) {
        const p = parseGit(toks, i);
        if (p) {
          const r = danger(p.sub, p.args);
          if (r) reasons.push(r);
          if (p.sub === "push" && BYPASS.test(seg)) reasons.push("试图绕过 git-guard");
        }
      } else if (/\s/.test(t) && /\bgit(\.exe)?\b/i.test(t)) {
        reasons.push(...classify(t, depth + 1));
      }
    }
  }
  return [...new Set(reasons)];
}

function commandOf(payload) {
  const args = (payload && payload.toolCall && payload.toolCall.args) || {};
  let c = args.CommandLine || args.commandLine || args.command || "";
  if (typeof c !== "string") c = String(c);
  if (c.length > 1 && c.startsWith('"') && c.endsWith('"')) {
    try {
      const u = JSON.parse(c);
      if (typeof u === "string") c = u;
    } catch (e) {
      // keep the raw string
    }
  }
  return c;
}

function respond(obj) {
  const s = JSON.stringify(obj).replace(/[\u007f-￿]/g, (ch) => "\\u" + ch.charCodeAt(0).toString(16).padStart(4, "0"));
  process.stdout.write(s);
}

function log(entry) {
  try {
    fs.mkdirSync(path.dirname(LOG), { recursive: true });
    fs.appendFileSync(LOG, JSON.stringify(entry) + "\n");
  } catch (e) {
    // logging is best effort
  }
}

if (require.main === module) {
  try {
    let raw = "";
    try {
      raw = fs.readFileSync(0, "utf8");
    } catch (e) {
      raw = "";
    }
    const text = raw.trim(); // trim() also drops a UTF-8 BOM, which JSON.parse rejects
    const payload = text ? JSON.parse(text) : {};
    const cmd = commandOf(payload);
    const reasons = classify(cmd);
    if (reasons.length) {
      log({
        at: new Date().toISOString(),
        conversation: String(payload.conversationId || "").slice(0, 8),
        reasons,
        command: cmd.replace(/\/\/[^\/\s:@]+:[^\/\s@]+@/g, "//***@").slice(0, 400),
      });
      respond({
        decision: "force_ask",
        reason: "git-guard：" + reasons.join("；") + "。确认是你要求的操作再批准，否则拒绝。",
      });
    } else {
      respond(SAFE);
    }
  } catch (e) {
    respond(SAFE);
  }
}

module.exports = { classify, commandOf };
