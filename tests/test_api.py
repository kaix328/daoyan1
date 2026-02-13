"""
API路由测试
"""

import pytest
import json
from unittest.mock import patch, Mock

class TestAPIRoutes:
    """测试API路由"""
    
    def test_health_check(self, client):
        """测试健康检查"""
        response = client.get('/api/health')
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert data['success'] == True
        assert 'status' in data['data']
    
    def test_check_api_key_not_configured(self, client):
        """测试API密钥未配置"""
        response = client.get('/api/settings/apikey/check')
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert data['success'] == True
        assert data['data']['exists'] == False
        assert data['data']['configured'] == False
    
    def test_update_api_key_invalid(self, client):
        """测试更新无效API密钥"""
        # 测试空密钥
        response = client.post('/api/settings/apikey', 
                             json={'apikey': ''})
        assert response.status_code == 400
        
        data = json.loads(response.data)
        assert data['success'] == False
        assert 'API密钥不能为空' in data['message']
        
        # 测试过短密钥
        response = client.post('/api/settings/apikey', 
                             json={'apikey': '123'})
        assert response.status_code == 400
        
        data = json.loads(response.data)
        assert data['success'] == False
        assert 'API密钥格式不正确' in data['message']
    
    def test_update_api_key_valid(self, client):
        """测试更新有效API密钥"""
        valid_key = "sk-abcdefghijklmnopqrstuvwxyz1234567890"
        response = client.post('/api/settings/apikey', 
                             json={'apikey': valid_key})
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert data['success'] == True
        assert 'API密钥更新成功' in data['message']
        
        # 验证密钥已保存
        response = client.get('/api/settings/apikey/check')
        data = json.loads(response.data)
        assert data['data']['exists'] == True
    
    def test_get_scripts_empty(self, client):
        """测试获取空脚本列表"""
        response = client.get('/api/scripts')
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert data['success'] == True
        assert data['data']['scripts'] == []
        assert data['data']['count'] == 0
    
    def test_create_script_invalid(self, client):
        """测试创建无效脚本"""
        # 测试缺少必需字段
        response = client.post('/api/scripts', json={})
        assert response.status_code == 400
        
        data = json.loads(response.data)
        assert data['success'] == False
        assert '缺少必要字段' in data['message']
        
        # 测试空字段
        response = client.post('/api/scripts', json={
            'theme': '',
            'script_type': '',
            'platform': '',
            'content': ''
        })
        assert response.status_code == 400
        
        data = json.loads(response.data)
        assert data['success'] == False
        assert '不能为空' in data['message']
        
        # 测试内容过短
        response = client.post('/api/scripts', json={
            'theme': '测试主题',
            'script_type': '分镜分析',
            'platform': '抖音',
            'content': '短'
        })
        assert response.status_code == 400
        
        data = json.loads(response.data)
        assert data['success'] == False
        assert '内容太短' in data['message']
    
    def test_create_script_valid(self, client):
        """测试创建有效脚本"""
        script_data = {
            'theme': '测试主题',
            'script_type': '分镜分析',
            'platform': '抖音',
            'content': '这是一个测试脚本内容，长度足够长以满足验证要求。',
            'metadata': {'author': 'tester', 'version': '1.0'}
        }
        
        response = client.post('/api/scripts', json=script_data)
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert data['success'] == True
        assert 'id' in data['data']
        assert data['data']['message'] == '脚本创建成功'
    
    def test_get_scripts_with_data(self, client):
        """测试获取有数据的脚本列表"""
        # 先创建一些脚本
        for i in range(3):
            client.post('/api/scripts', json={
                'theme': f'主题{i}',
                'script_type': '分镜分析',
                'platform': '抖音',
                'content': f'这是第{i}个测试脚本内容，长度足够长。'
            })
        
        # 获取脚本列表
        response = client.get('/api/scripts')
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert data['success'] == True
        assert len(data['data']['scripts']) == 3
        assert data['data']['count'] == 3
    
    def test_update_script(self, client):
        """测试更新脚本"""
        # 先创建脚本
        response = client.post('/api/scripts', json={
            'theme': '原始主题',
            'script_type': '分镜分析',
            'platform': '抖音',
            'content': '原始内容，长度足够长以满足验证要求。'
        })
        
        data = json.loads(response.data)
        script_id = data['data']['id']
        
        # 更新脚本
        response = client.put(f'/api/scripts/{script_id}', json={
            'theme': '更新后的主题',
            'content': '更新后的内容，长度足够长以满足验证要求。'
        })
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert data['success'] == True
        assert data['message'] == '脚本更新成功'
    
    def test_delete_script(self, client):
        """测试删除脚本"""
        # 先创建脚本
        response = client.post('/api/scripts', json={
            'theme': '待删除主题',
            'script_type': '分镜分析',
            'platform': '抖音',
            'content': '待删除的内容，长度足够长以满足验证要求。'
        })
        
        data = json.loads(response.data)
        script_id = data['data']['id']
        
        # 删除脚本
        response = client.delete(f'/api/scripts/{script_id}')
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert data['success'] == True
        assert data['message'] == '脚本删除成功'
    
    def test_toggle_favorite(self, client):
        """测试收藏功能"""
        # 先创建脚本
        response = client.post('/api/scripts', json={
            'theme': '收藏测试主题',
            'script_type': '分镜分析',
            'platform': '抖音',
            'content': '收藏测试内容，长度足够长以满足验证要求。'
        })
        
        data = json.loads(response.data)
        script_id = data['data']['id']
        
        # 切换收藏状态
        response = client.post(f'/api/scripts/{script_id}/favorite')
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert data['success'] == True
        assert data['message'] == '收藏状态更新成功'
    
    def test_get_stats(self, client):
        """测试获取统计信息"""
        # 创建一些测试数据
        for i in range(5):
            client.post('/api/scripts', json={
                'theme': f'统计测试{i}',
                'script_type': '分镜分析' if i % 2 == 0 else '剧本创作',
                'platform': '抖音' if i % 3 == 0 else '小红书',
                'content': f'统计测试内容{i}，长度足够长以满足验证要求。'
            })
        
        # 获取统计信息
        response = client.get('/api/stats')
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert data['success'] == True
        assert data['data']['total_scripts'] == 5
        assert 'type_distribution' in data['data']
        assert 'platform_distribution' in data['data']
    
    @patch('requests.post')
    def test_proxy_success(self, mock_post, client):
        """测试代理API成功"""
        # 先设置API密钥
        client.post('/api/settings/apikey', json={
            'apikey': 'sk-test-api-key-1234567890'
        })
        
        # 模拟成功的API响应
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.content = b'{"result": "success"}'
        mock_response.headers = {'Content-Type': 'application/json'}
        mock_post.return_value = mock_response
        
        # 测试代理请求
        response = client.post('/api/proxy', json={
            'model': 'qwen-turbo',
            'input': {'prompt': '测试提示'}
        })
        
        assert response.status_code == 200
        mock_post.assert_called_once()
    
    def test_proxy_no_api_key(self, client):
        """测试代理API无密钥"""
        response = client.post('/api/proxy', json={
            'model': 'qwen-turbo',
            'input': {'prompt': '测试提示'}
        })
        
        assert response.status_code == 400
        
        data = json.loads(response.data)
        assert data['success'] == False
        assert 'API密钥未配置' in data['message']
    
    def test_proxy_invalid_data(self, client):
        """测试代理API无效数据"""
        # 设置API密钥
        client.post('/api/settings/apikey', json={
            'apikey': 'sk-test-api-key-1234567890'
        })
        
        # 测试缺少model参数
        response = client.post('/api/proxy', json={
            'input': {'prompt': '测试提示'}
        })
        assert response.status_code == 400
        
        data = json.loads(response.data)
        assert data['success'] == False
        assert '缺少model参数' in data['message']
        
        # 测试缺少input参数
        response = client.post('/api/proxy', json={
            'model': 'qwen-turbo'
        })
        assert response.status_code == 400
        
        data = json.loads(response.data)
        assert data['success'] == False
        assert '缺少input参数' in data['message']
    
    def test_invalid_limit_parameter(self, client):
        """测试无效的limit参数"""
        # 测试负数
        response = client.get('/api/scripts?limit=-1')
        assert response.status_code == 400
        
        # 测试过大数值
        response = client.get('/api/scripts?limit=200')
        assert response.status_code == 400
        
        data = json.loads(response.data)
        assert data['success'] == False
        assert 'limit参数必须在1-100之间' in data['message']