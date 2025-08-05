#!/usr/bin/env bash

set -o errexit
set -o nounset
set -o pipefail

exec node --disable-warning=ExperimentalWarning --input-type=module --eval '
import { readFileSync } from "node:fs";
import { registerHooks, stripTypeScriptTypes } from "node:module";
import { dirname, resolve } from "node:path";
import { argv } from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const tsRegex = /^file:.*(?<!\.d)\.m?ts$/;

// Intercept .ts / .mts files (skipping .d.ts files) and
// transpile to JS, returning ES module
registerHooks({
  load(url, context, nextLoad) {
    if (tsRegex.test(url)) {
      return {
        format: "module",
        source: stripTypeScriptTypes(readFileSync(fileURLToPath(url), "utf8"), {
          mode: "transform",
          sourceUrl: url,
        }),
        shortCircuit: true,
      };
    }

    return nextLoad(url, context);
  },
});

await import(
  pathToFileURL(
    resolve(
      dirname(argv[1]),
      // Path to entry point
      "../src/index.ts",
    ),
  ).href
);
' "$0" "$@"
