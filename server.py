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
                    # Load existing DB
                    db_data = {}
                    if os.path.exists(DB_FILE):
                        try:
                            with open(DB_FILE, 'r', encoding='utf-8') as f:
                                db_data = json.load(f)
                        except Exception:
                            pass
                    
                    # Update
                    db_data[tab_id] = model_str
                    
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
            db_data = {}
            if os.path.exists(DB_FILE):
                try:
                    with open(DB_FILE, 'r', encoding='utf-8') as f:
                        db_data = json.load(f)
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
