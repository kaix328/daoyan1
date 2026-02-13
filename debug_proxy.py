#!/usr/bin/env python3
"""
调试代理API测试
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from app.models.database import DatabaseManager
import json

def debug_proxy_api():
    """调试代理API"""
    app = create_app()
    app.config['TESTING'] = True
    
    with app.test_client() as client:
        print("测试代理API无密钥...")
        
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
        print(f"响应头: {dict(response.headers)}")
        
        # 检查响应内容
        data = json.loads(response.data)
        print(f"Success: {data.get('success')}")
        print(f"Message: {data.get('message')}")
        
        # 检查是否包含预期的错误消息
        if 'API密钥未配置' in data.get('message', ''):
            print("✅ 错误消息正确")
        else:
            print("❌ 错误消息不正确")

if __name__ == '__main__':
    debug_proxy_api()