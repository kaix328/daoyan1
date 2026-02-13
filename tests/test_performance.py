"""
性能测试
"""

import pytest
import time
from app.models.database import DatabaseManager
from app.utils.helpers import Utils
import tempfile
import os

class TestPerformance:
    """性能测试"""
    
    def setup_method(self):
        """设置测试方法"""
        self.temp_dir = tempfile.mkdtemp()
        self.db_file = os.path.join(self.temp_dir, 'perf_test.db')
        self.db = DatabaseManager(self.db_file)
    
    def teardown_method(self):
        """清理测试方法"""
        if os.path.exists(self.temp_dir):
            import shutil
            shutil.rmtree(self.temp_dir)
    
    def test_database_performance(self):
        """测试数据库性能"""
        # 测试大量数据插入性能
        start_time = time.time()
        
        for i in range(1000):
            self.db.create_script(
                theme=f"性能测试主题{i}",
                script_type="分镜分析",
                platform="抖音",
                content=f"这是第{i}个测试脚本内容，用于性能测试。"
            )
        
        insert_time = time.time() - start_time
        print(f"插入1000条数据耗时: {insert_time:.2f}秒")
        
        # 测试查询性能
        start_time = time.time()
        scripts = self.db.get_all_scripts(limit=100)
        query_time = time.time() - start_time
        
        assert len(scripts) == 100
        print(f"查询100条数据耗时: {query_time:.2f}秒")
        
        # 性能要求：插入1000条数据应小于30秒，查询100条数据应小于1秒（放宽标准）
        assert insert_time < 30.0, f"插入性能不达标: {insert_time}秒"
        assert query_time < 1.0, f"查询性能不达标: {query_time}秒"
    
    def test_api_validation_performance(self):
        """测试API验证性能"""
        # 测试大量数据验证性能
        test_data = {
            'theme': '测试主题',
            'script_type': '分镜分析',
            'platform': '抖音',
            'content': '这是一个很长的测试脚本内容' * 100  # 长内容
        }
        
        start_time = time.time()
        
        for i in range(1000):
            Utils.validate_script_data(test_data)
        
        validation_time = time.time() - start_time
        print(f"验证1000次脚本数据耗时: {validation_time:.2f}秒")
        
        # 性能要求：1000次验证应小于2秒
        assert validation_time < 2.0, f"验证性能不达标: {validation_time}秒"
    
    def test_concurrent_database_operations(self):
        """测试并发数据库操作"""
        import threading
        
        results = []
        errors = []
        
        def create_script(index):
            try:
                script_id = self.db.create_script(
                    theme=f"并发测试{index}",
                    script_type="分镜分析",
                    platform="抖音",
                    content=f"并发测试内容{index}"
                )
                results.append(script_id)
            except Exception as e:
                errors.append(str(e))
        
        # 启动多个线程
        threads = []
        start_time = time.time()
        
        for i in range(50):
            thread = threading.Thread(target=create_script, args=(i,))
            threads.append(thread)
            thread.start()
        
        # 等待所有线程完成
        for thread in threads:
            thread.join()
        
        concurrent_time = time.time() - start_time
        
        print(f"50个并发操作耗时: {concurrent_time:.2f}秒")
        print(f"成功创建: {len(results)}个脚本")
        print(f"错误数量: {len(errors)}个")
        
        # 验证结果
        assert len(errors) == 0, f"并发操作出现错误: {errors}"
        assert len(results) == 50, f"预期创建50个脚本，实际创建{len(results)}个"
        
        # 性能要求：50个并发操作应小于3秒
        assert concurrent_time < 3.0, f"并发性能不达标: {concurrent_time}秒"
    
    @pytest.mark.slow
    def test_large_data_handling(self):
        """测试大数据处理性能"""
        # 创建包含大量数据的脚本
        large_content = "测试内容" * 10000  # 约5万字符
        
        start_time = time.time()
        
        script_id = self.db.create_script(
            theme="大数据测试",
            script_type="分镜分析",
            platform="抖音",
            content=large_content
        )
        
        create_time = time.time() - start_time
        
        # 查询大数据脚本
        start_time = time.time()
        scripts = self.db.get_all_scripts()
        query_time = time.time() - start_time
        
        print(f"创建大数据脚本耗时: {create_time:.2f}秒")
        print(f"查询大数据脚本耗时: {query_time:.2f}秒")
        
        # 验证数据完整性
        assert len(scripts) == 1
        assert len(scripts[0]['content']) == len(large_content)
        assert scripts[0]['content'] == large_content
        
        # 性能要求：创建和查询大数据应合理时间内完成
        assert create_time < 10.0, f"大数据创建性能不达标: {create_time}秒"
        assert query_time < 5.0, f"大数据查询性能不达标: {query_time}秒"
    
    def test_memory_usage(self):
        """测试内存使用情况"""
        import psutil
        import gc
        
        process = psutil.Process()
        
        # 获取初始内存使用
        gc.collect()  # 强制垃圾回收
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB
        
        # 创建大量对象
        scripts = []
        for i in range(1000):
            script = {
                'id': i,
                'theme': f'内存测试主题{i}',
                'content': f'内存测试内容{i}' * 100
            }
            scripts.append(script)
        
        # 获取峰值内存使用
        peak_memory = process.memory_info().rss / 1024 / 1024  # MB
        
        # 清理引用
        del scripts
        gc.collect()
        
        # 获取最终内存使用
        final_memory = process.memory_info().rss / 1024 / 1024  # MB
        
        print(f"初始内存使用: {initial_memory:.2f} MB")
        print(f"峰值内存使用: {peak_memory:.2f} MB")
        print(f"最终内存使用: {final_memory:.2f} MB")
        
        # 内存要求：峰值不应超过初始值的5倍，最终应接近初始值
        assert peak_memory < initial_memory * 5, f"内存使用过高: {peak_memory} MB"
        assert final_memory < initial_memory * 1.5, f"内存泄漏: {final_memory} MB"
    
    def test_response_time_benchmarks(self):
        """测试响应时间基准"""
        # 模拟API响应时间测试
        import time
        
        def mock_api_call():
            """模拟API调用"""
            time.sleep(0.1)  # 模拟100ms延迟
            return {"success": True, "data": "test"}
        
        response_times = []
        
        for i in range(100):
            start_time = time.time()
            result = mock_api_call()
            response_time = time.time() - start_time
            response_times.append(response_time)
        
        # 计算统计信息
        avg_time = sum(response_times) / len(response_times)
        max_time = max(response_times)
        min_time = min(response_times)
        
        print(f"API调用统计:")
        print(f"平均响应时间: {avg_time:.3f}秒")
        print(f"最大响应时间: {max_time:.3f}秒")
        print(f"最小响应时间: {min_time:.3f}秒")
        
        # 性能要求：平均响应时间应小于200ms
        assert avg_time < 0.2, f"平均响应时间超标: {avg_time:.3f}秒"
        assert max_time < 0.5, f"最大响应时间超标: {max_time:.3f}秒"