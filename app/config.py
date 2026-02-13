"""
AI Director Assistant - 配置管理模块
"""

import os
from dotenv import load_dotenv
from app.utils.helpers import ValidationError

# 加载环境变量
load_dotenv()

class Config:
    """配置管理类"""
    
    # Flask配置
    FLASK_HOST = os.getenv('FLASK_HOST', 'localhost')
    FLASK_PORT = int(os.getenv('FLASK_PORT', '5173'))
    FLASK_DEBUG = os.getenv('FLASK_DEBUG', 'false').lower() == 'true'
    
    # 数据库配置
    DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///scripts.db')
    
    # API配置
    DASHSCOPE_API_KEY = os.getenv('DASHSCOPE_API_KEY', '')
    DASHSCOPE_API_URL = os.getenv('DASHSCOPE_API_URL', 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation')
    
    # 文件上传配置
    MAX_FILE_SIZE = int(os.getenv('MAX_FILE_SIZE', '20')) * 1024 * 1024  # 20MB
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'uploads')
    
    # 安全配置
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-change-this')
    
    # 日志配置
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FILE = os.getenv('LOG_FILE', 'app.log')
    
    # 静态文件配置
    STATIC_FOLDER = os.getenv('STATIC_FOLDER', 'static')
    TEMPLATES_FOLDER = os.getenv('TEMPLATES_FOLDER', 'templates')
    
    @classmethod
    def validate_config(cls):
        """验证配置"""
        errors = []
        
        if not cls.DASHSCOPE_API_KEY:
            errors.append("DASHSCOPE_API_KEY 未配置")
        
        if cls.FLASK_PORT < 1000 or cls.FLASK_PORT > 65535:
            errors.append("FLASK_PORT 必须在1000-65535之间")
        
        if cls.MAX_FILE_SIZE <= 0:
            errors.append("MAX_FILE_SIZE 必须大于0")
        
        if len(cls.SECRET_KEY) < 16:
            errors.append("SECRET_KEY 长度必须至少16个字符")
        
        if errors:
            raise ValidationError("配置验证失败: " + "; ".join(errors))
        
        return True
    
    @classmethod
    def get_database_path(cls):
        """获取数据库文件路径"""
        if cls.DATABASE_URL.startswith('sqlite:///'):
            return cls.DATABASE_URL.replace('sqlite:///', '')
        return 'scripts.db'
    
    @classmethod
    def is_production(cls):
        """判断是否为生产环境"""
        return not cls.FLASK_DEBUG
    
    @classmethod
    def print_config(cls):
        """打印配置信息（隐藏敏感信息）"""
        config_info = {
            'FLASK_HOST': cls.FLASK_HOST,
            'FLASK_PORT': cls.FLASK_PORT,
            'FLASK_DEBUG': cls.FLASK_DEBUG,
            'DATABASE_URL': cls.DATABASE_URL,
            'MAX_FILE_SIZE': cls.MAX_FILE_SIZE,
            'UPLOAD_FOLDER': cls.UPLOAD_FOLDER,
            'STATIC_FOLDER': cls.STATIC_FOLDER,
            'LOG_LEVEL': cls.LOG_LEVEL,
            'DASHSCOPE_API_KEY': '***' if cls.DASHSCOPE_API_KEY else '未配置'
        }
        
        print("📋 应用配置:")
        for key, value in config_info.items():
            print(f"  {key}: {value}")
        
        return config_info