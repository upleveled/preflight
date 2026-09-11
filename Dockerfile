FROM node:lts-alpine

# Prevent npx get-pnpm EBADDEVENGINES failure from
# devEngines.packageManager in /preflight/package.json
WORKDIR /

# Avoid interactive prompts eg. from `pnpm install`
ENV CI=true

# Install dependencies:
# - env to enable -S flag for custom shebang (coreutils) https://forum.gitlab.com/t/error-usr-bin-env-unrecognized-option-s-with-alpine-linux-image-causes-ci-script-to-fail/64063
# - Git to allow `git clone` in the clone-and-preflight script (git)
# - PostgreSQL for project databases
# - Python and build tools for building libpg-query with node-gyp (python3, py3-pip, build-base, bash)
RUN apk update
RUN apk add --no-cache coreutils git postgresql python3 py3-pip build-base bash

COPY ./docker/package.json ./docker/pnpm-lock.yaml ./docker/pnpm-workspace.yaml /preflight/
# Enable `pnpm add --global` on Alpine Linux by setting
# a dedicated pnpm home directory and adding its bin directory to $PATH
# https://github.com/pnpm/pnpm/issues/784#issuecomment-1518582235
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME/bin:$PATH"
RUN ENV="$HOME/.shrc" SHELL=/bin/sh npx --yes get-pnpm \
  "$(node --input-type=module --eval \
    'console.log((await import("/preflight/package.json", { with: { type: "json" } })).default.devEngines.packageManager.version)')"

WORKDIR /preflight

RUN pnpm install --frozen-lockfile

# Apply pnpm's minimumReleaseAge settings to the global install below:
# pnpm reads global settings from ~/.config/pnpm/config.yaml on Linux and
# `pnpm add --global` ignores pnpm-workspace.yaml
# - https://pnpm.io/settings#minimumreleaseage
# - https://pnpm.io/cli/config
COPY ./docker/pnpm-global-config.yaml /root/.config/pnpm/config.yaml

RUN pnpm add --global --allow-build=esbuild @upleveled/preflight@latest

COPY ./docker/clone-and-preflight.ts ./
RUN chmod +x ./clone-and-preflight.ts
ENTRYPOINT ["./clone-and-preflight.ts"]
