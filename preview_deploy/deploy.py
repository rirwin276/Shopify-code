"""Serve the design review and update only the dedicated unpublished theme.

This deployer updates only the named unpublished trial theme. It cannot publish a theme.
"""
from __future__ import annotations

import json
import os
import threading
import time
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
THEME_ID = "166579110138"
THEME_NAME = "Anonymous Store Builder Preview"
STATE = {"status": "starting", "full_store_trial_enabled": True}


def shopify(method, path, payload=None):
    shop = os.environ["SHOP"].strip().removeprefix("https://").rstrip("/")
    version = os.getenv("API_VERSION", "2025-04").strip()
    req = urllib.request.Request(
        f"https://{shop}/admin/api/{version}/{path}",
        data=json.dumps(payload).encode() if payload is not None else None,
        headers={"X-Shopify-Access-Token": os.environ["CLIENT_SECRET"].strip(),
                 "Content-Type": "application/json"}, method=method,
    )
    for attempt in range(5):
        try:
            with urllib.request.urlopen(req, timeout=60) as response:
                return json.loads(response.read())
        except urllib.error.HTTPError as exc:
            if exc.code == 429 and attempt < 4:
                time.sleep(min(20, 2 ** (attempt + 1)))
                continue
            raise RuntimeError(f"Shopify update failed with HTTP {exc.code}") from None


def update_preview():
    try:
        theme = shopify("GET", f"themes/{THEME_ID}.json")["theme"]
        if theme.get("role") != "unpublished" or theme.get("name") != THEME_NAME:
            raise RuntimeError("The dedicated preview theme identity or role changed; stopped.")
        entries = json.loads((ROOT / "assets.json").read_text())
        STATE.update(status="updating_unpublished_theme", total=len(entries), updated=0)
        for entry in entries:
            # Check again before every write: never modify a newly published theme.
            theme = shopify("GET", f"themes/{THEME_ID}.json")["theme"]
            if theme.get("role") != "unpublished":
                raise RuntimeError("Preview theme is no longer unpublished; stopped.")
            shopify("PUT", f"themes/{THEME_ID}/assets.json", {"asset": entry})
            STATE["updated"] += 1
            time.sleep(1.1)
        STATE.update(status="ready", theme_id=THEME_ID,
                     preview_url=f"https://stellasageco.com/pages/request-storefront-form?view=start-team-store&preview_theme_id={THEME_ID}")
    except Exception as exc:
        STATE.update(status="failed", error=str(exc)[:200])
    print(json.dumps(STATE), flush=True)


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        path = self.path.split("?", 1)[0]
        if path == "/healthz":
            body, kind = b"ok", "text/plain"
        elif path == "/status":
            body, kind = json.dumps(STATE).encode(), "application/json"
        elif path == "/try":
            body, kind = (ROOT / "try.html").read_bytes(), "text/html; charset=utf-8"
        elif path in {"/", "/waiting-room"}:
            body, kind = (ROOT / "waiting-room.html").read_bytes(), "text/html; charset=utf-8"
        else:
            self.send_error(404)
            return
        self.send_response(200)
        self.send_header("Content-Type", kind)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Robots-Tag", "noindex, nofollow")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    threading.Thread(target=update_preview, daemon=True).start()
    ThreadingHTTPServer(("0.0.0.0", int(os.getenv("PORT", "8080"))), Handler).serve_forever()
