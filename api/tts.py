from http.server import BaseHTTPRequestHandler
import urllib.parse
import tempfile
import os
import asyncio
import edge_tts

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        query = urllib.parse.urlparse(self.path).query
        params = urllib.parse.parse_qs(query)
        
        text = params.get('text', [''])[0]
        voice = params.get('voice', ['en-US-JennyNeural'])[0]
        speed_str = params.get('speed', ['1.0'])[0]
        
        try:
            speed_val = float(speed_str)
        except ValueError:
            speed_val = 1.0
            
        rate_percent = int((speed_val - 1.0) * 100)
        rate_str = f"{rate_percent:+}%"
        
        if not text.strip():
            self.send_response(400)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(b"Text parameter is required")
            return
            
        temp_fd, temp_path = tempfile.mkstemp(suffix=".mp3")
        os.close(temp_fd)
        
        try:
            async def main_tts():
                communicate = edge_tts.Communicate(text, voice, rate=rate_str)
                await communicate.save(temp_path)
                
            try:
                loop = asyncio.get_event_loop()
            except RuntimeError:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
            
            if loop.is_running():
                future = asyncio.ensure_future(main_tts(), loop=loop)
                loop.run_until_complete(future)
            else:
                loop.run_until_complete(main_tts())
            
            with open(temp_path, 'rb') as f:
                mp3_data = f.read()
                
            self.send_response(200)
            self.send_header('Content-type', 'audio/mpeg')
            self.send_header('Content-Length', str(len(mp3_data)))
            self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
            self.end_headers()
            self.wfile.write(mp3_data)
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(f"Error generating speech: {str(e)}".encode('utf-8'))
        finally:
            if os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                except Exception:
                    pass
