import sqlite3
import os

DB_FILE = "scripts.db"

if not os.path.exists(DB_FILE):
    print("Database file NOT found!")
else:
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        
        print("Checking 'settings' table...")
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='settings';")
        if not cursor.fetchone():
            print("Table 'settings' does NOT exist.")
        else:
            cursor.execute("SELECT key, value FROM settings")
            rows = cursor.fetchall()
            if not rows:
                print("Table 'settings' is EMPTY.")
            else:
                for key, val in rows:
                    if key == 'api_key':
                        masked_val = f"{val[:5]}...{val[-4:]}" if val and len(val) > 10 else "Too short/Empty"
                        print(f"Found setting: {key} = {masked_val}")
                    else:
                        print(f"Found setting: {key} = {val}")
                
        conn.close()
    except Exception as e:
        print(f"Error: {e}")
