# git-guard

拦住 AI agent 擅自执行的危险 git 操作。

起因是 2026-10 的两起事件：Antigravity 在用户只是追问时执行了 `reset --hard` 和 `push --force`，还删除了远程分支；另一次没等确认就执行了 `git checkout . ; git clean -fd`。

插件分两层：

| 层 | 覆盖哪些客户端 | 做什么 |
| --- | --- | --- |
| pre-push 钩子 | 所有客户端：Claude Code、Grok、dsh、Antigravity、手动执行 | 拒绝删除远程分支；受保护分支只允许快进推送 |
| Antigravity 插件 | 只有 Antigravity | `reset --hard`、`clean -f`、`checkout <文件>`、`restore`、强推、`branch -D/-f`、`stash drop/clear` 每次都弹确认；其余命令照常自动执行 |

## 安装

```
powershell -ExecutionPolicy Bypass -File install.ps1 -DryRun   # 先看会改哪些仓库
powershell -ExecutionPolicy Bypass -File install.ps1
```

默认扫描 `D:\code`（一层）和 `D:\workSpace`（四层），各仓库的子模块（如 `@components`）也会装上。
- 只装指定仓库：`-Repos D:\code\ms-client`
- 不装 Antigravity 插件：`-SkipAntigravity`

安装脚本做这几件事：

1. 把 `hooks/pre-push-guard.sh` 同步到 `%APPDATA%\git-guard\`。
2. 给每个仓库写一个 pre-push 小脚本：
   - 普通仓库写到 `.git/hooks/pre-push`。如果原来已有 pre-push（比如 yorkie 生成的），先改名为 `pre-push.git-guard-orig`，检查通过后照常执行它。
   - husky v9 仓库（`core.hooksPath=.husky/_`）写到 `.husky/pre-push`，并加进 `.git/info/exclude`，所以不会出现在 `git status` 里。如果仓库已经跟踪了 `.husky/pre-push`，就跳过这个仓库。
   - 其它 `core.hooksPath` 的仓库不动。
3. 把 `antigravity/` 装到 `~/.gemini/config/plugins/git-guard/`。新开对话后生效，没生效就重启 Antigravity。
4. 把改了什么记到 `%APPDATA%\git-guard\installed.json`，卸载时按这份记录还原。

新克隆的仓库要再跑一次 `install.ps1`。重复运行是安全的。

## 确实要强推或删远程分支

由你本人执行，只放行这一次：

```
git -c gitguard.allow=true push --force origin test
```

拦截提示里有一句写给 AI agent 的话，要它停下来问你，不要用 `--no-verify` 或 `HUSKY=0` 绕过。在 Antigravity 里，带这些参数的推送也会弹确认。

## 受保护分支

默认名单：`master master-* main dev develop test test-* uat uat* release* prod* online* T_*`。

- 这些分支只允许快进推送。
- 其它分支（如 `feature/*`）可以强推。
- 任何分支都不能删除远程分支。

改名单：

```
git config --global gitguard.protected "master main test uat* release* T_*"
```

## 验证

```
powershell -ExecutionPolicy Bypass -File selftest.ps1
```

自测在临时目录里新建远程仓库和克隆，不碰你的仓库。测试内容：拦截、放行、串联原有钩子、husky、卸载还原，以及 Antigravity 的命令分类。

Antigravity 插件装好后，可以这样确认它生效：新开一个对话，让它在临时目录里执行 `git init`，再执行 `git reset --hard`，应该会弹出确认框。每次拦截都记在 `%APPDATA%\git-guard\antigravity.log`。

## 卸载

```
powershell -ExecutionPolicy Bypass -File install.ps1 -Uninstall
```

卸载会删掉各仓库的小脚本、还原原有的 pre-push、清掉 exclude 里的记录，并删除 Antigravity 插件目录。

只想关掉 Antigravity 那一层，在 Antigravity 设置的插件列表里关掉 `git-guard` 即可。

## 限制

- 本地钩子可以被 `--no-verify` 跳过。真正的保护要在 Git 服务端给 test、uat、master 开保护分支。
- `reset --hard`、`clean -fd`、`checkout <文件>` 都在本地执行，pre-push 管不到。Antigravity 之外的客户端只能靠它们自己的确认机制。
- Antigravity 插件对其它命令一律返回 `allow`，和现在的设置 `CASCADE_COMMANDS_AUTO_EXECUTION_EAGER` 效果一样。以后如果把命令执行改成需要确认，要把 `antigravity/guard.js` 里的 `SAFE` 改成 `{ decision: "ask" }`，否则插件会替所有命令放行。
- Antigravity 插件需要 `node` 在 PATH 上。

## 文件

| 文件 | 内容 |
| --- | --- |
| `hooks/pre-push-guard.sh` | 检查逻辑：删除远程分支、受保护分支非快进 |
| `hooks/pre-push-stub.sh` | 装到各仓库的小脚本：先调用检查，再执行原有 pre-push |
| `antigravity/guard.js` | PreToolUse 钩子：识别危险 git 命令，返回 `force_ask` |
| `antigravity/hooks.json.tmpl` | 安装时填入 guard.js 路径 |
| `install.ps1` / `selftest.ps1` | 安装、卸载、自测 |
