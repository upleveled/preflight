# This stage installs our modules
FROM node:16.8-alpine3.12
WORKDIR /drone
COPY ./docker/clone-and-preflight.js ./docker/package.json ./docker/yarn.lock ./
RUN yarn install --frozen-lockfile
RUN yarn global add @upleveled/preflight
RUN apk add git
RUN chmod +x ./clone-and-preflight.js
ENTRYPOINT ["./clone-and-preflight.js"]

## the container should have preflight and the dependencies for the script preinstalled
## this may be in the future move this image build to preflight and install the version directly from the files - or just build after the new version is uploaded into NPM registry.
