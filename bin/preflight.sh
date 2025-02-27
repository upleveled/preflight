#!/usr/bin/env bash

script_dir="$(cd "$(dirname "$0")" && pwd)"

# Workaround for incorrect path in pnpm shim
# https://github.com/pnpm/pnpm/issues/8704#issuecomment-2439618363
#
# TODO: Remove and switch back to "$script_dir/../node_modules/.bin/tsx"
# when the issue above is resolved
tsx_shim="$script_dir/../node_modules/.bin/tsx"
exec_command=$(awk '/^else$/{flag=1;next}/^fi$/{flag=0}flag' "$tsx_shim" | grep 'exec node')
cli_path=$(echo "$exec_command" | sed -E 's/^[[:space:]]*exec node[[:space:]]+"[^"]+(node_modules\/tsx\/[^"]+)".*/\1/')
cli_path="$(pnpm bin --global)/global/5/.pnpm/$cli_path"

ls /home/runner/.local/share
ls /home/runner/.local/share/pnpm
ls /home/runner/.local/share/pnpm/global
ls \\c\\Program\ Files\\Git\\home\\runner\\.local\\share\\pnpm\\global
ls /c/Program\ Files/Git/home/runner/.local/share/pnpm/global
ls "$(pnpm bin --global)"
ls "$(pnpm bin --global)/global"
ls "$(pnpm bin --global)/global/5"
ls "$(pnpm bin --global)/global/5/.pnpm"
ls "$cli_path"

node "$cli_path" "$script_dir/../src/index.ts"
