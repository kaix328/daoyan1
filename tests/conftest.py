"""
测试配置模块
"""

import os
import tempfile
import pytest
from app import create_app
from app.config import Config
from app.models.database import DatabaseManager

class TestConfig(Config):
    """测试配置类"""
    TESTING = True
    DATABASE_URL = f"sqlite:///{tempfile.mkdtemp()}/test.db"
    FLASK_DEBUG = False
    SECRET_KEY = "test-secret-key-123456789"
    DASHSCOPE_API_KEY = "test-api-key"

@pytest.fixture
def app():
    """创建测试应用"""
    # 创建临时数据库文件
    import tempfile
    temp_db_file = tempfile.mktemp(suffix='.db')
    
    # 创建测试配置类，使用临时数据库
    class TempTestConfig(TestConfig):
        DATABASE_URL = f"sqlite:///{temp_db_file}"
    
    app = create_app(db_file=temp_db_file)
    app.config.from_object(TempTestConfig)
    
    with app.app_context():
        # 初始化测试数据库
        db = DatabaseManager(db_file=temp_db_file)
        # 确保使用我们的测试数据库实例
        app.extensions['database'] = db
        yield app
        
        # 清理测试数据
        import os
        if os.path.exists(temp_db_file):
            os.remove(temp_db_file)

@pytest.fixture
def client(app):
    """创建测试客户端"""
    return app.test_client()

@pytest.fixture
def runner(app):
    """创建测试运行器"""
    return app.test_cli_runner()

@pytest.fixture
def auth_headers():
    """认证头"""
    return {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
    }