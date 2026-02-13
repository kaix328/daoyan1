#!/bin/bash

echo "🚀 启动91Writing开发环境..."

# 检查Docker是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker未运行，请先启动Docker"
    exit 1
fi

# 停止现有容器
echo "🛑 停止现有容器..."
docker-compose --profile dev down

# 构建并启动开发环境
echo "🔨 构建并启动开发环境..."
docker-compose --profile dev up -d --build

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 5

# 检查服务状态
if docker-compose --profile dev ps | grep -q "Up"; then
    echo "✅ 开发环境启动成功！"
    echo "🌐 访问地址: http://localhost:3000"
    echo "📋 查看日志: docker-compose --profile dev logs -f"
    echo "🛑 停止服务: docker-compose --profile dev down"
else
    echo "❌ 服务启动失败，请检查日志:"
    docker-compose --profile dev logs
fi 