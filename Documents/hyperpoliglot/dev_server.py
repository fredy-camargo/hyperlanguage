# dev_server.py - Servidor local ligero para el Hyperpolyglot PWA
import http.server
import socketserver
import socket
import sys

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
    })

    print("==================================================================")
    print("      HYPERPOLYGLOT HARNESS - SERVIDOR LOCAL DE DESARROLLO        ")
    print("==================================================================")
    print(f"Servidor iniciado localmente en: http://localhost:{PORT}")
    print(f"Para verlo desde tu Android / iOS / Laptop, abre en el navegador:")
    print(f"--> http://{local_ip}:{PORT}")
    print("==================================================================")
    print("Presiona Ctrl+C para detener el servidor.")

    try:
        with socketserver.TCPServer(("", PORT), handler) as httpd:
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor detenido por el usuario.")
        sys.exit(0)
    except Exception as e:
        print(f"\nError al iniciar el servidor: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
