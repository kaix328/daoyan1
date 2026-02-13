#!/usr/bin/env python3
"""
调试代理API测试 - 测试版本
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from app.models.database import DatabaseManager
import json

def debug_test_proxy_no_api_key():
    """调试测试代理API无密钥"""
    app = create_app()
    app.config['TESTING'] = True
    
    with app.test_client() as client:
        print("测试代理API无密钥（测试版本）...")
        
        # 确保数据库中没有API密钥
        with app.app_context():
            db = DatabaseManager()
            db.set_setting('apikey', '')  # 清空API密钥
        
        response = client.post('/api/proxy', json={
            'model': 'qwen-turbo',
            'input': {'prompt': '测试提示'}
        })
        
        print(f"状态码: {response.status_code}")
        print(f"响应数据: {json.loads(response.data)}")
        
        # 检查测试条件
        assert response.status_code == 400, f"期望状态码400，实际得到{response.status_code}"
        
        data = json.loads(response.data)
        assert data['success'] == False
        assert 'API密钥未配置' in data['message']
        
        print("✅ 测试通过")

if __name__ == '__main__':
    debug_test_proxy_no_api_key()