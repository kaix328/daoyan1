"""
工具函数测试
"""

import pytest
from app.utils.helpers import Utils, ValidationError
from app.utils.validators import (
    validate_email, validate_phone, validate_url, validate_length,
    sanitize_input_data, create_validation_error
)
from app.utils.security import SecurityManager

class TestUtils:
    """测试工具函数"""
    
    def test_validate_api_key_valid(self):
        """测试有效API密钥验证"""
        valid_keys = [
            "sk-abcdefghijklmnopqrstuvwxyz1234567890",
            "sk-test-api-key-1234567890",
            "sk-ABC123xyz789"
        ]
        
        for key in valid_keys:
            assert Utils.validate_api_key(key) == True
    
    def test_validate_api_key_invalid(self):
        """测试无效API密钥验证"""
        invalid_keys = [
            "",  # 空字符串
            "sk-",  # 过短
            "sk-abc",  # 仍然过短
            "sk-abc<>def"  # 包含特殊字符
        ]
        
        for key in invalid_keys:
            with pytest.raises(ValidationError):
                Utils.validate_api_key(key)
    
    def test_validate_script_data_valid(self):
        """测试有效脚本数据验证"""
        valid_data = {
            'theme': '测试主题',
            'script_type': '分镜分析',
            'platform': '抖音',
            'content': '这是一个测试脚本内容，长度足够长以满足验证要求。'
        }
        
        assert Utils.validate_script_data(valid_data) == True
    
    def test_validate_script_data_invalid(self):
        """测试无效脚本数据验证"""
        # 缺少必需字段
        with pytest.raises(ValidationError):
            Utils.validate_script_data({})
        
        # 空字段
        with pytest.raises(ValidationError):
            Utils.validate_script_data({
                'theme': '',
                'script_type': '分镜分析',
                'platform': '抖音',
                'content': '内容'
            })
        
        # 内容过短
        with pytest.raises(ValidationError):
            Utils.validate_script_data({
                'theme': '主题',
                'script_type': '类型',
                'platform': '平台',
                'content': '短'
            })
    
    def test_sanitize_input(self):
        """测试输入清理"""
        test_cases = [
            ("正常文本", "正常文本"),
            ("<script>alert('xss')</script>", "scriptalertxss/script"),
            ("用户输入&特殊字符!@#$%", "用户输入特殊字符"),
            ("", ""),
            (None, "")
        ]
        
        for input_text, expected in test_cases:
            result = Utils.sanitize_input(input_text)
            assert result == expected
    
    def test_create_error_response(self):
        """测试错误响应创建"""
        response, status_code = Utils.create_error_response("测试错误")
        
        assert status_code == 400
        assert response['success'] == False
        assert response['message'] == "测试错误"
        assert 'timestamp' in response
    
    def test_create_success_response(self):
        """测试成功响应创建"""
        test_data = {'id': 1, 'name': 'test'}
        response = Utils.create_success_response(test_data, "操作成功")
        
        assert response['success'] == True
        assert response['message'] == "操作成功"
        assert response['data'] == test_data
        assert 'timestamp' in response
    
    def test_format_file_size(self):
        """测试文件大小格式化"""
        test_cases = [
            (0, "0 B"),
            (1024, "1.0 KB"),
            (1048576, "1.0 MB"),
            (1073741824, "1.0 GB"),
            (512, "512.0 B"),
            (1536, "1.5 KB")
        ]
        
        for size, expected in test_cases:
            result = Utils.format_file_size(size)
            assert result == expected
    
    def test_generate_unique_id(self):
        """测试唯一ID生成"""
        id1 = Utils.generate_unique_id()
        id2 = Utils.generate_unique_id()
        
        assert len(id1) == 16
        assert len(id2) == 16
        assert id1 != id2
    
    def test_safe_json_loads(self):
        """测试安全JSON加载"""
        # 有效JSON
        result = Utils.safe_json_loads('{"key": "value"}')
        assert result == {"key": "value"}
        
        # 无效JSON
        result = Utils.safe_json_loads('invalid json')
        assert result is None
        
        # 空值
        result = Utils.safe_json_loads(None, {})
        assert result == {}

class TestValidators:
    """测试验证器"""
    
    def test_validate_email_valid(self):
        """测试有效邮箱验证"""
        valid_emails = [
            "test@example.com",
            "user.name@domain.co.uk",
            "user+tag@example.com"
        ]
        
        for email in valid_emails:
            assert validate_email(email) == True
    
    def test_validate_email_invalid(self):
        """测试无效邮箱验证"""
        invalid_emails = [
            "invalid-email",
            "@example.com",
            "user@",
            "user@.com",
            "user@domain"
        ]
        
        for email in invalid_emails:
            with pytest.raises(ValidationError):
                validate_email(email)
    
    def test_validate_phone_valid(self):
        """测试有效手机号验证"""
        valid_phones = [
            "13800138000",
            "15912345678",
            "18888888888"
        ]
        
        for phone in valid_phones:
            assert validate_phone(phone) == True
    
    def test_validate_phone_invalid(self):
        """测试无效手机号验证"""
        invalid_phones = [
            "12345678901",  # 错误号段
            "1380013800",   # 位数不足
            "138001380000", # 位数过多
            "abcdefghij"    # 非数字
        ]
        
        for phone in invalid_phones:
            with pytest.raises(ValidationError):
                validate_phone(phone)
    
    def test_validate_url_valid(self):
        """测试有效URL验证"""
        valid_urls = [
            "http://example.com",
            "https://www.example.com",
            "https://sub.domain.co.uk/path"
        ]
        
        for url in valid_urls:
            assert validate_url(url) == True
    
    def test_validate_url_invalid(self):
        """测试无效URL验证"""
        invalid_urls = [
            "not-a-url",
            "http://",
            "https://",
            "ftp://example.com"
        ]
        
        for url in invalid_urls:
            with pytest.raises(ValidationError):
                validate_url(url)
    
    def test_validate_length(self):
        """测试长度验证"""
        # 有效长度
        assert validate_length("test", 1, 10, "字段") == True
        assert validate_length("test", 4, 10, "字段") == True
        assert validate_length("test", 1, 4, "字段") == True
        
        # 长度过短
        with pytest.raises(ValidationError):
            validate_length("test", 10, 20, "字段")
        
        # 长度过长
        with pytest.raises(ValidationError):
            validate_length("test", 1, 3, "字段")
    
    def test_sanitize_input_data(self):
        """测试输入数据清理"""
        input_data = {
            "normal": "正常文本",
            "dangerous": "<script>alert('xss')</script>",
            "nested": {
                "key": "value<>!@#",
                "list": ["item1", "<danger>", {"key": "value&"}]
            }
        }
        
        result = sanitize_input_data(input_data)
        
        assert result["normal"] == "正常文本"
        assert result["dangerous"] == "scriptalertxss/script"
        assert result["nested"]["key"] == "value"
        assert result["nested"]["list"][1] == "danger"
        assert result["nested"]["list"][2]["key"] == "value"
    
    def test_create_validation_error(self):
        """测试验证错误创建"""
        error = create_validation_error("username", "长度必须在3-20之间")
        
        assert isinstance(error, ValidationError)
        assert "username" in str(error)
        assert "长度必须在3-20之间" in str(error)

class TestSecurity:
    """测试安全功能"""
    
    def setup_method(self):
        """设置测试方法"""
        self.security = SecurityManager()
    
    def test_encrypt_decrypt_api_key(self):
        """测试API密钥加密解密"""
        original_key = "sk-test-api-key-1234567890"
        
        # 加密
        encrypted = self.security.encrypt_api_key(original_key)
        assert encrypted != original_key
        assert len(encrypted) > 0
        
        # 解密
        decrypted = self.security.decrypt_api_key(encrypted)
        assert decrypted == original_key
    
    def test_hash_password(self):
        """测试密码哈希"""
        password = "testPassword123"
        
        # 哈希密码
        salt, hashed = self.security.hash_password(password)
        assert len(salt) > 0
        assert len(hashed) > 0
        assert hashed != password
        
        # 验证正确密码
        assert self.security.verify_password(password, salt, hashed) == True
        
        # 验证错误密码
        assert self.security.verify_password("wrongPassword", salt, hashed) == False
    
    def test_generate_secure_token(self):
        """测试生成安全令牌"""
        token1 = self.security.generate_secure_token(32)
        token2 = self.security.generate_secure_token(32)
        
        assert len(token1) == 32
        assert len(token2) == 32
        assert token1 != token2
        assert token1.isalnum() == True
    
    def test_generate_api_key(self):
        """测试生成API密钥"""
        api_key = self.security.generate_api_key()
        
        assert api_key.startswith("sk-")
        assert len(api_key) > 10
        assert api_key != self.security.generate_api_key()
    
    def test_sanitize_filename(self):
        """测试文件名清理"""
        test_cases = [
            ("normal.txt", "normal.txt"),
            ("file<name>.txt", "file_name_.txt"),
            ("path/to/file.txt", "path_to_file.txt"),
            ("file:with:colons.txt", "file_with_colons.txt"),
            ("a" * 300 + ".txt", "a" * 250 + ".txt")  # 长度限制
        ]
        
        for input_name, expected in test_cases:
            result = self.security.sanitize_filename(input_name)
            assert result == expected
    
    def test_validate_file_type(self):
        """测试文件类型验证"""
        # 有效类型
        assert self.security.validate_file_type("test.jpg", [".jpg", ".png"]) == True
        assert self.security.validate_file_type("test.JPG", [".jpg", ".png"]) == True
        assert self.security.validate_file_type("test.png", [".jpg", ".png"]) == True
        
        # 无效类型
        assert self.security.validate_file_type("test.txt", [".jpg", ".png"]) == False
        assert self.security.validate_file_type("test", [".jpg", ".png"]) == False
        assert self.security.validate_file_type("", [".jpg", ".png"]) == False
    
    def test_mask_sensitive_data(self):
        """测试敏感数据遮罩"""
        test_cases = [
            ("1234567890", "******7890"),  # 6个字符被遮罩，保留最后4个
            ("short", "*hort"),  # 1个字符被遮罩，保留最后4个
            ("1234", "1234"),    # 正好4个字符，不遮罩
            ("abc", "abc"),      # 少于4个字符，不遮罩
            ("", "")            # 空字符串
        ]
        
        for input_data, expected in test_cases:
            result = self.security.mask_sensitive_data(input_data)
            assert result == expected