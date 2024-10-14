# TODO: Switch back to lts-alpine once v22 becomes LTS
# FROM node:lts-alpine
FROM node:22-alpine

WORKDIR /preflight

COPY ./docker/package.json ./docker/pnpm-lock.yaml ./

# Install dependencies:
# - env to enable -S flag for custom shebang (coreutils) https://forum.gitlab.com/t/error-usr-bin-env-unrecognized-option-s-with-alpine-linux-image-causes-ci-script-to-fail/64063
# - Git to allow `git clone` in the clone-and-preflight script (git)
# - PostgreSQL for project databases
# - Python and build tools for building libpg-query with node-gyp (python3, py3-pip, build-base, bash)
RUN apk update
RUN apk add --no-cache coreutils git postgresql python3 py3-pip build-base bash

RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --frozen-lockfile

# Enable `pnpm add --global` on Alpine Linux by setting
# home location environment variable to a location already in $PATH
# https://github.com/pnpm/pnpm/issues/784#issuecomment-1518582235
ENV PNPM_HOME=/usr/local/bin

RUN pnpm add --global @upleveled/preflight@latest

COPY ./docker/clone-and-preflight.ts ./
RUN chmod +x ./clone-and-preflight.ts
ENTRYPOINT ["./clone-and-preflight.ts"]
