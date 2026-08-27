from __future__ import annotations

import base64
import json
import os
import threading
import time
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


ROOT = Path(__file__).resolve().parent
ZIP_PATH = ROOT / "theme-preview.zip"
STATE = {"status": "starting"}


def _decode_zip() -> None:
    chunks = []
    for path in sorted(ROOT.glob("theme.b64.*")):
        chunks.append(path.read_text(encoding="ascii"))
    if not chunks:
        raise RuntimeError("Theme package chunks are missing")
    ZIP_PATH.write_bytes(base64.b64decode("".join(chunks)))


class Handler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        if self.path == "/healthz":
            self.send_response(200)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()
            self.wfile.write(b"ok")
            return
        if self.path == "/status":
            body = json.dumps(STATE).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        if self.path == "/theme-preview.zip" and ZIP_PATH.exists():
            body = ZIP_PATH.read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", "application/zip")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        self.send_error(404)

    def log_message(self, _format: str, *_args: object) -> None:
        return


def _shopify_request(method: str, path: str, body: dict | None = None) -> dict:
    shop = os.environ["SHOP"].strip().replace("https://", "").rstrip("/")
    version = os.getenv("API_VERSION", "2025-04").strip()
    token = os.environ["CLIENT_SECRET"].strip()
    url = f"https://{shop}/admin/api/{version}/{path.lstrip('/')}"
    data = json.dumps(body).encode("utf-8") if body is not None else None
    request = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": token,
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=90) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:1000]
        raise RuntimeError(f"Shopify API returned {exc.code}: {detail}") from exc


def _create_preview_theme() -> None:
    try:
        domain = os.environ["RAILWAY_PUBLIC_DOMAIN"].strip()
        source = f"https://{domain}/theme-preview.zip"
        STATE.update({"status": "creating_theme"})
        result = _shopify_request(
            "POST",
            "themes.json",
            {
                "theme": {
                    "name": "Anonymous Store Builder Preview",
                    "role": "unpublished",
                    "src": source,
                }
            },
        )
        theme = result.get("theme") or {}
        theme_id = str(theme.get("id") or "")
        if not theme_id:
            raise RuntimeError("Shopify did not return a preview theme ID")
        STATE.update({"status": "processing", "theme_id": theme_id})

        for _ in range(90):
            current = (_shopify_request("GET", f"themes/{theme_id}.json").get("theme") or {})
            if not current.get("processing", False):
                STATE.update(
                    {
                        "status": "ready",
                        "theme_id": theme_id,
                        "preview_url": (
                            "https://stellasageco.com/pages/storefront"
                            f"?preview_theme_id={theme_id}"
                        ),
                    }
                )
                return
            time.sleep(4)
        raise RuntimeError("Shopify did not finish processing the preview theme")
    except Exception as exc:
        STATE.update({"status": "failed", "error": str(exc)[:1200]})


def main() -> None:
    _decode_zip()
    port = int(os.getenv("PORT", "8080"))
    server = ThreadingHTTPServer(("0.0.0.0", port), Handler)
    threading.Thread(target=_create_preview_theme, daemon=True).start()
    STATE.update({"status": "serving_package"})
    server.serve_forever()


if __name__ == "__main__":
    main()
