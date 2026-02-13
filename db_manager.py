import sqlite3
import json
import os
import sys

# Determine DB file path
if getattr(sys, 'frozen', False):
    # If frozen (packaged), store DB next to the executable
    DB_FILE = os.path.join(os.path.dirname(sys.executable), "scripts.db")
else:
    # If running from source, store DB in current directory
    DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "scripts.db")

def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    # Settings Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
    )
    ''')
    # Scripts Table
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
    
    # Migration: Add metadata column if missing
    try:
        cursor.execute('ALTER TABLE scripts ADD COLUMN metadata TEXT')
    except sqlite3.OperationalError:
        pass

    # Novels Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS novels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        description TEXT,
        genre TEXT,
        cover_image TEXT,
        extra_data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'ongoing'
    )
    ''')

    # Migration: Add extra_data column if missing
    try:
        cursor.execute('SELECT extra_data FROM novels LIMIT 1')
    except sqlite3.OperationalError:
        cursor.execute('ALTER TABLE novels ADD COLUMN extra_data TEXT')

    # Migration: Add rolling_summary column if missing
    try:
        cursor.execute('SELECT rolling_summary FROM novels LIMIT 1')
    except sqlite3.OperationalError:
        cursor.execute('ALTER TABLE novels ADD COLUMN rolling_summary TEXT')

    # Chapters Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS chapters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        novel_id INTEGER,
        title TEXT,
        content TEXT,
        description TEXT,
        word_count INTEGER,
        status TEXT DEFAULT 'draft',
        order_index INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(novel_id) REFERENCES novels(id) ON DELETE CASCADE
    )
    ''')

    conn.commit()
    conn.close()

def db_save_setting(key, value):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', (key, value))
    conn.commit()
    conn.close()

def db_get_setting(key):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('SELECT value FROM settings WHERE key = ?', (key,))
    row = cursor.fetchone()
    conn.close()
    return row[0] if row else None

def db_save_script(theme, script_type, platform, content, script_id=None, metadata=None):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    if script_id:
        cursor.execute('''
        UPDATE scripts 
        SET theme=?, script_type=?, platform=?, content=?, metadata=?, created_at=CURRENT_TIMESTAMP
        WHERE id=?
        ''', (theme, script_type, platform, content, metadata, script_id))
        new_id = script_id
    else:
        cursor.execute('''
        INSERT INTO scripts (theme, script_type, platform, content, metadata)
        VALUES (?, ?, ?, ?, ?)
        ''', (theme, script_type, platform, content, metadata))
        new_id = cursor.lastrowid
        
    conn.commit()
    conn.close()
    return new_id

def db_get_history(limit=50, only_favorites=False):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    try:
        query = 'SELECT id, theme, script_type, platform, created_at, is_favorite, content, metadata FROM scripts'
        if only_favorites:
            query += ' WHERE is_favorite = 1'
        query += ' ORDER BY created_at DESC LIMIT ?'
        cursor.execute(query, (limit,))
        rows = cursor.fetchall()
        has_metadata = True
    except sqlite3.OperationalError:
        query = 'SELECT id, theme, script_type, platform, created_at, is_favorite, content FROM scripts'
        if only_favorites:
            query += ' WHERE is_favorite = 1'
        query += ' ORDER BY created_at DESC LIMIT ?'
        cursor.execute(query, (limit,))
        rows = cursor.fetchall()
        has_metadata = False

    result = []
    for r in rows:
        item = {
            'id': r[0], 'theme': r[1], 'type': r[2], 'platform': r[3], 
            'date': r[4], 'is_favorite': bool(r[5]), 'content': r[6]
        }
        if has_metadata and r[7]:
             try:
                 item['metadata'] = json.loads(r[7])
             except:
                 item['metadata'] = {}
        result.append(item)

    conn.close()
    return result

def db_toggle_favorite(script_id):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    # Get current
    cursor.execute('SELECT is_favorite FROM scripts WHERE id = ?', (script_id,))
    row = cursor.fetchone()
    if row:
        new_status = 0 if row[0] else 1
        cursor.execute('UPDATE scripts SET is_favorite = ? WHERE id = ?', (new_status, script_id))
        conn.commit()
        conn.close()
        return new_status
    conn.close()
    return 0

def db_delete_script(script_id):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('DELETE FROM scripts WHERE id = ?', (script_id,))
    conn.commit()
    conn.close()

# --- Novel Management Functions ---

def db_get_novels():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM novels ORDER BY updated_at DESC')
    rows = cursor.fetchall()
    novels = [dict(row) for row in rows]
    conn.close()
    return novels

def db_get_novel(novel_id):
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM novels WHERE id = ?', (novel_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def db_save_novel(data):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    import json
    extra_data = data.get('extra_data')
    if isinstance(extra_data, (dict, list)):
        extra_data = json.dumps(extra_data)

    if 'id' in data and data['id']:
        cursor.execute('''
        UPDATE novels 
        SET title=?, description=?, genre=?, cover_image=?, extra_data=?, rolling_summary=?, status=?, updated_at=CURRENT_TIMESTAMP
        WHERE id=?
        ''', (
            data.get('title'), 
            data.get('description'), 
            data.get('genre'), 
            data.get('cover_image'), 
            extra_data,
            data.get('rolling_summary'),
            data.get('status', 'ongoing'), 
            data['id']
        ))
        novel_id = data['id']
    else:
        cursor.execute('''
        INSERT INTO novels (title, description, genre, cover_image, extra_data, rolling_summary, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('title'), 
            data.get('description'), 
            data.get('genre'), 
            data.get('cover_image'), 
            extra_data,
            data.get('rolling_summary'),
            data.get('status', 'ongoing')
        ))
        novel_id = cursor.lastrowid
        
    conn.commit()
    conn.close()
    return novel_id

def db_delete_novel(novel_id):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    # Cascade delete chapters handled by FOREIGN KEY if enabled, but let's be safe
    cursor.execute('DELETE FROM chapters WHERE novel_id = ?', (novel_id,))
    cursor.execute('DELETE FROM novels WHERE id = ?', (novel_id,))
    conn.commit()
    conn.close()

# --- Chapter Management Functions ---

def db_get_chapters(novel_id):
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM chapters WHERE novel_id = ? ORDER BY order_index ASC, id ASC', (novel_id,))
    rows = cursor.fetchall()
    chapters = [dict(row) for row in rows]
    conn.close()
    return chapters

def db_get_chapter(chapter_id):
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM chapters WHERE id = ?', (chapter_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def db_save_chapter(data):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    if 'id' in data and data['id']:
        cursor.execute('''
        UPDATE chapters 
        SET title=?, content=?, description=?, word_count=?, status=?, order_index=?, updated_at=CURRENT_TIMESTAMP
        WHERE id=?
        ''', (
            data.get('title'), 
            data.get('content'), 
            data.get('description'), 
            data.get('word_count'), 
            data.get('status', 'draft'),
            data.get('order_index', 0),
            data['id']
        ))
        chapter_id = data['id']
    else:
        cursor.execute('''
        INSERT INTO chapters (novel_id, title, content, description, word_count, status, order_index)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('novel_id'), 
            data.get('title'), 
            data.get('content'), 
            data.get('description'), 
            data.get('word_count'), 
            data.get('status', 'draft'),
            data.get('order_index', 0)
        ))
        chapter_id = cursor.lastrowid
        
    conn.commit()
    conn.close()
    return chapter_id

def db_delete_chapter(chapter_id):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('DELETE FROM chapters WHERE id = ?', (chapter_id,))
    conn.commit()
    conn.close()
