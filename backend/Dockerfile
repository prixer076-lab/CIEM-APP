FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 4000

CMD ["node", "--watch", "--require", "ts-node/register", "--require", "tsconfig-paths/register", "src/main.ts"]
