
# Make sure the node base image's tag matches your current node version (.nvmrc file).
# With CLI builds, use : --build-arg NODE_VERSION=$(cat .nvmrc | tr -cd [:digit:].)
ARG NODE_VERSION=20.13.1

FROM node:${NODE_VERSION} AS install 

# Directory to copy build-assets to. You likely want a volume attached to it
ARG BUILD_OUTPUT_DIR=/output
ENV BUILD_OUTPUT_DIR=${BUILD_OUTPUT_DIR}

# Credentials for npm to fetch dependencies from artifactory.
ARG ARTIFACTORY_REGISTRY=artifactory.thalesdigital.io/artifactory/api/npm/npm/

RUN echo "always-auth=true" >> ${HOME}/.npmrc
RUN echo "email=$ARTIFACTORY_EMAIL" >> ${HOME}/.npmrc
RUN echo "registry=https://${ARTIFACTORY_REGISTRY}" >> ${HOME}/.npmrc
RUN --mount=type=secret,id=buildenv,destination=/run/secrets/buildenv \
  . /run/secrets/buildenv && \
  if [ -n "${ARTIFACTORY_AUTH}" ]; then \
  echo "//${ARTIFACTORY_REGISTRY}:_auth=${ARTIFACTORY_AUTH}" >> ${HOME}/.npmrc; \ 
  elif [ -n "${ARTIFACTORY_ID_TOKEN}" ]; then \
  echo "//${ARTIFACTORY_REGISTRY}:_auth=$(echo ${ARTIFACTORY_EMAIL}:${ARTIFACTORY_ID_TOKEN} | tr -d '\n' | base64 --wrap=0)" >> ${HOME}/.npmrc; \ 
  else \
  echo "Specify one of ARTIFACTORY_ID_TOKEN, ARTIFACTORY_AUTH"; \
  exit 1; \
  fi;

# Set working directory
WORKDIR /app

# Bare-minimum for dependency install. see: https://stackoverflow.com/a/31532674/15720810
COPY package.json .
COPY package-lock.json .
COPY .npmr[c] .

# If dependencies in the package lock do not match those in package.json, 
# npm ci will exit with an error, instead of updating the package lock.
RUN npm ci

# Once install is done, remove file containing secrets
RUN rm -f ${HOME}/.npmrc ${BUILDENV_FILE}

FROM install AS build

# Copy sources, make sure to inlcude node_modules in .dockerignore file
COPY . .

# Copy app env file from it's secret
RUN --mount=type=secret,id=appenv,destination=.env

# Build at runtime using runtime env variables
CMD npm run build && \
  echo "" && \
  echo "Copying build assets to ${BUILD_OUTPUT_DIR}..." && \
  cp --recursive --update ./dist/* ${BUILD_OUTPUT_DIR} && \
  echo "  Out-dir now has $(find ${BUILD_OUTPUT_DIR} -type f | wc -l) files (recursive)" && \
  echo "Done."
