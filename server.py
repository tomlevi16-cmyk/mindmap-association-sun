import http.server
import json
import os
import urllib.parse

PORT = 8000
DB_FILE = 'db.json'

def load_db():
    db_data = {}
    if os.path.exists(DB_FILE):
        try:
            with open(DB_FILE, 'r', encoding='utf-8') as f:
                db_data = json.load(f)
        except Exception:
            pass
    if 'users' not in db_data:
        db_data['users'] = {}
    return db_data

def save_db(db_data):
    with open(DB_FILE, 'w', encoding='utf-8') as f:
        json.dump(db_data, f, ensure_ascii=False, indent=2)

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length) if content_length > 0 else b'{}'
        
        try:
            req_data = json.loads(post_data.decode('utf-8'))
        except Exception:
            req_data = {}

        if self.path == '/api/register':
            username = req_data.get('username', '').strip().lower()
            password = req_data.get('password', '').strip()
            display_name = req_data.get('displayName', '').strip() or username

            if not username or not password:
                return self.send_json({'error': 'יש למלא שם משתמש וסיסמה'}, status=400)

            db_data = load_db()
            if username in db_data['users']:
                return self.send_json({'error': 'שם המשתמש כבר קיים במערכת'}, status=400)

            db_data['users'][username] = {
                'password': password,
                'displayName': display_name,
                'tabs': {}
            }
            save_db(db_data)
            return self.send_json({'status': 'success', 'username': username, 'displayName': display_name})

        elif self.path == '/api/login':
            username = req_data.get('username', '').strip().lower()
            password = req_data.get('password', '').strip()

            db_data = load_db()
            user = db_data['users'].get(username)
            if not user or user.get('password') != password:
                return self.send_json({'error': 'שם משתמש או סיסמה שגויים'}, status=400)

            return self.send_json({
                'status': 'success',
                'username': username,
                'displayName': user.get('displayName', username)
            })

        elif self.path == '/api/save':
            tab_id = req_data.get('tabId')
            model_str = req_data.get('model')
            username = req_data.get('username', '').strip().lower()

            if tab_id and model_str is not None:
                db_data = load_db()
                if username and username in db_data['users']:
                    if 'tabs' not in db_data['users'][username]:
                        db_data['users'][username]['tabs'] = {}
                    db_data['users'][username]['tabs'][tab_id] = model_str
                else:
                    db_data[tab_id] = model_str

                save_db(db_data)
                return self.send_json({'status': 'success'})

        return self.send_json({'error': 'Not found'}, status=404)

    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        if parsed_url.path == '/api/load':
            query = urllib.parse.parse_qs(parsed_url.query)
            username = query.get('username', [''])[0].strip().lower()

            db_data = load_db()
            if username and username in db_data['users']:
                user_tabs = db_data['users'][username].get('tabs', {})
                return self.send_json(user_tabs)
            else:
                # Return root level data or empty
                result = {k: v for k, v in db_data.items() if k != 'users'}
                return self.send_json(result)

        super().do_GET()

if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    server_address = ('', PORT)
    httpd = http.server.HTTPServer(server_address, CustomHandler)
    print(f"Server running on port {PORT} with multi-user database persistence...")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
