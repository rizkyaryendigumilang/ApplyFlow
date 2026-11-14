FROM node:20-alpine AS build
WORKDIR /app
ARG VITE_POCKETBASE_URL
ARG VITE_TELEGRAM_BOT_USERNAME
ENV VITE_POCKETBASE_URL=${VITE_POCKETBASE_URL}
ENV VITE_TELEGRAM_BOT_USERNAME=${VITE_TELEGRAM_BOT_USERNAME}
COPY package.json .
COPY package-lock.json .
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
