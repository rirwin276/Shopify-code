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
    const demoButtons = root.querySelectorAll('[data-ad-demo]');
    demoButtons.forEach(button => button.addEventListener('click', () => {
      demoButtons.forEach(b => b.setAttribute('aria-pressed', String(b === button)));
      root.querySelectorAll('[data-ad-demo-panel]').forEach(panel => {
        panel.hidden = panel.dataset.adDemoPanel !== button.dataset.adDemo;
      });
    }));
    const builderImage = root.querySelector('[data-ad-builder-image]');
    if (builderImage) {
      let product = 'tee';
      let color = 'navy';
      const productButtons = root.querySelectorAll('[data-ad-product]');
      const colorButtons = root.querySelectorAll('[data-ad-color]');
      const syncBuilder = () => {
        const image = builderImage.getAttribute('data-' + product + '-' + color);
        if (!image) return;
        const productLabel = product === 'tee' ? 'T-shirt' : 'Hoodie';
        const colorLabel = color.charAt(0).toUpperCase() + color.slice(1);
        builderImage.src = image;
        builderImage.alt = 'Sapphire Shooters ' + colorLabel.toLowerCase() + ' ' + productLabel.toLowerCase();
        productButtons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.adProduct === product)));
        colorButtons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.adColor === color)));
        root.querySelector('[data-ad-builder-status]').textContent = productLabel + ' · ' + colorLabel;
      };
      productButtons.forEach(button => button.addEventListener('click', () => { product = button.dataset.adProduct; syncBuilder(); }));
      colorButtons.forEach(button => button.addEventListener('click', () => { color = button.dataset.adColor; syncBuilder(); }));
    }
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
