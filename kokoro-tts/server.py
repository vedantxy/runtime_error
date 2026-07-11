import json
import os
import io
import logging
from http.server import HTTPServer, BaseHTTPRequestHandler
from tts import get_kokoro_model

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("KokoroServer")

class KokoroRequestHandler(BaseHTTPRequestHandler):
    def _set_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def do_OPTIONS(self):
        self.send_response(200)
        self._set_cors_headers()
        self.end_headers()

    def do_POST(self):
        if self.path in ['/v1/audio/speech', '/api/tts']:
            try:
                # Read content length
                content_length = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(content_length)
                data = json.loads(body)
                
                # Support both OpenAI standard 'input' and custom backend 'text' fields
                text = data.get('input', data.get('text', ''))
                voice = data.get('voice', 'af_sarah')
                
                if not text:
                    self.send_response(400)
                    self._set_cors_headers()
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({"error": "Missing input text"}).encode())
                    return
                
                logger.info(f"Generating speech for: '{text[:40]}...' using voice: '{voice}'")
                
                # Get Kokoro ONNX model instance (Singleton cached)
                kokoro = get_kokoro_model()
                
                # Synthesize
                samples, sample_rate = kokoro.create(
                    text=text,
                    voice=voice,
                    speed=1.0,
                    lang="en-us"
                )
                
                # Output to in-memory WAV buffer
                import soundfile as sf
                wav_buffer = io.BytesIO()
                sf.write(wav_buffer, samples, sample_rate, format='WAV', subtype='PCM_16')
                wav_bytes = wav_buffer.getvalue()
                
                # Send response headers
                self.send_response(200)
                self._set_cors_headers()
                self.send_header('Content-Type', 'audio/wav')
                self.send_header('Content-Length', str(len(wav_bytes)))
                self.end_headers()
                self.wfile.write(wav_bytes)
                logger.info("Speech audio successfully generated and served.")
            except Exception as e:
                logger.error(f"Error serving speech request: {e}", exc_info=True)
                self.send_response(500)
                self._set_cors_headers()
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode())
        else:
            self.send_response(404)
            self._set_cors_headers()
            self.end_headers()

def run_server(port=8880):
    server_address = ('', port)
    httpd = HTTPServer(server_address, KokoroRequestHandler)
    logger.info(f"Starting local Kokoro TTS API Server on: http://localhost:{port}...")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        logger.info("Stopping Kokoro TTS API Server...")
        httpd.server_close()

if __name__ == '__main__':
    run_server()
