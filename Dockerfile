FROM node:18-alpine

WORKDIR /preflight

COPY ./docker/clone-and-preflight.js ./docker/package.json ./docker/pnpm-lock.yaml ./

RUN corepack enable && corepack prepare pnpm@latest --activate
# Install python3 and py3-pip for building libpg_query
# Dependencies required by libpg_query:
#   - @mapbox/node-pre-gyp
#   - node-addon-api
#   - node-gyp
RUN apk add --no-cache python3 py3-pip
RUN pnpm install --frozen-lockfile

# Enable `pnpm add --global` on Alpine Linux by setting
# home location environment variable to a location already in $PATH
# https://github.com/pnpm/pnpm/issues/784#issuecomment-1518582235
ENV PNPM_HOME=/usr/local/bin

RUN pnpm add --global @upleveled/preflight@latest

# Allow `git clone` and  in the script
RUN apk add git


RUN chmod +x ./clone-and-preflight.js
ENTRYPOINT ["./clone-and-preflight.js"]
