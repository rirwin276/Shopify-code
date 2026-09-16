"""Back up and update only the anonymous-trial assets on the active theme.

The original asset payload is stored on the dedicated unpublished preview theme.
Set MODE=rollback and redeploy this service to restore it.
"""
from __future__ import annotations
import json, os, threading, time, urllib.error, urllib.parse, urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT=Path(__file__).resolve().parent
PREVIEW_THEME_ID="166579110138"
PREVIEW_THEME_NAME="Anonymous Store Builder Preview"
BACKUP_KEY="assets/ss-main-anonymous-trial-backup.json"
STATE={"status":"starting","mode":os.getenv("MODE","deploy").lower()}

def shopify(method,path,payload=None):
    shop=os.environ["SHOP"].strip().removeprefix("https://").rstrip("/")
    version=os.getenv("API_VERSION","2025-04").strip()
    request=urllib.request.Request(f"https://{shop}/admin/api/{version}/{path}",data=json.dumps(payload).encode() if payload is not None else None,headers={"X-Shopify-Access-Token":os.environ["CLIENT_SECRET"].strip(),"Content-Type":"application/json"},method=method)
    for attempt in range(6):
        try:
            with urllib.request.urlopen(request,timeout=90) as response:return json.loads(response.read() or b"{}")
        except urllib.error.HTTPError as exc:
            if exc.code==429 and attempt<5:time.sleep(min(25,2**(attempt+1)));continue
            if exc.code==404:return None
            raise RuntimeError(f"Shopify {method} {path.split('?')[0]} failed with HTTP {exc.code}") from None

def themes(): return shopify("GET","themes.json")["themes"]
def exact_theme(theme_id): return shopify("GET",f"themes/{theme_id}.json")["theme"]
def main_theme():
    found=[theme for theme in themes() if theme.get("role")=="main"]
    if len(found)!=1:raise RuntimeError(f"Expected exactly one active theme, found {len(found)}")
    return found[0]
def asset(theme_id,key): return shopify("GET",f"themes/{theme_id}/assets.json?asset[key]={urllib.parse.quote(key,safe='')}")

def assert_roles(main_id):
    active=exact_theme(main_id); preview=exact_theme(PREVIEW_THEME_ID)
    if active.get("role")!="main":raise RuntimeError("Target theme is no longer active; stopped")
    if preview.get("role")!="unpublished" or preview.get("name")!=PREVIEW_THEME_NAME:raise RuntimeError("Backup theme identity or role changed; stopped")

def ensure_backup(main):
    entries=json.loads((ROOT/"assets.json").read_text())
    existing=asset(PREVIEW_THEME_ID,BACKUP_KEY)
    if existing and ((existing.get("asset") or {}).get("value")):
        data=json.loads(existing["asset"]["value"])
        if str(data.get("main_theme_id"))!=str(main["id"]):raise RuntimeError("Existing backup belongs to a different active theme")
        saved_keys={str(item.get("key") or "") for item in data.get("assets",[])}
        missing=[entry for entry in entries if entry["key"] not in saved_keys]
        if missing:
            for entry in missing:
                current=asset(main["id"],entry["key"])
                payload=(current or {}).get("asset") or {}
                data.setdefault("assets",[]).append({"key":entry["key"],"exists":bool(current),"value":payload.get("value"),"attachment":payload.get("attachment")})
                time.sleep(.6)
            data["extended_at"]=time.strftime("%Y-%m-%dT%H:%M:%SZ",time.gmtime())
            shopify("PUT",f"themes/{PREVIEW_THEME_ID}/assets.json",{"asset":{"key":BACKUP_KEY,"value":json.dumps(data,separators=(",",":"))}})
        return data
    saved=[]
    for entry in entries:
        current=asset(main["id"],entry["key"])
        payload=(current or {}).get("asset") or {}
        saved.append({"key":entry["key"],"exists":bool(current),"value":payload.get("value"),"attachment":payload.get("attachment")})
        time.sleep(.6)
    data={"main_theme_id":str(main["id"]),"main_theme_name":main.get("name"),"created_at":time.strftime("%Y-%m-%dT%H:%M:%SZ",time.gmtime()),"assets":saved}
    shopify("PUT",f"themes/{PREVIEW_THEME_ID}/assets.json",{"asset":{"key":BACKUP_KEY,"value":json.dumps(data,separators=(",",":"))}})
    return data

def deploy():
    main=main_theme(); assert_roles(main["id"]); backup=ensure_backup(main)
    entries=json.loads((ROOT/"assets.json").read_text());STATE.update(status="updating_active_theme",theme_id=main["id"],theme_name=main.get("name"),total=len(entries),updated=0,backup_key=BACKUP_KEY,backup_created_at=backup.get("created_at"))
    for entry in entries:
        assert_roles(main["id"]);shopify("PUT",f"themes/{main['id']}/assets.json",{"asset":entry});STATE["updated"]+=1;time.sleep(1.1)
    STATE.update(status="ready",form_url="https://stellasageco.com/pages/request-storefront-form")

def rollback():
    main=main_theme();assert_roles(main["id"]);stored=asset(PREVIEW_THEME_ID,BACKUP_KEY)
    if not stored:raise RuntimeError("No original asset backup exists")
    data=json.loads(stored["asset"]["value"])
    if str(data.get("main_theme_id"))!=str(main["id"]):raise RuntimeError("Backup does not match the active theme")
    STATE.update(status="restoring_active_theme",theme_id=main["id"],total=len(data["assets"]),updated=0)
    for saved in data["assets"]:
        assert_roles(main["id"])
        if not saved["exists"]:shopify("DELETE",f"themes/{main['id']}/assets.json?asset[key]={urllib.parse.quote(saved['key'],safe='')}")
        else:
            payload={"key":saved["key"]}
            if saved.get("value") is not None:payload["value"]=saved["value"]
            elif saved.get("attachment") is not None:payload["attachment"]=saved["attachment"]
            shopify("PUT",f"themes/{main['id']}/assets.json",{"asset":payload})
        STATE["updated"]+=1;time.sleep(1.1)
    STATE.update(status="rolled_back")

def run():
    try: rollback() if STATE["mode"]=="rollback" else deploy()
    except Exception as exc:STATE.update(status="failed",error=str(exc)[:300])
    print(json.dumps(STATE),flush=True)

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        path=self.path.split("?",1)[0]
        if path=="/healthz":body,kind=b"ok","text/plain"
        elif path=="/status":body,kind=json.dumps(STATE).encode(),"application/json"
        else:self.send_error(404);return
        self.send_response(200);self.send_header("Content-Type",kind);self.send_header("Content-Length",str(len(body)));self.send_header("Cache-Control","no-store");self.send_header("X-Robots-Tag","noindex,nofollow");self.end_headers();self.wfile.write(body)
    def log_message(self,*_):return

if __name__=="__main__":
    threading.Thread(target=run,daemon=True).start();ThreadingHTTPServer(("0.0.0.0",int(os.getenv("PORT","8080"))),Handler).serve_forever()
