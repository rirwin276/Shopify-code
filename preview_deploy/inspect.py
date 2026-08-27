from __future__ import annotations
import json, os, urllib.request
shop=os.environ["SHOP"].strip().replace("https://","").rstrip("/")
version=os.getenv("API_VERSION","2025-04").strip()
req=urllib.request.Request(
    f"https://{shop}/admin/api/{version}/themes.json",
    headers={"X-Shopify-Access-Token": os.environ["CLIENT_SECRET"].strip()}
)
with urllib.request.urlopen(req, timeout=60) as response:
    themes=json.loads(response.read().decode("utf-8")).get("themes",[])
matches=[{"id": str(t.get("id")), "name": t.get("name"), "role": t.get("role"), "processing": t.get("processing")} for t in themes if t.get("name")=="Anonymous Store Builder Preview"]
print(json.dumps({"matches":matches}, sort_keys=True))
