# dev_server.py - Servidor local ligero para el PolyglotLab PWA
import http.server
import socketserver
import socket
import sys
import urllib.parse
import tempfile
import os
import asyncio
import edge_tts
import base64
import json

PORT = 8000

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except Exception:
        return "127.0.0.1"

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_GET(self):
        if self.path.startswith('/api/tts'):
            self.handle_api_tts()
        elif self.path.startswith('/api/silence'):
            self.handle_api_silence()
        elif self.path.startswith('/exports/'):
            self.handle_get_export()
        else:
            super().do_GET()

    def handle_get_export(self):
        try:
            filename = os.path.basename(urllib.parse.urlparse(self.path).path)
            exports_dir = os.path.abspath(os.path.join(os.getcwd(), "exports"))
            file_path = os.path.abspath(os.path.join(exports_dir, filename))
            
            if not file_path.startswith(exports_dir):
                self.send_error(403, "Access denied")
                return
                
            if not os.path.exists(file_path):
                self.send_error(404, "Export file not found")
                return
                
            with open(file_path, 'rb') as f:
                zip_data = f.read()
                
            self.send_response(200)
            self.send_header('Content-Type', 'application/zip')
            self.send_header('Content-Disposition', f'attachment; filename="{filename}"')
            self.send_header('Content-Length', str(len(zip_data)))
            self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
            self.end_headers()
            self.wfile.write(zip_data)
        except Exception as e:
            print(f"Error serving export: {e}")
            self.send_error(500, f"Error serving file: {str(e)}")

    def handle_api_tts(self):
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
            self.send_error(400, "Text parameter is required")
            return
            
        temp_fd, temp_path = tempfile.mkstemp(suffix=".mp3")
        os.close(temp_fd)
        
        try:
            async def main_tts():
                communicate = edge_tts.Communicate(text, voice, rate=rate_str)
                await communicate.save(temp_path)
                
            asyncio.run(main_tts())
            
            with open(temp_path, 'rb') as f:
                mp3_data = f.read()
                
            self.send_response(200)
            self.send_header('Content-Type', 'audio/mpeg')
            self.send_header('Content-Length', str(len(mp3_data)))
            self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
            self.end_headers()
            self.wfile.write(mp3_data)
            
        except Exception as e:
            print(f"Error en TTS de Azure: {e}")
            self.send_error(500, f"Error generating speech: {str(e)}")
        finally:
            if os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                except Exception:
                    pass

    def handle_api_silence(self):
        query = urllib.parse.urlparse(self.path).query
        params = urllib.parse.parse_qs(query)
        duration_str = params.get('duration', ['3.5'])[0]
        
        try:
            duration = float(duration_str)
        except ValueError:
            duration = 3.5
            
        assets_dir = os.path.join(os.getcwd(), "assets")
        s25_path = os.path.join(assets_dir, "silence_2_5s.mp3")
        s10_path = os.path.join(assets_dir, "silence_1s.mp3")
        s05_path = os.path.join(assets_dir, "silence_500ms.mp3")
        
        mp3_data = b""
        
        # Intentar responder con silencios digitales puros si están disponibles en assets
        if duration == 3.5 and os.path.exists(s25_path) and os.path.exists(s10_path):
            try:
                with open(s25_path, 'rb') as f:
                    mp3_data += f.read()
                with open(s10_path, 'rb') as f:
                    mp3_data += f.read()
            except Exception as e:
                print(f"Error leyendo silencios de assets: {e}")
                mp3_data = b""
        elif duration == 3.0 and os.path.exists(s25_path) and os.path.exists(s05_path):
            try:
                with open(s25_path, 'rb') as f:
                    mp3_data += f.read()
                with open(s05_path, 'rb') as f:
                    mp3_data += f.read()
            except Exception as e:
                print(f"Error leyendo silencios de assets: {e}")
                mp3_data = b""
                
        # Fallback a la generación SSML de Edge TTS si no hay archivos locales de silencio
        if not mp3_data:
            duration_ms = int(duration * 1000)
            voice = params.get('voice', ['en-US-JennyNeural'])[0]
            injected_text = f'</prosody><break time="{duration_ms}ms"/><prosody>'
            
            temp_fd, temp_path = tempfile.mkstemp(suffix=".mp3")
            os.close(temp_fd)
            
            try:
                async def main_silence():
                    communicate = edge_tts.Communicate(text=injected_text, voice=voice)
                    await communicate.save(temp_path)
                    
                asyncio.run(main_silence())
                
                with open(temp_path, 'rb') as f:
                    mp3_data = f.read()
            except Exception as e:
                print(f"Error generando silencio dinámico: {e}")
                self.send_error(500, f"Error generating silence: {str(e)}")
                return
            finally:
                if os.path.exists(temp_path):
                    try:
                        os.remove(temp_path)
                    except Exception:
                        pass
                        
        try:
            self.send_response(200)
            self.send_header('Content-Type', 'audio/mpeg')
            self.send_header('Content-Length', str(len(mp3_data)))
            self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
            self.end_headers()
            self.wfile.write(mp3_data)
        except Exception as e:
            print(f"Error enviando silencio: {e}")

    def do_POST(self):
        if self.path.startswith('/api/download-helper'):
            self.handle_api_download_helper()
        elif self.path.startswith('/api/save-export'):
            self.handle_api_save_export()
        else:
            self.send_error(501, "Unsupported method")

    def handle_api_save_export(self):
        try:
            query = urllib.parse.urlparse(self.path).query
            params = urllib.parse.parse_qs(query)
            filename = params.get('filename', ['export.zip'])[0]
            
            # Sanitizar el nombre del archivo para evitar vulnerabilidad Path Traversal
            filename = os.path.basename(filename)
            
            content_length = int(self.headers['Content-Length'])
            binary_data = self.rfile.read(content_length)
            
            # 1. Guardar en la carpeta exports del proyecto
            exports_dir = os.path.join(os.getcwd(), "exports")
            os.makedirs(exports_dir, exist_ok=True)
            
            file_path = os.path.join(exports_dir, filename)
            with open(file_path, 'wb') as f:
                f.write(binary_data)
                
            # 2. Copiar directamente a la carpeta de Descargas del sistema del usuario
            try:
                downloads_dir = os.path.join(os.path.expanduser('~'), 'Downloads')
                if os.path.exists(downloads_dir):
                    user_download_path = os.path.join(downloads_dir, filename)
                    with open(user_download_path, 'wb') as f:
                        f.write(binary_data)
                    print(f"System Save: Archivo exportado guardado directamente en Descargas: {user_download_path}")
            except Exception as dl_err:
                print(f"Advertencia: No se pudo escribir en la carpeta de descargas del usuario: {dl_err}")
                
            response_data = json.dumps({
                "success": True,
                "url": f"/exports/{filename}",
                "filepath": file_path
            })
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(response_data)))
            self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
            self.end_headers()
            self.wfile.write(response_data.encode('utf-8'))
        except Exception as e:
            print(f"Error en save-export: {e}")
            self.send_error(500, f"Error saving export: {str(e)}")

    def handle_api_download_helper(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            # Decodificar el post data
            params = urllib.parse.parse_qs(post_data.decode('utf-8'))
            
            filename = params.get('filename', ['download.zip'])[0]
            base64_data = params.get('data', [''])[0]
            
            # Decodificar el ZIP en binario
            zip_bytes = base64.b64decode(base64_data)
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/zip')
            self.send_header('Content-Disposition', f'attachment; filename="{filename}"')
            self.send_header('Content-Length', str(len(zip_bytes)))
            self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
            self.end_headers()
            self.wfile.write(zip_bytes)
        except Exception as e:
            print(f"Error en download-helper: {e}")
            self.send_error(500, f"Error processing download: {str(e)}")

def main():
    local_ip = get_local_ip()
    handler = CustomHandler
    
    handler.extensions_map.update({
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.zip': 'application/zip',
    })

    print("==================================================================")
    print("            POLYGLOTLAB - SERVIDOR LOCAL DE DESARROLLO            ")
    print("==================================================================")
    print(f"Servidor iniciado localmente en: http://localhost:{PORT}")
    print(f"Para verlo desde tu Android / iOS / Laptop, abre en el navegador:")
    print(f"--> http://{local_ip}:{PORT}")
    print("==================================================================")
    print("Presiona Ctrl+C para detener el servidor.")

    try:
        with socketserver.ThreadingTCPServer(("", PORT), handler) as httpd:
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor detenido por el usuario.")
        sys.exit(0)
    except Exception as e:
        print(f"\nError al iniciar el servidor: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
