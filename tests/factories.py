"""
测试数据工厂
"""

import factory
from faker import Faker
from app.models.database import DatabaseManager
import tempfile
import os

fake = Faker('zh_CN')

class ScriptFactory(factory.Factory):
    """脚本数据工厂"""
    
    class Meta:
        model = dict
    
    theme = factory.LazyAttribute(lambda obj: fake.sentence(nb_words=3))
    script_type = factory.Iterator(["分镜分析", "剧本创作", "角色设定", "场景描述"])
    platform = factory.Iterator(["抖音", "快手", "小红书", "B站", "微博"])
    content = factory.LazyAttribute(lambda obj: fake.text(max_nb_chars=500))
    metadata = factory.LazyAttribute(lambda obj: {
        "author": fake.name(),
        "version": "1.0",
        "created_at": fake.iso8601(),
        "tags": [fake.word() for _ in range(3)]
    })
    is_favorite = factory.Iterator([True, False])

class TestDataGenerator:
    """测试数据生成器"""
    
    def __init__(self):
        self.db = None
        self.temp_dir = None
    
    def setup_database(self):
        """设置测试数据库"""
        self.temp_dir = tempfile.mkdtemp()
        db_file = os.path.join(self.temp_dir, 'test.db')
        self.db = DatabaseManager(db_file)
        return self.db
    
    def cleanup(self):
        """清理测试数据"""
        if self.temp_dir and os.path.exists(self.temp_dir):
            import shutil
            shutil.rmtree(self.temp_dir)
    
    def create_test_script(self, **kwargs):
        """创建测试脚本"""
        script_data = ScriptFactory.build(**kwargs)
        script_id = self.db.create_script(
            theme=script_data['theme'],
            script_type=script_data['script_type'],
            platform=script_data['platform'],
            content=script_data['content'],
            metadata=script_data['metadata'],
            is_favorite=script_data['is_favorite']
        )
        return script_id, script_data
    
    def create_test_scripts(self, count=10):
        """创建多个测试脚本"""
        scripts = []
        for _ in range(count):
            script_id, script_data = self.create_test_script()
            scripts.append({
                'id': script_id,
                'data': script_data
            })
        return scripts
    
    def create_favorite_scripts(self, count=5):
        """创建收藏的脚本"""
        scripts = []
        for _ in range(count):
            script_id, script_data = self.create_test_script(is_favorite=True)
            scripts.append({
                'id': script_id,
                'data': script_data
            })
        return scripts
    
    def create_scripts_by_platform(self, platform_counts):
        """按平台创建脚本"""
        """
        platform_counts: dict, 例如 {"抖音": 5, "小红书": 3}
        """
        scripts = []
        for platform, count in platform_counts.items():
            for _ in range(count):
                script_id, script_data = self.create_test_script(platform=platform)
                scripts.append({
                    'id': script_id,
                    'data': script_data
                })
        return scripts
    
    def create_scripts_by_type(self, type_counts):
        """按类型创建脚本"""
        """
        type_counts: dict, 例如 {"分镜分析": 5, "剧本创作": 3}
        """
        scripts = []
        for script_type, count in type_counts.items():
            for _ in range(count):
                script_id, script_data = self.create_test_script(script_type=script_type)
                scripts.append({
                    'id': script_id,
                    'data': script_data
                })
        return scripts
    
    def create_api_test_data(self):
        """创建API测试数据"""
        return {
            'valid_script': {
                'theme': '测试主题',
                'script_type': '分镜分析',
                'platform': '抖音',
                'content': '这是一个测试脚本内容，长度足够长以满足验证要求。',
                'metadata': {'author': 'tester', 'version': '1.0'}
            },
            'invalid_script': {
                'theme': '',  # 空主题
                'script_type': '分镜分析',
                'platform': '抖音',
                'content': '短'  # 内容太短
            },
            'update_data': {
                'theme': '更新后的主题',
                'content': '更新后的内容，长度足够长以满足验证要求。'
            }
        }
    
    def create_security_test_data(self):
        """创建安全测试数据"""
        return {
            'xss_payloads': [
                '<script>alert("xss")</script>',
                '<img src="x" onerror="alert(1)">',
                'javascript:alert("xss")',
                '<svg onload=alert(1)>',
                '"><script>alert(1)</script>'
            ],
            'sql_injection_payloads': [
                "'; DROP TABLE scripts; --",
                "' OR '1'='1",
                "' UNION SELECT * FROM users --",
                "admin'--",
                "1' OR 1=1#"
            ],
            'path_traversal_payloads': [
                "../../../etc/passwd",
                "..\\..\\..\\windows\\system32\\config\\sam",
                "/etc/hosts",
                "C:\\Windows\\System32\\config\\SAM"
            ],
            'command_injection_payloads': [
                "test; rm -rf /",
                "test && del /f /q *.*",
                "test | cat /etc/passwd",
                "test`whoami`"
            ]
        }

# 全局测试数据生成器实例
test_data_generator = TestDataGenerator()