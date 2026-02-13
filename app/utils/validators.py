"""
AI Director Assistant - 增强错误处理和验证模块
"""

from functools import wraps
from flask import request, jsonify, current_app
from app.utils.helpers import Utils, ValidationError, APIError
import traceback
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def handle_errors(f):
    """错误处理装饰器"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except ValidationError as e:
            logger.warning(f"验证错误: {e}")
            return Utils.create_error_response(str(e), 400)
        except APIError as e:
            logger.error(f"API错误: {e}")
            return Utils.create_error_response(str(e), 502)
        except requests.exceptions.RequestException as e:
            logger.error(f"网络请求错误: {e}")
            return Utils.create_error_response("网络连接失败，请稍后重试", 503)
        except json.JSONDecodeError as e:
            logger.error(f"JSON解析错误: {e}")
            return Utils.create_error_response("数据格式错误", 400)
        except KeyError as e:
            logger.error(f"缺少必要字段: {e}")
            return Utils.create_error_response(f"缺少必要字段: {e}", 400)
        except ValueError as e:
            logger.error(f"值错误: {e}")
            return Utils.create_error_response(str(e), 400)
        except Exception as e:
            logger.error(f"未处理的异常: {e}")
            logger.error(traceback.format_exc())
            
            # 生产环境不暴露详细错误信息
            if current_app.config.get('DEBUG', False):
                return Utils.create_error_response(f"服务器错误: {str(e)}", 500)
            else:
                return Utils.create_error_response("服务器内部错误，请联系技术支持", 500)
    
    return decorated_function

def validate_json_input(required_fields=None):
    """JSON输入验证装饰器"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # 检查Content-Type
            if not request.is_json:
                return Utils.create_error_response("请求必须是JSON格式", 400)
            
            # 获取JSON数据
            data = request.get_json()
            if data is None:
                return Utils.create_error_response("无效的JSON数据", 400)
            
            # 验证必需字段
            if required_fields:
                missing_fields = []
                for field in required_fields:
                    if field not in data:
                        missing_fields.append(field)
                    elif not data[field] or (isinstance(data[field], str) and not data[field].strip()):
                        missing_fields.append(f"{field} (空值)")
                
                if missing_fields:
                    return Utils.create_error_response(f"缺少必要字段: {', '.join(missing_fields)}", 400)
            
            # 将验证后的数据传递给函数
            return f(data, *args, **kwargs)
        
        return decorated_function
    return decorator

def rate_limit(max_calls=100, time_window=60):
    """简单的速率限制装饰器"""
    call_counts = {}
    
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # 获取客户端IP
            client_ip = request.remote_addr
            current_time = time.time()
            
            # 清理旧的调用记录
            if client_ip in call_counts:
                call_counts[client_ip] = [
                    timestamp for timestamp in call_counts[client_ip]
                    if current_time - timestamp < time_window
                ]
            else:
                call_counts[client_ip] = []
            
            # 检查速率限制
            if len(call_counts[client_ip]) >= max_calls:
                return Utils.create_error_response("请求过于频繁，请稍后重试", 429)
            
            # 记录当前调用
            call_counts[client_ip].append(current_time)
            
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator

def require_api_key(f):
    """API密钥验证装饰器"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        from app.models.database import DatabaseManager
        
        db = DatabaseManager()
        api_key = db.get_setting('apikey')
        
        if not api_key:
            return Utils.create_error_response("API密钥未配置", 401)
        
        return f(*args, **kwargs)
    
    return decorated_function

def sanitize_input_data(data):
    """清理输入数据"""
    if isinstance(data, dict):
        sanitized = {}
        for key, value in data.items():
            # 清理键名
            clean_key = Utils.sanitize_input(str(key))
            sanitized[clean_key] = sanitize_input_data(value)
        return sanitized
    elif isinstance(data, list):
        return [sanitize_input_data(item) for item in data]
    elif isinstance(data, str):
        return Utils.sanitize_input(data)
    else:
        return data

def validate_file_upload(file, allowed_extensions=None, max_size=None):
    """验证文件上传"""
    if not file:
        raise ValidationError("没有选择文件")
    
    # 检查文件扩展名
    if allowed_extensions:
        filename = file.filename.lower()
        if not any(filename.endswith(ext.lower()) for ext in allowed_extensions):
            raise ValidationError(f"只允许上传以下格式的文件: {', '.join(allowed_extensions)}")
    
    # 检查文件大小
    if max_size:
        file.seek(0, 2)  # 移动到文件末尾
        file_size = file.tell()
        file.seek(0)  # 重置文件指针
        
        if file_size > max_size:
            raise ValidationError(f"文件大小超过限制，最大允许 {Utils.format_file_size(max_size)}")
    
    return True

def create_validation_error(field, message):
    """创建验证错误"""
    return ValidationError(f"字段 '{field}' 验证失败: {message}")

# 预定义的验证函数
def validate_email(email):
    """验证邮箱格式"""
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(pattern, email):
        raise ValidationError("邮箱格式不正确")
    return True

def validate_phone(phone):
    """验证手机号格式"""
    import re
    pattern = r'^1[3-9]\d{9}$'
    if not re.match(pattern, phone):
        raise ValidationError("手机号格式不正确")
    return True

def validate_url(url):
    """验证URL格式"""
    import re
    pattern = r'^https?://.+\..+$'
    if not re.match(pattern, url):
        raise ValidationError("URL格式不正确")
    return True

def validate_length(value, min_length=None, max_length=None, field_name="字段"):
    """验证长度"""
    if min_length and len(value) < min_length:
        raise ValidationError(f"{field_name} 长度不能少于 {min_length} 个字符")
    
    if max_length and len(value) > max_length:
        raise ValidationError(f"{field_name} 长度不能超过 {max_length} 个字符")
    
    return True