"""
AI Director Assistant - 数据库模型模块
"""

import sqlite3
import json
from datetime import datetime
import os

DB_FILE = 'scripts.db'

class DatabaseManager:
    """数据库管理器"""
    
    def __init__(self, db_file=DB_FILE):
        self.db_file = db_file
        self.init_db()
    
    def init_db(self):
        """初始化数据库"""
        try:
            conn = sqlite3.connect(self.db_file)
            cursor = conn.cursor()
            
            # 设置表
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS settings (
                    key TEXT PRIMARY KEY, 
                    value TEXT
                )
            ''')
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS scripts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    theme TEXT,
                    script_type TEXT,
                    platform TEXT,
                    content TEXT,
                    is_favorite BOOLEAN DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    metadata TEXT
                )
            ''')
            
            conn.commit()
            conn.close()
            print("✅ 数据库初始化成功")
        except Exception as e:
            print(f"❌ 数据库初始化失败: {e}")
            raise
    
    def get_setting(self, key, default=None):
        """获取设置"""
        try:
            conn = sqlite3.connect(self.db_file)
            cursor = conn.cursor()
            cursor.execute('SELECT value FROM settings WHERE key = ?', (key,))
            result = cursor.fetchone()
            conn.close()
            return result[0] if result else default
        except Exception as e:
            print(f"❌ 获取设置失败: {e}")
            return default
    
    def set_setting(self, key, value):
        """设置配置"""
        try:
            conn = sqlite3.connect(self.db_file)
            cursor = conn.cursor()
            cursor.execute('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', (key, value))
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"❌ 设置配置失败: {e}")
            return False
    
    def get_all_scripts(self, limit=50):
        """获取所有脚本"""
        try:
            conn = sqlite3.connect(self.db_file)
            cursor = conn.cursor()
            cursor.execute('''
                SELECT id, theme, script_type, platform, content, is_favorite, created_at, metadata 
                FROM scripts 
                ORDER BY created_at DESC 
                LIMIT ?
            ''', (limit,))
            results = cursor.fetchall()
            conn.close()
            
            scripts = []
            for row in results:
                scripts.append({
                    'id': row[0],
                    'theme': row[1],
                    'script_type': row[2],
                    'platform': row[3],
                    'content': row[4],
                    'is_favorite': bool(row[5]),
                    'created_at': row[6],
                    'metadata': json.loads(row[7]) if row[7] else {}
                })
            return scripts
        except Exception as e:
            print(f"❌ 获取脚本失败: {e}")
            return []
    
    def create_script(self, theme, script_type, platform, content, metadata=None):
        """创建脚本"""
        try:
            conn = sqlite3.connect(self.db_file)
            cursor = conn.cursor()
            metadata_json = json.dumps(metadata) if metadata else None
            cursor.execute('''
                INSERT INTO scripts (theme, script_type, platform, content, metadata)
                VALUES (?, ?, ?, ?, ?)
            ''', (theme, script_type, platform, content, metadata_json))
            script_id = cursor.lastrowid
            conn.commit()
            conn.close()
            return script_id
        except Exception as e:
            print(f"❌ 创建脚本失败: {e}")
            return None
    
    def update_script(self, script_id, **kwargs):
        """更新脚本"""
        try:
            conn = sqlite3.connect(self.db_file)
            cursor = conn.cursor()
            
            # 构建更新查询
            update_fields = []
            values = []
            for key, value in kwargs.items():
                if key in ['theme', 'script_type', 'platform', 'content', 'is_favorite', 'metadata']:
                    if key == 'metadata' and isinstance(value, dict):
                        value = json.dumps(value)
                    update_fields.append(f"{key} = ?")
                    values.append(value)
            
            if not update_fields:
                return False
            
            values.append(script_id)
            query = f"UPDATE scripts SET {', '.join(update_fields)} WHERE id = ?"
            cursor.execute(query, values)
            
            conn.commit()
            success = cursor.rowcount > 0
            conn.close()
            return success
        except Exception as e:
            print(f"❌ 更新脚本失败: {e}")
            return False
    
    def delete_script(self, script_id):
        """删除脚本"""
        try:
            conn = sqlite3.connect(self.db_file)
            cursor = conn.cursor()
            cursor.execute('DELETE FROM scripts WHERE id = ?', (script_id,))
            success = cursor.rowcount > 0
            conn.commit()
            conn.close()
            return success
        except Exception as e:
            print(f"❌ 删除脚本失败: {e}")
            return False
    
    def toggle_favorite(self, script_id):
        """切换收藏状态"""
        try:
            conn = sqlite3.connect(self.db_file)
            cursor = conn.cursor()
            cursor.execute('UPDATE scripts SET is_favorite = NOT is_favorite WHERE id = ?', (script_id,))
            conn.commit()
            success = cursor.rowcount > 0
            conn.close()
            return success
        except Exception as e:
            print(f"❌ 切换收藏失败: {e}")
            return False