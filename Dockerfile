FROM node:lts-alpine

WORKDIR /preflight

COPY ./docker/package.json ./docker/pnpm-lock.yaml ./

# Install dependencies:
# - Git to allow `git clone` in the clone-and-preflight script
# - PostgreSQL for databases
RUN apk update
RUN apk add --no-cache git postgresql15 python3 py3-pip build-base bash

RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --frozen-lockfile

# Enable `pnpm add --global` on Alpine Linux by setting
# home location environment variable to a location already in $PATH
# https://github.com/pnpm/pnpm/issues/784#issuecomment-1518582235
ENV PNPM_HOME=/usr/local/bin

RUN pnpm add --global @upleveled/preflight@latest

# Skip dotenv usage in migrations and ESLint
ENV CI=true

COPY ./docker/clone-and-preflight.js ./
RUN chmod +x ./clone-and-preflight.js
ENTRYPOINT ["./clone-and-preflight.js"]
