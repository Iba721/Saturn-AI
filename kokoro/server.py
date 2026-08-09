from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import time

import numpy as np
import torch
from kokoro import KPipeline

HOST = "127.0.0.1"
PORT = 8765
VOICE = "am_michael"

torch.set_num_threads(4)
torch.set_num_interop_threads(1)

print("🪐 Loading Kokoro...")
pipeline = KPipeline(lang_code="a")
print("🪐 Kokoro ready.")


class KokoroHandler(BaseHTTPRequestHandler):

    protocol_version = "HTTP/1.1"

    def do_POST(self):
        if self.path != "/speak":
            self.send_error(404, "Not found")
            return

        try:
            content_length = int(
                self.headers.get("Content-Length", 0)
            )

            body = self.rfile.read(content_length)

            data = json.loads(body)
            text = str(data.get("text", "")).strip()

            if not text:
                self.send_error(400, "Missing text")
                return

            print(f"🎤 Kokoro: {text}")

            generation_start = time.perf_counter()

            generator = pipeline(
                text,
                voice=VOICE,
            )

            first_chunk = True

            self.send_response(200)
            self.send_header(
                "Content-Type",
                "audio/pcm",
            )
            self.send_header(
                "Transfer-Encoding",
                "chunked",
            )
            self.send_header(
                "X-Audio-Sample-Rate",
                "24000",
            )
            self.send_header(
                "X-Audio-Channels",
                "1",
            )
            self.send_header(
                "X-Audio-Bit-Depth",
                "16",
            )
            self.send_header(
                "Access-Control-Allow-Origin",
                "*",
            )
            self.end_headers()

            for _, _, audio in generator:

                if first_chunk:
                    elapsed = (
                        time.perf_counter()
                        - generation_start
                    )

                    print(
                        f"⚡ First audio chunk generated in "
                        f"{elapsed:.3f}s"
                    )

                    first_chunk = False

                audio = np.asarray(audio)

                # Kokoro audio is float32.
                # Convert to signed 16-bit PCM.
                audio = np.clip(
                    audio,
                    -1.0,
                    1.0,
                )

                pcm = (
                    audio * 32767
                ).astype(np.int16)

                chunk = pcm.tobytes()

                if not chunk:
                    continue

                # HTTP/1.1 chunked transfer encoding.
                self.wfile.write(
                    f"{len(chunk):X}\r\n".encode(
                        "ascii"
                    )
                )

                self.wfile.write(chunk)
                self.wfile.write(b"\r\n")
                self.wfile.flush()

                print(
                    f"🪐 Sent audio chunk: "
                    f"{len(chunk)} bytes"
                )

            # End HTTP chunked response.
            self.wfile.write(b"0\r\n\r\n")
            self.wfile.flush()

            print(
                "🪐 Kokoro streaming complete."
            )

        except Exception as error:
            print(
                "🔥 Kokoro error:",
                error,
            )

            try:
                self.send_error(
                    500,
                    str(error),
                )
            except Exception:
                pass

    def log_message(self, format, *args):
        print(
            "🌐",
            format % args,
        )


server = HTTPServer(
    (HOST, PORT),
    KokoroHandler,
)

print(
    f"🪐 Kokoro server running at "
    f"http://{HOST}:{PORT}"
)

try:
    server.serve_forever()

except KeyboardInterrupt:
    print(
        "\n🛑 Kokoro server stopped."
    )

finally:
    server.server_close()