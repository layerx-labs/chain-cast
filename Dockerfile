# Builder Image

FROM node:20.13-alpine3.20 AS builder

RUN apk add python3 g++ make \
    ca-certificates \
    nodejs \
    yarn

WORKDIR /app

COPY package*.json ./

COPY .npmrc ./

RUN npm install --no-audit

COPY . .

RUN npx prisma generate

RUN  npm run build
    
FROM node:20.13-alpine3.20 AS release

RUN apk add python3 g++ make \
    ca-certificates \
    openssl-dev \
    nodejs \
    yarn

WORKDIR /app

RUN mkdir -p logs

COPY package*.json ./

COPY . .

RUN NODE_ENV=production npm install --only=production --no-audit

COPY --from=builder /app/dist ./dist

ENV NODE_ENV production

ENV PORT=55000

EXPOSE 55000

VOLUME /app/logs

CMD ["npm","run", "start"]