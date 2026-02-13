@echo off
chcp 65001 >nul
echo 🚀 启动91Writing开发环境...

REM 检查Docker是否运行
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker未运行，请先启动Docker
    pause
    exit /b 1
)

REM 停止现有容器
echo 🛑 停止现有容器...
docker-compose --profile dev down

REM 构建并启动开发环境
echo 🔨 构建并启动开发环境...
docker-compose --profile dev up -d --build

REM 等待服务启动
echo ⏳ 等待服务启动...
timeout /t 5 /nobreak >nul

REM 检查服务状态
docker-compose --profile dev ps | findstr "Up" >nul
if %errorlevel% equ 0 (
    echo ✅ 开发环境启动成功！
    echo 🌐 访问地址: http://localhost:3000
    echo 📋 查看日志: docker-compose --profile dev logs -f
    echo 🛑 停止服务: docker-compose --profile dev down
) else (
    echo ❌ 服务启动失败，请检查日志:
    docker-compose --profile dev logs
)

pause 