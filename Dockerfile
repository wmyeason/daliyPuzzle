# ---------- 构建阶段：Node 编译前端产物 ----------
FROM node:20-alpine AS build
WORKDIR /app

# 先复制依赖清单，利用 Docker 层缓存加速后续构建
COPY package.json package-lock.json ./
RUN npm ci

# 复制源码并打包（vue-tsc 类型检查 + vite build）
COPY . .
RUN npm run build

# ---------- 运行阶段：Nginx 托管静态产物 ----------
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8086

CMD ["nginx", "-g", "daemon off;"]
