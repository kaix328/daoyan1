"""
数据库模型测试
"""

import pytest
from app.models.database import DatabaseManager
from app.config import Config

class TestDatabaseManager:
    """测试数据库管理器"""
    
    def test_init_db(self, tmp_path):
        """测试数据库初始化"""
        db_file = tmp_path / "test.db"
        db = DatabaseManager(str(db_file))
        
        # 验证数据库文件已创建
        assert db_file.exists()
    
    def test_setting_operations(self, tmp_path):
        """测试设置操作"""
        db_file = tmp_path / "test.db"
        db = DatabaseManager(str(db_file))
        
        # 测试设置和获取
        assert db.set_setting('test_key', 'test_value') == True
        assert db.get_setting('test_key') == 'test_value'
        
        # 测试默认值
        assert db.get_setting('non_existent', 'default') == 'default'
        assert db.get_setting('non_existent') is None
    
    def test_script_operations(self, tmp_path):
        """测试脚本操作"""
        db_file = tmp_path / "test.db"
        db = DatabaseManager(str(db_file))
        
        # 创建脚本
        script_id = db.create_script(
            theme="测试主题",
            script_type="分镜分析",
            platform="抖音",
            content="这是一个测试脚本内容",
            metadata={"author": "test", "version": "1.0"}
        )
        
        assert script_id is not None
        assert script_id > 0
        
        # 获取脚本列表
        scripts = db.get_all_scripts()
        assert len(scripts) == 1
        
        script = scripts[0]
        assert script['theme'] == "测试主题"
        assert script['script_type'] == "分镜分析"
        assert script['platform'] == "抖音"
        assert script['content'] == "这是一个测试脚本内容"
        assert script['metadata']['author'] == "test"
    
    def test_update_script(self, tmp_path):
        """测试更新脚本"""
        db_file = tmp_path / "test.db"
        db = DatabaseManager(str(db_file))
        
        # 创建脚本
        script_id = db.create_script("原始主题", "类型", "平台", "内容")
        
        # 更新脚本
        success = db.update_script(
            script_id,
            theme="更新后的主题",
            content="更新后的内容"
        )
        
        assert success == True
        
        # 验证更新
        scripts = db.get_all_scripts()
        assert scripts[0]['theme'] == "更新后的主题"
        assert scripts[0]['content'] == "更新后的内容"
    
    def test_delete_script(self, tmp_path):
        """测试删除脚本"""
        db_file = tmp_path / "test.db"
        db = DatabaseManager(str(db_file))
        
        # 创建脚本
        script_id = db.create_script("主题", "类型", "平台", "内容")
        
        # 删除脚本
        success = db.delete_script(script_id)
        assert success == True
        
        # 验证删除
        scripts = db.get_all_scripts()
        assert len(scripts) == 0
    
    def test_toggle_favorite(self, tmp_path):
        """测试收藏功能"""
        db_file = tmp_path / "test.db"
        db = DatabaseManager(str(db_file))
        
        # 创建脚本
        script_id = db.create_script("主题", "类型", "平台", "内容")
        
        # 切换收藏状态
        success = db.toggle_favorite(script_id)
        assert success == True
        
        # 验证状态
        scripts = db.get_all_scripts()
        assert scripts[0]['is_favorite'] == True
        
        # 再次切换
        db.toggle_favorite(script_id)
        scripts = db.get_all_scripts()
        assert scripts[0]['is_favorite'] == False
    
    def test_get_scripts_limit(self, tmp_path):
        """测试脚本数量限制"""
        db_file = tmp_path / "test.db"
        db = DatabaseManager(str(db_file))
        
        # 创建多个脚本
        for i in range(10):
            db.create_script(f"主题{i}", "类型", "平台", f"内容{i}")
        
        # 测试不同的限制
        scripts_5 = db.get_all_scripts(5)
        scripts_10 = db.get_all_scripts(10)
        scripts_all = db.get_all_scripts()
        
        assert len(scripts_5) == 5
        assert len(scripts_10) == 10
        assert len(scripts_all) == 10
    
    def test_error_handling(self, tmp_path):
        """测试错误处理"""
        db_file = tmp_path / "test.db"
        db = DatabaseManager(str(db_file))
        
        # 测试无效操作
        result = db.update_script(999, theme="不存在")  # 不存在的ID
        assert result == False
        
        result = db.delete_script(999)  # 不存在的ID
        assert result == False
        
        result = db.toggle_favorite(999)  # 不存在的ID
        assert result == False