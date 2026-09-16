"""Create a self-contained, waiting-only design review. Never starts a real build."""
from pathlib import Path
import re, base64
root=Path(__file__).resolve().parents[1]
s=(root/'sections/ss-anonymous-demo-start.liquid').read_text()
start=s.index('      <div class="ss-demo-wait"')
end=s.index('\n    {% else %}',start)
body=s[start:end].replace('data-demo-wait hidden','data-demo-wait')
body=re.sub(r'{% if section.settings.how_to_video != blank %}[\s\S]*?{% endif %}','',body)
body=body.replace("{{ 'ss-home-cashmere-showcase.webp' | asset_url }}",'data:image/webp;base64,'+base64.b64encode((root/'assets/ss-home-cashmere-showcase.webp').read_bytes()).decode())
body=body.replace('Your team</p>','Your Team</p>').replace('aria-hidden="true">SS</span>','aria-hidden="true">YT</span>')
body=body.replace('Your request is saved. We’re getting your store started.','We’re creating your products and previews. Explore below while we finish.')
body=body.replace('<li data-step="saved">','<li data-step="saved" class="is-done">').replace('<li data-step="store">','<li data-step="store" class="is-done">').replace('<li data-step="products">','<li data-step="products" class="is-active" aria-current="step">')
body=re.sub(r'<details class="ss-wait-other">[\s\S]*?</details>','',body)
body=re.sub(r'<div data-demo-recovery[\s\S]*?</div>','',body)
body=body.replace('href="#"','href="#review-note"')
styles='\n'.join(re.findall(r'<style>([\s\S]*?)</style>',s))
head='''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Your store is taking shape · Stella & Sage</title><style>body{margin:0;background:#fbfaf7}#review-note{padding:10px 20px;background:#10263c;color:#eee;font:12px/1.5 system-ui;text-align:center}#review-note button{background:none;border:1px solid #748397;border-radius:20px;color:#fff;padding:6px 12px;margin-left:10px;font:inherit;cursor:pointer}'''
script='''<script>
var ready=false;
document.getElementById('show-ready').onclick=function(){ready=!ready;document.querySelector('[data-demo-phase-label]').textContent=ready?'READY WHEN YOU ARE':'YOUR LOGO IS IN. WE’LL TAKE IT FROM HERE.';document.querySelector('[data-demo-status-title]').textContent=ready?'Your team store is ready to explore.':'Your team store is taking shape.';document.querySelector('[data-demo-status-copy]').textContent=ready?'Open your store or jump into the design tools. Everything you save stays with this store.':'We’re creating your products and previews. Explore below while we finish.';document.querySelector('[data-demo-ready-actions]').hidden=!ready;document.querySelector('[data-demo-spinner]').classList.toggle('is-done',ready);document.querySelectorAll('[data-demo-progress] li').forEach(function(n,i){n.className=ready||i<2?'is-done':i===2?'is-active':''});this.textContent=ready?'Show building state':'Show ready state';};
</script>'''
html=head+styles+'</style></head><body><div id="review-note">Waiting room design preview · sample build<button id="show-ready">Show ready state</button></div><main class="ss-demo-start"><div class="ss-demo-start__shell">'+body+'</div></main>'+script+'</body></html>'
(root/'docs/anonymous-waiting-room-preview.html').write_text('\n'.join(line.rstrip() for line in html.splitlines())+'\n')
print('Waiting-only preview rebuilt')
