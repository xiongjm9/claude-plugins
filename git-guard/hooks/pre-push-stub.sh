#!/bin/sh
# git-guard pre-push stub (managed by D:\claude-plugins\git-guard\install.ps1; remove with install.ps1 -Uninstall)
GUARD="__GUARD_PATH__"
ORIG="$0.git-guard-orig"
input=$(cat)
if [ -f "$GUARD" ]; then
  printf '%s\n' "$input" | sh "$GUARD" "$@" || exit $?
else
  echo "git-guard: $GUARD not found, push not checked" >&2
fi
if [ -f "$ORIG" ]; then
  printf '%s\n' "$input" | "$ORIG" "$@"
  exit $?
fi
exit 0
