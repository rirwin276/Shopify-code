/* Public homepage interactions only; no changes to store creation or access. */
(() => {
  const start = () => document.querySelectorAll('[data-ss-ad]').forEach(root => {
    if (root.dataset.ready) return;
    root.dataset.ready = '1';
    const buttons = root.querySelectorAll('[data-ad-team]');
    buttons.forEach(button => button.addEventListener('click', () => {
      const selected = button.dataset.adTeam;
      buttons.forEach(b => b.setAttribute('aria-pressed', String(b === button)));
      root.querySelectorAll('[data-ad-panel]').forEach(panel => {
        panel.hidden = panel.dataset.adPanel !== selected;
      });
    }));
    const sticky = root.querySelector('[data-ad-sticky]');
    const hero = root.querySelector('[data-ad-hero-cta]');
    const final = root.querySelector('[data-ad-final]');
    if (!sticky || !hero || !final || !('IntersectionObserver' in window)) return;
    let pastHero = false;
    let atFinal = false;
    const sync = () => { sticky.hidden = !pastHero || atFinal; };
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.target === hero) pastHero = !entry.isIntersecting && entry.boundingClientRect.bottom < 0;
        if (entry.target === final) atFinal = entry.isIntersecting;
      });
      sync();
    });
    observer.observe(hero);
    observer.observe(final);
    document.addEventListener('shopify:section:unload', event => {
      if (event.target.contains(root)) observer.disconnect();
    }, { once: true });
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
  document.addEventListener('shopify:section:load', start);
})();
