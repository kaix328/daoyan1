"""
AI Director Assistant - 工具函数模块
"""

import json
import os
import requests
from datetime import datetime
from flask import jsonify

class ValidationError(Exception):
    """验证错误异常"""
    pass

class APIError(Exception):
    """API错误异常"""
    pass

class Utils:
    """工具函数类"""
    
    @staticmethod
    def validate_api_key(api_key):
        """验证API密钥格式"""
        if not api_key:
            raise ValidationError("API密钥不能为空")
        
        if len(api_key) < 10:
            raise ValidationError("API密钥格式不正确")
        
        # 检查是否包含特殊字符
        if not api_key.replace('-', '').replace('_', '').isalnum():
            raise ValidationError("API密钥包含非法字符")
        
        return True
    
    @staticmethod
    def validate_script_data(data):
        """验证脚本数据"""
        required_fields = ['theme', 'script_type', 'platform', 'content']
        
        for field in required_fields:
            if field not in data:
                raise ValidationError(f"缺少必填字段: {field}")
            
            if not data[field] or not data[field].strip():
                raise ValidationError(f"字段 {field} 不能为空")
        
        # 验证字段长度
        if len(data['content']) < 10:
            raise ValidationError("脚本内容太短，至少需要10个字符")
        
        if len(data['theme']) > 100:
            raise ValidationError("主题名称不能超过100个字符")
        
        return True
    
    @staticmethod
    def sanitize_input(text):
        """清理用户输入"""
        if not text:
            return ""
        
        # 移除潜在的危险字符
        dangerous_chars = ['<', '>', '"', "'", '&', '%', '$', '#', '@', '!', '(', ')', '{', '}', '[', ']']
        for char in dangerous_chars:
            text = text.replace(char, '')
        
        return text.strip()
    
    @staticmethod
    def create_error_response(message, status_code=400, details=None):
        """创建错误响应"""
        response = {
            'success': False,
            'message': message,
            'timestamp': datetime.now().isoformat()
        }
        
        if details:
            response['details'] = details
        
        # 返回字典而不是jsonify，避免应用上下文依赖
        return response, status_code
    
    @staticmethod
    def create_success_response(data=None, message="操作成功"):
        """创建成功响应"""
        response = {
            'success': True,
            'message': message,
            'timestamp': datetime.now().isoformat()
        }
        
        if data is not None:
            response['data'] = data
        
        # 返回字典而不是jsonify，避免应用上下文依赖
        return response
    
    @staticmethod
    def check_backend_health():
        """检查后端健康状态"""
        try:
            # 检查数据库连接
            from app.models.database import DatabaseManager
            db = DatabaseManager()
            db.get_setting('test')
            
            return {
                'status': 'healthy',
                'database': 'connected',
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            return {
                'status': 'unhealthy',
                'database': 'disconnected',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    @staticmethod
    def safe_json_loads(text, default=None):
        """安全加载JSON"""
        try:
            if not text:
                return default
            return json.loads(text)
        except (json.JSONDecodeError, TypeError):
            return default
    
    @staticmethod
    def format_file_size(size_bytes):
        """格式化文件大小"""
        if size_bytes == 0:
            return "0 B"
        
        size_names = ["B", "KB", "MB", "GB", "TB"]
        i = 0
        while size_bytes >= 1024 and i < len(size_names) - 1:
            size_bytes /= 1024.0
            i += 1
        
        return f"{size_bytes:.1f} {size_names[i]}"
    
    @staticmethod
    def generate_unique_id():
        """生成唯一ID"""
        import uuid
        return str(uuid.uuid4()).replace('-', '')[:16]
    
    @staticmethod
    def log_error(error, context=None):
        """记录错误日志"""
        error_info = {
            'timestamp': datetime.now().isoformat(),
            'error_type': type(error).__name__,
            'error_message': str(error),
            'context': context
        }
        
        # 这里可以扩展为写入日志文件
        print(f"❌ Error: {error_info}")
        return error_info