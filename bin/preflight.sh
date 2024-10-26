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

if [[ ! -x "$cli_path" ]]; then
  echo "Error: tsx executable not found or is not executable at $cli_path" >&2
  # pnpm bin --global
  echo "pnpm bin --global: $(pnpm bin --global)"
  echo "script_dir: $script_dir"
  cd "$script_dir/.." || exit 1
  echo "$script_dir/node_modules/.bin files:"
  ls -la node_modules/.bin
  echo "tsx shim contents:"
  cat "$tsx_shim"
  echo "exec_command: $exec_command"
  exit 1
fi

node "$cli_path" "$script_dir/../src/index.ts"
