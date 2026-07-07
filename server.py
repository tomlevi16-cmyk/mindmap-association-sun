import http.server
import json
import os

PORT = 8000
DB_FILE = 'db.json'

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/api/save':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data.decode('utf-8'))
                tab_id = data.get('tabId')
                model_str = data.get('model')
                
                if tab_id and model_str is not None:
                    user_id = self.headers.get('x-user-id', 'default_user')
                    # Load existing DB
                    db_data = {}
                    if os.path.exists(DB_FILE):
                        try:
                            with open(DB_FILE, 'r', encoding='utf-8') as f:
                                raw_data = json.load(f)
                                # Detect and migrate old format
                                if 'main' in raw_data and not isinstance(raw_data['main'], dict):
                                    db_data = {'default_user': raw_data}
                                else:
                                    db_data = raw_data
                        except Exception:
                            pass
                    
                    if user_id not in db_data:
                        db_data[user_id] = {}
                        
                    # Update
                    db_data[user_id][tab_id] = model_str
                    
                    # Save DB
                    with open(DB_FILE, 'w', encoding='utf-8') as f:
                        json.dump(db_data, f, ensure_ascii=False, indent=2)
                        
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps({'status': 'success'}).encode('utf-8'))
                    return
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
                return
        
        self.send_response(400)
        self.end_headers()

    def do_GET(self):
        if self.path == '/api/load':
            user_id = self.headers.get('x-user-id', 'default_user')
            db_data = {}
            if os.path.exists(DB_FILE):
                try:
                    with open(DB_FILE, 'r', encoding='utf-8') as f:
                        raw_data = json.load(f)
                        # Detect and handle old format
                        if 'main' in raw_data and not isinstance(raw_data['main'], dict):
                            if user_id == 'default_user':
                                db_data = raw_data
                        else:
                            db_data = raw_data.get(user_id, {})
                except Exception:
                    pass
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(db_data).encode('utf-8'))
            return
            
        # Fallback to serving static files
        super().do_GET()

if __name__ == '__main__':
    # Force the working directory to be the directory containing this script
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    server_address = ('', PORT)
    httpd = http.server.HTTPServer(server_address, CustomHandler)
    print(f"Server running on port {PORT} with local database persistence...")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
