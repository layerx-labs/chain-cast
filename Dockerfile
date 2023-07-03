FROM node:18.16.0-alpine3.18 AS builder

WORKDIR /app
RUN apk update
COPY package*.json ./
RUN npm --silent install --no-audit
COPY . .
RUN npm run build

FROM node:18.16.0-alpine3.18 AS release

WORKDIR /app
COPY package*.json ./
COPY . .
RUN mkdir -p logs
RUN npm install --only=production --silent --no-audit
COPY --from=builder /app/dist dist
CMD npm run start
