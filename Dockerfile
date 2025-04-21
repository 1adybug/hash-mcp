# 使用官方Bun镜像作为基础镜像
FROM oven/bun:alpine AS base

# 设置工作目录
WORKDIR /app

# 复制源代码
COPY . .

# 安装依赖
RUN bun install

# 暴露服务器端口
EXPOSE 80

# 启动服务器
CMD ["bun", "run", "index.ts"]
