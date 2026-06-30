FROM node:20-alpine AS build
WORKDIR /app
RUN apk add --no-cache openssl
COPY package.json ./
COPY prisma ./prisma
RUN npm install
COPY . .
RUN npx prisma generate && npm run build
RUN npx tsc --esModuleInterop --module commonjs --target es2019 --skipLibCheck --outDir dist/prisma prisma/seed.ts 2>/dev/null || true
RUN rm -rf node_modules/bcrypt

FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache openssl
ENV NODE_ENV=production
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY prisma ./prisma
COPY package.json ./
RUN rm -rf node_modules/bcrypt && ls node_modules | grep bcrypt
EXPOSE 8000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main"]
