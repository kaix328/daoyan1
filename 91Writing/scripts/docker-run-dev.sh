#!/bin/bash

echo "🚀 使用Docker Run启动开发环境..."

# 检查Docker是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker未运行，请先启动Docker"
    exit 1
fi

# 停止并删除现有容器
echo "🛑 清理现有容器..."
docker stop 91writing-dev 2>/dev/null || true
docker rm 91writing-dev 2>/dev/null || true

# 构建开发镜像
echo "🔨 构建开发镜像..."
docker build --target development -t 91writing:dev .

if [ $? -ne 0 ]; then
    echo "❌ 镜像构建失败"
    exit 1
fi

# 运行开发容器
echo "🎯 启动开发容器..."
docker run -d \
  --name 91writing-dev \
  -p 3000:3000 \
  -v $(pwd):/app \
  -v /app/node_modules \
  -e NODE_ENV=development \
  --restart unless-stopped \
  91writing:dev

# 等待容器启动
echo "⏳ 等待容器启动..."
sleep 5

# 检查容器状态
if docker ps | grep -q "91writing-dev"; then
    echo "✅ 开发环境启动成功！"
    echo "🌐 访问地址: http://localhost:3000"
    echo "📋 查看日志: docker logs -f 91writing-dev"
    echo "🛑 停止容器: docker stop 91writing-dev"
    echo "🗑️  删除容器: docker rm 91writing-dev"
else
    echo "❌ 容器启动失败，查看日志:"
    docker logs 91writing-dev
fi 