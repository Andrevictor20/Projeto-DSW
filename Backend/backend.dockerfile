FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci && npm install -g typescript

COPY . .

RUN npx prisma generate

RUN tsc && mkdir -p dist/uploads && cp -r prisma dist/

EXPOSE 5700

ENV HOST=0.0.0.0

CMD npx prisma migrate deploy && npm start