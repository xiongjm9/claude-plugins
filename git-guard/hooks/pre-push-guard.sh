#!/bin/sh
# git-guard: block deleting remote branches and rewriting protected branches.
# Called by the per-repo pre-push stub with git's pre-push stdin and args ($1 remote, $2 url).
# One-off override for a push a human confirmed: git -c gitguard.allow=true push ...

remote="$1"

allow_override() {
  [ "${GIT_GUARD_ALLOW:-}" = "1" ] && return 0
  [ "$(git config --bool gitguard.allow 2>/dev/null)" = "true" ] && return 0
  return 1
}

protected_patterns() {
  p=$(git config --get gitguard.protected 2>/dev/null)
  [ -n "$p" ] && { printf '%s\n' "$p"; return; }
  printf '%s\n' "master master-* main dev develop test test-* uat uat* release* prod* online* T_*"
}

is_protected() {
  set -f
  for pat in $(protected_patterns); do
    case "$1" in
      $pat) set +f; return 0 ;;
    esac
  done
  set +f
  return 1
}

is_zero() {
  case "$1" in
    *[!0]*) return 1 ;;
    *) return 0 ;;
  esac
}

blocked=""
while read -r lref lsha rref rsha; do
  [ -n "$rref" ] || continue
  case "$rref" in
    refs/heads/*) ;;
    *) continue ;;
  esac
  branch=${rref#refs/heads/}
  if is_zero "$lsha"; then
    blocked="$blocked
  - 删除远程分支 $remote/$branch"
    continue
  fi
  is_zero "$rsha" && continue
  is_protected "$branch" || continue
  if ! git cat-file -e "$rsha^{commit}" 2>/dev/null; then
    blocked="$blocked
  - 推送 $remote/$branch：本地没有远程当前提交 $(printf '%.8s' "$rsha")，无法确认是快进。先 git fetch 再推"
    continue
  fi
  if ! git merge-base --is-ancestor "$rsha" "$lsha" 2>/dev/null; then
    blocked="$blocked
  - 改写受保护分支 $remote/$branch（$(printf '%.8s' "$rsha") 不是新提交的祖先）"
  fi
done

[ -z "$blocked" ] && exit 0

if allow_override; then
  echo "git-guard: 已按 gitguard.allow 放行本次推送：$blocked" >&2
  exit 0
fi

cat >&2 <<EOF
git-guard 拦截了这次推送：$blocked

这类操作会覆盖或删除远程上的提交。确认要做时，由你本人执行：
  git -c gitguard.allow=true push ...
受保护分支：$(protected_patterns)（git config --global gitguard.protected "..." 可改）

AI agents: stop here and ask the user. Do not retry with --no-verify, HUSKY=0,
GIT_GUARD_ALLOW or gitguard.allow unless the user explicitly approved this exact push.
EOF
exit 1
