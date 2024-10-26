#!/usr/bin/env bash

script_dir="$(cd "$(dirname "$0")" && pwd)"

# Workaround for incorrect path in pnpm shim
# https://github.com/pnpm/pnpm/issues/8704#issuecomment-2439618363
#
# TODO: Remove and switch back to "$script_dir/../node_modules/.bin/tsx"
# when the issue above is resolved
tsx_shim="$script_dir/../node_modules/.bin/tsx"
exec_command=$(awk '/^else$/{flag=1;next}/^fi$/{flag=0}flag' "$tsx_shim" | grep 'exec node')
cli_path=$(echo "$exec_command" | sed -E 's/^[[:space:]]*exec node[[:space:]]+"([^"]+)".*/\1/')
cli_path="${cli_path/\$basedir/$script_dir}"
cli_path="${cli_path/\/pnpm\//\/pnpm\/global\/5\/.pnpm\/}"

# node "$cli_path" "$script_dir/../src/index.ts"
node "$script_dir/../node_modules/.bin/tsx" "$script_dir/../src/index.ts"
