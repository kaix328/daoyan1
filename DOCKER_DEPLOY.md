# AI Director Assistant Docker部署文档

## 快速开始

### 1. 使用Docker Compose部署

```bash
# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 2. 使用Docker单独部署

```bash
# 构建镜像
docker build -t ai-director-assistant .

# 运行容器
docker run -d \
  --name ai-director \
  -p 5173:5173 \
  -e DASHSCOPE_API_KEY=your-api-key \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/logs:/app/logs \
  ai-director-assistant
```

## 环境变量配置

### 必需环境变量
- `DASHSCOPE_API_KEY`: DashScope API密钥

### 可选环境变量
- `FLASK_HOST`: 服务主机 (默认: 0.0.0.0)
- `FLASK_PORT`: 服务端口 (默认: 5173)
- `FLASK_DEBUG`: 调试模式 (默认: false)
- `DATABASE_URL`: 数据库URL (默认: sqlite:///app/scripts.db)
- `LOG_LEVEL`: 日志级别 (默认: INFO)
- `MAX_FILE_SIZE`: 最大文件大小MB (默认: 20)
- `SECRET_KEY`: 应用密钥

## 数据持久化

Docker Compose会自动创建以下卷：
- `./data`: 数据库文件
- `./logs`: 应用日志
- `./uploads`: 上传文件

## 健康检查

应用提供健康检查端点：
```
GET /health
```

Docker会自动执行健康检查，确保服务正常运行。

## 扩展部署

### 使用外部数据库
```yaml
environment:
  - DATABASE_URL=postgresql://user:pass@db:5432/aidirector
```

### 使用Redis缓存
```yaml
environment:
  - REDIS_URL=redis://redis:6379/0
```

### 配置HTTPS
1. 准备SSL证书
2. 修改nginx.conf配置
3. 重启服务

## 监控和日志

### 查看应用日志
```bash
docker-compose logs -f app
```

### 查看系统资源
```bash
docker stats
```

### 日志轮转
应用使用轮转日志，自动管理日志文件大小。

## 故障排除

### 容器无法启动
```bash
# 检查日志
docker-compose logs app

# 进入容器调试
docker-compose exec app bash
```

### 数据库连接问题
```bash
# 检查数据库文件权限
ls -la data/

# 重置数据库
docker-compose exec app rm data/scripts.db
```

### 性能问题
```bash
# 查看资源使用
docker stats

# 检查慢查询日志
less logs/app.log
```

## 安全建议

1. **使用强密码**: 设置复杂的SECRET_KEY
2. **限制访问**: 配置防火墙规则
3. **定期备份**: 备份数据库和配置文件
4. **更新镜像**: 定期更新基础镜像和依赖

## 性能优化

### 资源限制
```yaml
deploy:
  resources:
    limits:
      cpus: '2.0'
      memory: 2G
    reservations:
      cpus: '1.0'
      memory: 1G
```

### 连接池配置
```yaml
environment:
  - DATABASE_POOL_SIZE=20
  - DATABASE_MAX_OVERFLOW=30
```