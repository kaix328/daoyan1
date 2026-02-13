# 🤖 AI Director Assistant

> 专业AI导演助手 - 智能分镜分析与剧本创作平台

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Active-brightgreen.svg)]()

## 🎬 项目介绍

AI Director Assistant 是一个集成了人工智能技术的专业影视制作辅助工具。它能够帮助导演、编剧和制作人员进行智能分镜分析、剧本创作、色彩分级建议等专业功能。

### ✨ 核心功能

- 🎥 **智能分镜分析** - AI驱动的镜头语言分析
- 📝 **剧本生成器** - 智能剧本创作助手
- 🎨 **色彩分级建议** - 专业调色指导
- 📊 **项目管理** - 完整的项目生命周期管理
- 🚀 **91写作集成** - 完整的小说写作平台
- 📱 **响应式设计** - 适配各种设备

## 🚀 快速开始

### 📋 环境要求

- Python 3.8+
- 现代浏览器（Chrome, Firefox, Safari, Edge）
- 阿里云DashScope API密钥

### 🔧 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/your-username/ai-director-assistant.git
cd ai-director-assistant
```

2. **安装依赖**
```bash
pip install -r requirements.txt
```

3. **配置环境变量**
```bash
# 创建 .env 文件
echo "DASHSCOPE_API_KEY=your_api_key_here" > .env
```

4. **启动应用**
```bash
python server.py
```

5. **访问应用**
打开浏览器访问: http://localhost:5177

### 🎯 功能模块

#### 🎬 分镜分析
- 镜头构图分析
- 运镜建议
- 光影效果指导
- 色彩情感分析

#### 📝 剧本创作
- 智能剧本生成
- 角色对话优化
- 情节发展建议
- 格式自动排版

#### 🎨 色彩分级
- 专业调色建议
- 情绪板生成
- LUT预设管理
- 实时预览功能

#### 📊 项目管理
- 项目创建与管理
- 历史记录保存
- 数据导出功能
- 团队协作支持

## 🛠️ 技术架构

### 技术栈

- **后端**: Python Flask + SQLite
- **前端**: 原生JavaScript (ES6+) + HTML5 + CSS3
- **AI集成**: 阿里云DashScope API
- **构建工具**: PyInstaller
- **数据库**: SQLite3

### 项目结构

```
AI_Director_Assistant/
├── app/                    # 应用核心代码
│   ├── routes/            # 路由模块
│   ├── models/            # 数据模型
│   └── utils/             # 工具函数
├── static/                # 静态资源
│   ├── css/              # 样式文件
│   ├── js/               # JavaScript文件
│   └── images/           # 图片资源
├── templates/             # HTML模板
├── tests/                 # 测试文件
├── docs/                  # 文档
├── requirements.txt       # Python依赖
├── server.py             # 主服务器文件
├── config.py             # 配置文件
└── README.md             # 项目文档
```

## 🔧 开发指南

### 本地开发

1. **启动开发服务器**
```bash
python server.py
```

2. **构建桌面应用**
```bash
pyinstaller AI_Director_Assistant.spec
```

### API文档

#### 代理API
- `POST /api/proxy` - 转发到DashScope API
- `GET /api/settings/apikey/check` - 检查API密钥状态
- `POST /api/settings/apikey` - 更新API密钥

#### 脚本管理
- `GET /api/scripts` - 获取脚本列表
- `POST /api/scripts` - 创建新脚本
- `PUT /api/scripts/{id}` - 更新脚本
- `DELETE /api/scripts/{id}` - 删除脚本

#### 导出功能
- `POST /api/export/pdf` - 导出PDF
- `POST /api/export/word` - 导出Word文档

## 📝 环境配置

### 环境变量

```bash
# DashScope API配置
DASHSCOPE_API_KEY=your_api_key_here

# 服务器配置
FLASK_HOST=localhost
FLASK_PORT=5177
FLASK_DEBUG=false

# 数据库配置
DATABASE_URL=sqlite:///scripts.db
```

### 依赖说明

- **Flask** - Web框架
- **Flask-CORS** - 跨域支持
- **SQLite3** - 轻量级数据库
- **Pandas** - 数据处理
- **python-docx** - Word文档处理
- **openpyxl** - Excel文件处理
- **webview** - 桌面应用支持

## 🧪 测试

运行测试套件:
```bash
pytest tests/
```

代码覆盖率:
```bash
pytest --cov=app tests/
```

## 📦 部署

### Docker部署

```bash
# 构建镜像
docker build -t ai-director-assistant .

# 运行容器
docker run -p 5177:5177 ai-director-assistant
```

### 生产环境部署

1. 使用Nginx反向代理
2. 配置HTTPS证书
3. 设置进程管理器(PM2/Supervisor)
4. 配置日志轮转

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### 代码规范

- 遵循PEP 8 Python编码规范
- 使用Black进行代码格式化
- 添加单元测试
- 更新相关文档

## 🐛 常见问题

### Q: API连接失败怎么办？
A: 检查网络连接和API密钥配置，确保在.env文件中正确设置。

### Q: 数据库初始化失败？
A: 确保有写入权限，检查SQLite数据库文件路径。

### Q: 前端资源加载失败？
A: 确认静态文件路径正确，检查web服务器配置。

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [阿里云DashScope](https://dashscope.aliyun.com/) - 提供AI能力支持
- [Flask](https://flask.palletsprojects.com/) - 优秀的Web框架
- [PyWebView](https://pywebview.flowrl.com/) - 桌面应用框架

## 📞 联系方式

- 📧 邮箱: your-email@example.com
- 💬 微信: your-wechat-id
- 🌐 官网: https://your-website.com

---

⭐ 如果这个项目对你有帮助，请给个Star支持一下！