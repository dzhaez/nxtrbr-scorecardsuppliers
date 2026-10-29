FROM node:20.17.0-bookworm-slim AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20.17.0-bookworm-slim

RUN apt-get update \
&& apt-get install -y --no-install-recommends libstdc++6 \
&& rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY server ./server
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod 755 ./docker-entrypoint.sh && chown -R node:node /app

USER node
EXPOSE 8080
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "server/index.mjs"]
