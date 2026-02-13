import http.server
import socketserver
import json
import urllib.request
import urllib.error
import os
import sys
import webbrowser
import threading
import time
import webview

# Refactored Imports
from db_manager import init_db, db_save_setting, db_get_setting, db_save_script, db_get_history, db_toggle_favorite, db_delete_script
from export_manager import convert_to_docx, convert_to_xlsx

# Server Configuration
PORT = int(os.getenv('PORT', 5173))
VERSION = "v2.1.1"
# Use the compatible-mode endpoint which supports both VL and Text models
TARGET_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"
# Image Gen Endpoint (Flux via DashScope)
IMAGE_GEN_URL = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis"

def get_base_path():
    if getattr(sys, 'frozen', False):
        # Running in a bundle
        return sys._MEIPASS
    else:
        # Running in a normal Python environment
        return os.path.dirname(os.path.abspath(__file__))

# --- Database & Export functions imported from db_manager.py and export_manager.py ---

def open_browser():
    time.sleep(1) # Wait a bit for server to start
    webbrowser.open(f"http://localhost:{PORT}")

class ProxyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/api/settings/apikey/check':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            key = db_get_setting('api_key')
            self.wfile.write(json.dumps({'exists': bool(key)}).encode())
            return

        if self.path == '/api/info':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'version': VERSION, 'port': PORT, 'status': 'online'}).encode())
            return
            
        if self.path == '/health':
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"OK")
            return
            
        # --- Novel Management Endpoints (GET) ---
        from db_manager import db_get_novels, db_get_novel, db_get_chapters, db_get_chapter

        if self.path == '/api/novels':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            novels = db_get_novels()
            self.wfile.write(json.dumps(novels).encode())
            return

        if self.path.startswith('/api/novels/') and '/chapters' in self.path:
            # Format: /api/novels/<id>/chapters
            try:
                parts = self.path.split('/')
                novel_id = int(parts[3])
                chapters = db_get_chapters(novel_id)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(chapters).encode())
            except (IndexError, ValueError):
                self.send_error(400, "Invalid novel ID")
            return

        if self.path.startswith('/api/novels/'):
            # Format: /api/novels/<id>
            try:
                novel_id = int(self.path.split('/')[-1])
                novel = db_get_novel(novel_id)
                if novel:
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps(novel).encode())
                else:
                    self.send_error(404, "Novel not found")
            except ValueError:
                self.send_error(400, "Invalid novel ID")
            return

        if self.path.startswith('/api/chapters/'):
            # Format: /api/chapters/<id>
            try:
                chapter_id = int(self.path.split('/')[-1])
                chapter = db_get_chapter(chapter_id)
                if chapter:
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps(chapter).encode())
                else:
                    self.send_error(404, "Chapter not found")
            except ValueError:
                self.send_error(400, "Invalid chapter ID")
            return

        if self.path.startswith('/api/history'):
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            history = db_get_history()
            self.wfile.write(json.dumps(history).encode())
            return
            
        if self.path.lower().startswith('/91writing/'):
            try:
                # Extract relative path
                rel_path = self.path[len('/91writing/'):]
                if self.path.startswith('/91Writing/'):
                     rel_path = self.path[len('/91Writing/'):]

                if not rel_path or rel_path == '/':
                    rel_path = 'index.html'
                
                # Handle 'dist/' prefix (support direct linking to dist)
                if rel_path.startswith('dist/'):
                    rel_path = rel_path[5:]
                elif rel_path.startswith('/dist/'):
                    rel_path = rel_path[6:]
                
                # Security: prevent directory traversal
                if '..' in rel_path:
                    self.send_error(403, "Forbidden")
                    return

                # Construct full path
                base_path = get_base_path()
                
                # 处理Vue.js构建后的文件路径
                if rel_path == 'index.html':
                    file_path = os.path.join(base_path, '91Writing', 'dist', 'index.html')
                    print(f"[DEBUG] 91Writing index.html request - using dist version: {file_path}")
                elif rel_path.startswith('assets/'):
                    # 构建后的资源文件
                    file_path = os.path.join(base_path, '91Writing', 'dist', rel_path)
                elif rel_path.startswith('src/'):
                    # 源码路径重定向到构建后的文件
                    # Vue构建后会将src/main.js打包到assets目录
                    if rel_path == 'src/main.js':
                        # 查找构建后的JS文件
                        assets_dir = os.path.join(base_path, '91Writing', 'dist', 'assets')
                        print(f"[DEBUG] 91Writing src/main.js request - looking for built version in: {assets_dir}")
                        if os.path.exists(assets_dir):
                            for file in os.listdir(assets_dir):
                                if file.startswith('index-') and file.endswith('.js'):
                                    file_path = os.path.join(assets_dir, file)
                                    print(f"[DEBUG] Found built JS file: {file_path}")
                                    break
                            else:
                                print(f"[ERROR] No built JS file found in assets directory")
                                self.send_error(404, "Built JS file not found")
                                return
                        else:
                            print(f"[ERROR] Assets directory not found: {assets_dir}")
                            self.send_error(404, "Assets directory not found")
                            return
                    else:
                        print(f"[DEBUG] 91Writing src/{rel_path} request - rejecting source file access")
                        self.send_error(404, "Source files not available in production")
                        return
                else:
                    # 其他文件按正常路径处理
                    file_path = os.path.join(base_path, '91Writing', 'dist', *rel_path.split('/'))
                
                print(f"[INFO] Serving 91Writing file: {rel_path} -> {file_path}")
                
                # Serve file if exists
                if os.path.exists(file_path) and os.path.isfile(file_path):
                    print(f"[DEBUG] File exists, serving: {file_path}")
                    self.send_response(200)
                    ctype = self.guess_type(file_path)
                    self.send_header('Content-Type', ctype)
                    self.end_headers()
                    with open(file_path, 'rb') as f:
                        content = f.read()
                        if rel_path == 'index.html':
                            content_str = content.decode('utf-8', errors='ignore')
                            print(f"[DEBUG] index.html content preview: {content_str[:200]}...")
                        self.wfile.write(content)
                    return
                else:
                    print(f"[ERROR] 91Writing file not found: {file_path}")
                    self.send_error(404, "File not found")
                    return
            except Exception as e:
                print(f"[ERROR] Serving 91Writing failed: {e}")
                self.send_error(500, str(e))
                return

        super().do_GET()

    def do_POST(self):
        print(f"[INFO] Received POST request: {self.path}")

        if self.path == '/api/settings/apikey':
            try:
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode())
                api_key = data.get('api_key')
                if api_key:
                    db_save_setting('api_key', api_key)
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'status': 'ok'}).encode())
                else:
                    self.send_error(400, "Missing api_key")
            except Exception as e:
                self.send_error(500, str(e))
            return

        if self.path == '/api/scripts/save':
            try:
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode())
                
                # Robust extraction with defaults
                script_id = data.get('id')
                theme = data.get('theme', 'Untitled')
                script_type = data.get('type', data.get('script_type', 'unknown')) # Handle 'type' or 'script_type'
                platform = data.get('platform', 'unknown')
                content = data.get('content', '')
                metadata = json.dumps(data.get('metadata', {})) if data.get('metadata') else None

                new_id = db_save_script(theme, script_type, platform, content, script_id, metadata)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'id': new_id}).encode())
            except Exception as e:
                print(f"[ERROR] Save Script Failed: {e}")
                self.send_error(500, str(e))
            return
            
        if self.path == '/api/scripts/favorite':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode())
            new_status = db_toggle_favorite(data['id'])
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'is_favorite': new_status}).encode())
            return

        if self.path == '/api/scripts/delete':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode())
            db_delete_script(data['id'])
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'ok'}).encode())
            return

        if self.path == '/api/export/docx':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode())
            bio = convert_to_docx(data['content'])
            self.send_response(200)
            self.send_header('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
            self.send_header('Content-Disposition', f'attachment; filename="script.docx"')
            self.end_headers()
            self.wfile.write(bio.read())
            return

        if self.path == '/api/export/xlsx':
            try:
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode())
                bio = convert_to_xlsx(data['content'])
                self.send_response(200)
                self.send_header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
                self.send_header('Content-Disposition', f'attachment; filename="script.xlsx"')
                self.end_headers()
                self.wfile.write(bio.read())
            except Exception as e:
                print(f"[ERROR] Excel Export Failed: {e}")
                self.send_error(500, str(e))
            return
            
        # --- Novel Management Endpoints ---
        from db_manager import db_save_novel, db_delete_novel, db_save_chapter, db_delete_chapter

        if self.path == '/api/novels/save':
            try:
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode())
                
                novel_id = db_save_novel(data)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'id': novel_id}).encode())
            except Exception as e:
                print(f"[ERROR] Save Novel Failed: {e}")
                self.send_error(500, str(e))
            return

        if self.path == '/api/novels/delete':
            try:
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode())
                
                db_delete_novel(data['id'])
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'ok'}).encode())
            except Exception as e:
                print(f"[ERROR] Delete Novel Failed: {e}")
                self.send_error(500, str(e))
            return

        if self.path == '/api/chapters/save':
            try:
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode())
                
                chapter_id = db_save_chapter(data)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'id': chapter_id}).encode())
            except Exception as e:
                print(f"[ERROR] Save Chapter Failed: {e}")
                self.send_error(500, str(e))
            return

        if self.path == '/api/chapters/delete':
            try:
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode())
                
                db_delete_chapter(data['id'])
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'ok'}).encode())
            except Exception as e:
                print(f"[ERROR] Delete Chapter Failed: {e}")
                self.send_error(500, str(e))
            return

        if self.path == '/api/proxy/image':
            try:
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode())
                
                # Get API Key
                auth_header = self.headers.get('Authorization', '')
                if not auth_header or 'Bearer null' in auth_header:
                    stored_key = db_get_setting('api_key')
                    if stored_key:
                        auth_header = f'Bearer {stored_key}'
                
                # Helper function to try generation
                def try_generate(model_name):
                    print(f"Trying image generation with model: {model_name}")
                    payload = {
                        "model": model_name,
                        "input": {
                            "prompt": data.get('prompt')
                        },
                        "parameters": {
                            "size": "1024*1024", # Wanx supports 1024*1024
                            "n": 1
                        }
                    }
                    
                    req = urllib.request.Request(IMAGE_GEN_URL, data=json.dumps(payload).encode(), method='POST')
                    req.add_header('Content-Type', 'application/json')
                    req.add_header('Authorization', auth_header)
                    req.add_header('X-DashScope-Async', 'enable')
                    
                    with urllib.request.urlopen(req) as response:
                        task_res = json.loads(response.read())
                        task_id = task_res.get('output', {}).get('task_id')
                        return task_id

                # Try Flux first, then fallback to Wanx
                task_id = None
                try:
                    task_id = try_generate("flux-merge") # Try flux-merge instead of schnell
                except urllib.error.HTTPError as e:
                    print(f"Flux generation failed: {e}")
                    if e.code == 403 or e.code == 400: # Forbidden or Bad Request (model not found)
                        print("Falling back to wanx-v1...")
                        task_id = try_generate("wanx-v1")
                    else:
                        raise e
                except Exception as e:
                     print(f"Flux error: {e}")
                     print("Falling back to wanx-v1...")
                     task_id = try_generate("wanx-v1")

                if not task_id:
                    raise Exception("Failed to get task_id")
                    
                # Poll for result
                import time
                for _ in range(120): # Wait up to 120s (2 minutes)
                    time.sleep(1)
                    task_url = f"https://dashscope.aliyuncs.com/api/v1/tasks/{task_id}"
                    task_req = urllib.request.Request(task_url)
                    task_req.add_header('Authorization', auth_header)
                    
                    with urllib.request.urlopen(task_req) as tr:
                        task_data = json.loads(tr.read())
                        status = task_data['output']['task_status']
                        if status == 'SUCCEEDED':
                            # Found image
                            img_url = task_data['output']['results'][0]['url']
                            self.send_response(200)
                            self.send_header('Content-Type', 'application/json')
                            self.end_headers()
                            self.wfile.write(json.dumps({'url': img_url}).encode())
                            return
                        elif status in ['FAILED', 'CANCELED']:
                            raise Exception(f"Task failed: {task_data['output'].get('message', 'Unknown error')}")
                            
                raise Exception("Image generation timed out")

            except urllib.error.HTTPError as e:
                print(f"[ERROR] Image Gen HTTP Error: {e.code} - {e.reason}")
                self.send_error(e.code, f"Upstream Error: {e.reason}")
            except Exception as e:
                print(f"[ERROR] Image Gen Error: {e}")
                self.send_error(500, str(e))
            return

        if self.path == '/api/proxy':
            try:
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                
                # Handle API Key injection
                auth_header = self.headers.get('Authorization', '')
                if not auth_header or 'Bearer null' in auth_header or 'Bearer undefined' in auth_header or 'Bearer internal' in auth_header:
                    # Try to get from DB
                    stored_key = db_get_setting('api_key')
                    if stored_key:
                        auth_header = f'Bearer {stored_key}'
                    else:
                        print("Warning: No API Key found in header or DB")

                # Forward headers
                headers = {
                    'Content-Type': 'application/json',
                    'Authorization': auth_header
                }
                
                req = urllib.request.Request(TARGET_URL, data=post_data, headers=headers, method='POST')
                
                with urllib.request.urlopen(req, timeout=300) as response:
                    self.send_response(response.status)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(response.read())
                    
            except urllib.error.HTTPError as e:
                self.send_response(e.code)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(e.read())
            except Exception as e:
                print(f"Proxy Error: {e}")
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                response_data = json.dumps({'error': {'message': str(e)}})
                self.wfile.write(response_data.encode())
        else:
            self.send_error(404, "Endpoint not found")

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

class ThreadingHTTPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    daemon_threads = True

def start_server():
    # Set working directory to the script's directory (or bundle dir)
    base_path = get_base_path()
    os.chdir(base_path)

    print(f"Starting AI Director Server at http://localhost:{PORT}")
    print(f"Proxying requests to {TARGET_URL}")

    with ThreadingHTTPServer(("127.0.0.1", PORT), ProxyHTTPRequestHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")

if __name__ == '__main__':
    # Initialize DB on startup (ensure tables exist)
    init_db()

    # Start server in a separate thread
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()

    # Create and open the native window
    # Wait slightly to ensure server is up (though not strictly necessary as webview retries)
    time.sleep(0.5)
    
    webview.create_window(
        'AI 导演助手 - 专业版', 
        f'http://127.0.0.1:{PORT}',
        width=1280,
        height=850,
        resizable=True,
        min_size=(1024, 768)
    )
    
    webview.start()
