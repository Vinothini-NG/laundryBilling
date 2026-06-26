FROM node:20-alpine AS builder
RUN apk add --no-cache openssl python3 make g++
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
RUN npx prisma generate
COPY . .
RUN npm run build

FROM node:20-alpine
RUN apk add --no-cache openssl python3 make g++
WORKDIR /app
COPY package*.json ./
RUN npm ci
RUN npm install -g ts-node typescript
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./tsconfig.json
EXPOSE 8000
CMD ["sh", "-c", "npx prisma migrate deploy && npx ts-node --compiler-options '{\"module\":\"commonjs\"}' prisma/seed.ts && node dist/src/main"]
