#!/usr/bin/env bash

SCRIPT_DIR="${BASH_SOURCE[0]%/*}"
cd "$SCRIPT_DIR" || exit 1

pnpm exec tsx "./src/index.ts"
