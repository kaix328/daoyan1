"""
AI Director Assistant - 安全工具模块
"""

import hashlib
import secrets
import string
import os
from cryptography.fernet import Fernet
from app.utils.helpers import ValidationError

class SecurityManager:
    """安全管理器"""
    
    def __init__(self):
        self.cipher_suite = None
        self._init_encryption()
    
    def _init_encryption(self):
        """初始化加密"""
        # 获取或生成加密密钥
        encryption_key = os.getenv('ENCRYPTION_KEY')
        if not encryption_key:
            # 生成新的加密密钥
            encryption_key = Fernet.generate_key()
            print(f"⚠️  生成新的加密密钥，请妥善保管: {encryption_key.decode()}")
        else:
            encryption_key = encryption_key.encode()
        
        self.cipher_suite = Fernet(encryption_key)
    
    def encrypt_api_key(self, api_key):
        """加密API密钥"""
        try:
            encrypted = self.cipher_suite.encrypt(api_key.encode())
            return encrypted.decode()
        except Exception as e:
            raise ValidationError(f"API密钥加密失败: {e}")
    
    def decrypt_api_key(self, encrypted_api_key):
        """解密API密钥"""
        try:
            decrypted = self.cipher_suite.decrypt(encrypted_api_key.encode())
            return decrypted.decode()
        except Exception as e:
            raise ValidationError(f"API密钥解密失败: {e}")
    
    def hash_password(self, password, salt=None):
        """哈希密码"""
        if salt is None:
            salt = secrets.token_hex(32)
        
        # 使用PBKDF2进行密码哈希
        hashed = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode('utf-8'),
            salt.encode('utf-8'),
            100000  # 迭代次数
        )
        
        return salt, hashed.hex()
    
    def verify_password(self, password, salt, hashed_password):
        """验证密码"""
        _, new_hash = self.hash_password(password, salt)
        return secrets.compare_digest(new_hash, hashed_password)
    
    def generate_secure_token(self, length=32):
        """生成安全令牌"""
        alphabet = string.ascii_letters + string.digits
        return ''.join(secrets.choice(alphabet) for _ in range(length))
    
    def generate_api_key(self, prefix="sk-"):
        """生成API密钥"""
        random_part = secrets.token_urlsafe(32)
        return f"{prefix}{random_part}"
    
    def sanitize_filename(self, filename):
        """清理文件名"""
        # 移除危险字符
        dangerous_chars = ['<', '>', ':', '"', '/', '\\', '|', '?', '*', '..']
        for char in dangerous_chars:
            filename = filename.replace(char, '_')
        
        # 限制长度
        if len(filename) > 255:
            name, ext = os.path.splitext(filename)
            filename = name[:250] + ext
        
        return filename.strip()
    
    def validate_file_type(self, filename, allowed_extensions):
        """验证文件类型"""
        if not filename:
            return False
        
        # 获取文件扩展名
        ext = os.path.splitext(filename)[1].lower()
        
        # 检查扩展名
        return ext in [e.lower() for e in allowed_extensions]
    
    def create_secure_filepath(self, base_dir, filename):
        """创建安全的文件路径"""
        # 清理文件名
        clean_filename = self.sanitize_filename(filename)
        
        # 确保目录存在
        os.makedirs(base_dir, exist_ok=True)
        
        # 生成唯一文件名
        name, ext = os.path.splitext(clean_filename)
        unique_name = f"{name}_{secrets.token_hex(8)}{ext}"
        
        # 构建完整路径
        filepath = os.path.join(base_dir, unique_name)
        
        # 确保路径在基础目录内
        real_base = os.path.realpath(base_dir)
        real_path = os.path.realpath(filepath)
        
        if not real_path.startswith(real_base):
            raise ValidationError("非法的文件路径")
        
        return filepath
    
    def generate_session_id(self):
        """生成会话ID"""
        return secrets.token_urlsafe(32)
    
    def hash_sensitive_data(self, data):
        """哈希敏感数据"""
        return hashlib.sha256(data.encode()).hexdigest()
    
    def mask_sensitive_data(self, data, mask_char='*', visible_chars=4):
        """遮罩敏感数据"""
        if not data or len(data) <= visible_chars:
            return data
        
        masked_length = len(data) - visible_chars
        return mask_char * masked_length + data[-visible_chars:]

# 全局安全管理器实例
security_manager = SecurityManager()