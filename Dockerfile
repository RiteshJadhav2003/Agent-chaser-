FROM node:22-alpine AS builder

WORKDIR /app

COPY Agent-chaser-/package.json Agent-chaser-/package-lock.json ./
RUN npm ci

COPY Agent-chaser-/ .
RUN npm run build

FROM nginx:1.27-alpine AS production

COPY Agent-chaser-/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
