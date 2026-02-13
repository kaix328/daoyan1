#!/usr/bin/env python3
"""
测试数据清理脚本
"""

import os
import sys

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models.database import DatabaseManager

def cleanup_test_data():
    """清理测试数据"""
    db = DatabaseManager()
    
    try:
        import sqlite3
        conn = sqlite3.connect(db.db_file)
        cursor = conn.cursor()
        
        # 清理脚本表
        cursor.execute("DELETE FROM scripts")
        print("✅ 脚本表已清理")
        
        # 清理设置表中的测试数据（包括API密钥）
        cursor.execute("DELETE FROM settings")
        print("✅ 设置表已清理（包括API密钥）")
        
        # 重置自增ID
        cursor.execute("DELETE FROM sqlite_sequence WHERE name='scripts'")
        print("✅ 自增ID已重置")
        
        conn.commit()
        conn.close()
        print("✅ 测试数据清理完成")
        
    except Exception as e:
        print(f"❌ 清理失败: {e}")

if __name__ == "__main__":
    cleanup_test_data()