from http.server import BaseHTTPRequestHandler
import urllib.parse
import tempfile
import os
import re
import asyncio
import edge_tts

MAX_TEXT_LENGTH = 1000
SAFE_VOICE_RE = re.compile(r"^[a-zA-Z]{2,3}-[a-zA-Z]{2,4}-[a-zA-Z0-9]+Neural$")


def sanitize_voice(voice_raw: str) -> str:
    voice = (voice_raw or "").strip()
    if SAFE_VOICE_RE.match(voice):
        return voice
    return "en-US-JennyNeural"


class handler(BaseHTTPRequestHandler):
    def _send_security_headers(self):
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")

    def do_GET(self):
        query = urllib.parse.urlparse(self.path).query
        params = urllib.parse.parse_qs(query)

        text = params.get("text", [""])[0].strip()
        voice = sanitize_voice(params.get("voice", ["en-US-JennyNeural"])[0])
        speed_str = params.get("speed", ["1.0"])[0]

        if not text:
            self.send_response(400)
            self._send_security_headers()
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.end_headers()
            self.wfile.write(b"Text parameter is required")
            return

        if len(text) > MAX_TEXT_LENGTH:
            text = text[:MAX_TEXT_LENGTH]

        try:
            speed_val = float(speed_str)
        except ValueError:
            speed_val = 1.0
        speed_val = max(0.5, min(2.0, speed_val))

        rate_percent = int((speed_val - 1.0) * 100)
        rate_str = f"{rate_percent:+}%"

        temp_fd, temp_path = tempfile.mkstemp(suffix=".mp3")
        os.close(temp_fd)

        try:
            async def main_tts():
                communicate = edge_tts.Communicate(text, voice, rate=rate_str)
                await communicate.save(temp_path)

            asyncio.run(main_tts())

            with open(temp_path, "rb") as f:
                mp3_data = f.read()

            self.send_response(200)
            self._send_security_headers()
            self.send_header("Content-Type", "audio/mpeg")
            self.send_header("Content-Length", str(len(mp3_data)))
            self.end_headers()
            self.wfile.write(mp3_data)

        except Exception:
            self.send_response(500)
            self._send_security_headers()
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.end_headers()
            self.wfile.write(b"Error generating speech")
        finally:
            if os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                except Exception:
                    pass
