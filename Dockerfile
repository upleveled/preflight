FROM node:lts-alpine

WORKDIR /preflight

COPY ./docker/package.json ./docker/pnpm-lock.yaml ./

# Avoid interactive prompts eg. from `pnpm install`
ENV CI=true

# Install dependencies:
# - env to enable -S flag for custom shebang (coreutils) https://forum.gitlab.com/t/error-usr-bin-env-unrecognized-option-s-with-alpine-linux-image-causes-ci-script-to-fail/64063
# - Git to allow `git clone` in the clone-and-preflight script (git)
# - PostgreSQL for project databases
# - Python and build tools for building libpg-query with node-gyp (python3, py3-pip, build-base, bash)
RUN apk update
RUN apk add --no-cache coreutils git postgresql python3 py3-pip build-base bash

# Enable `pnpm add --global` on Alpine Linux by setting
# a dedicated pnpm home directory and adding its bin directory to $PATH
# https://github.com/pnpm/pnpm/issues/784#issuecomment-1518582235
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME/bin:$PATH"

RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --frozen-lockfile

# Apply pnpm's minimumReleaseAge settings to the global install below:
# pnpm reads global settings from config.yaml in $XDG_CONFIG_HOME/pnpm and
# `pnpm add --global` ignores pnpm-workspace.yaml
# - https://pnpm.io/settings#minimumreleaseage
ENV XDG_CONFIG_HOME=/root/.config
COPY ./docker/pnpm-config.yaml $XDG_CONFIG_HOME/pnpm/config.yaml

RUN pnpm add --global --allow-build=esbuild @upleveled/preflight@latest

COPY ./docker/clone-and-preflight.ts ./
RUN chmod +x ./clone-and-preflight.ts
ENTRYPOINT ["./clone-and-preflight.ts"]
