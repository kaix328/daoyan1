# 多阶段构建 Dockerfile
FROM node:18-alpine AS base
WORKDIR /app
# 复制package文件
COPY package*.json pnpm-lock.yaml ./
# 安装pnpm
RUN npm install -g pnpm

# 开发环境
FROM base AS development
RUN pnpm install
COPY . .
EXPOSE 3000
CMD ["pnpm", "dev", "--host", "0.0.0.0"]

# 构建阶段
FROM base AS builder
RUN pnpm install
COPY . .
RUN pnpm build

# 生产环境
FROM nginx:alpine AS production
# 复制自定义nginx配置
COPY nginx.conf /etc/nginx/nginx.conf
# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"] 