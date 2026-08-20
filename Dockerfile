FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npx tsc -p tsconfig.build.json

FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY migrations ./migrations
COPY src/database/node-pg-migrate-config-file.json ./src/database/node-pg-migrate-config-file.json

EXPOSE 3000

CMD ["node", "./dist/main.js"]
