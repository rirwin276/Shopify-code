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
    const store = root.querySelector('[data-ad-store]');
    if (store) {
      let products = [];
      let loaded = false;
      const grid = store.querySelector('[data-store-grid]');
      const dialog = store.querySelector('[data-store-dialog]');
      const detail = store.querySelector('[data-store-detail]');
      const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
      // The demo product view. Two things it deliberately does NOT fake: it
      // never invents a back image for a product that has none, and it never
      // shows a price the public catalog further down the page contradicts.
      let side = 'front';
      let colorIndex = 0;

      const showProduct = index => {
        const product = products[index];
        if (!product) return;
        side = 'front';
        colorIndex = 0;

        const priceLine = product.priceBack
          ? `${escape(product.price)} front &middot; ${escape(product.priceBack)} front + back`
          : `${escape(product.price)}`;

        detail.innerHTML =
          `<div class="ad-product-detail">
            <div class="ad-detail-photo">
              <img data-detail-image src="${escape(product.colors[0].front)}" alt="Raptors ${escape(product.title)}" width="1000" height="1000">
              <div class="ad-detail-sides" data-detail-sides hidden>
                <button type="button" data-detail-side="front" aria-pressed="true">Front</button>
                <button type="button" data-detail-side="back" aria-pressed="false">Back</button>
              </div>
            </div>
            <div class="ad-detail-info">
              <span class="ad-demo-tag">Raptors &middot; Demo product</span>
              <h3>${escape(product.title)}</h3>
              <p>${escape(product.brandTitle)}</p>
              <p class="ad-detail-price">${priceLine}</p>
              ${product.personalizable ? `<p class="ad-detail-pers"><strong>Name &amp; number available.</strong> Each person adds their own on the product page. <button type="button" class="ad-pers-jump" data-pers-jump>Try it &darr;</button></p>` : ''}
              <label>Try a color</label>
              <div class="ad-detail-options" data-detail-colors>${product.colors.map((color, i) => `<button type="button" data-detail-color="${i}" aria-pressed="${i === 0}">${escape(color.name)}</button>`).join('')}</div>
              <label>Explore sizes</label>
              <div class="ad-detail-options" data-detail-sizes>${product.sizes.map(size => `<button type="button" aria-pressed="false">${escape(size)}</button>`).join('')}</div>
              <p class="ad-detail-note">In your team store, parents choose their gear and check out themselves. This demo is for browsing only.</p>
            </div>
          </div>`;

        const img = detail.querySelector('[data-detail-image]');
        const sides = detail.querySelector('[data-detail-sides]');

        const paint = () => {
          const color = product.colors[colorIndex];
          const hasBack = !!color.back;
          // The toggle only exists for a colour that really has a back. A
          // greyed-out Back button on a front-only product reads as a missing
          // photo rather than a product that is printed on one side.
          sides.hidden = !hasBack;
          if (!hasBack) side = 'front';
          img.src = side === 'back' ? color.back : color.front;
          img.alt = 'Raptors ' + product.title + ' in ' + color.name + ', ' + side;
          sides.querySelectorAll('[data-detail-side]').forEach(b =>
            b.setAttribute('aria-pressed', String(b.dataset.detailSide === side)));
          detail.querySelectorAll('[data-detail-color]').forEach(b =>
            b.setAttribute('aria-pressed', String(Number(b.dataset.detailColor) === colorIndex)));
        };

        detail.querySelectorAll('[data-detail-color]').forEach(button =>
          button.addEventListener('click', () => { colorIndex = Number(button.dataset.detailColor); paint(); }));
        sides.querySelectorAll('[data-detail-side]').forEach(button =>
          button.addEventListener('click', () => { side = button.dataset.detailSide; paint(); }));
        detail.querySelectorAll('[data-detail-sizes] button').forEach(button =>
          button.addEventListener('click', () => {
            detail.querySelectorAll('[data-detail-sizes] button').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
          }));

        // Sends them to the live name & number preview instead of describing it.
        const jump = detail.querySelector('[data-pers-jump]');
        if (jump) jump.addEventListener('click', () => {
          dialog.close();
          const play = document.querySelector('.ad-play-section');
          if (play) play.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });

        paint();
        dialog.showModal();
      };

      const renderStore = category => {
        grid.innerHTML = products.map((product, index) => ({ product, index }))
          .filter(({ product }) => category === 'all' || product.category === category)
          .map(({ product, index }) => {
            const hasBack = product.colors.some(c => c.back);
            const flags = [
              hasBack ? '<span class="ad-card-flag">Front + back</span>' : '',
              product.personalizable ? '<span class="ad-card-flag ad-card-flag-pers">Name &amp; number</span>' : ''
            ].join('');
            return `<button type="button" class="ad-store-card" data-store-product="${index}" aria-label="Explore ${escape(product.title)}, from ${escape(product.price)}">
              <div class="ad-card-photo">
                <img src="${escape(product.colors[0].front)}" alt="Raptors ${escape(product.title)}" width="1000" height="1000" loading="lazy">
                <span class="ad-card-arrow" aria-hidden="true">&#8599;</span>
                ${flags ? `<div class="ad-card-flags">${flags}</div>` : ''}
              </div>
              <strong>${escape(product.title)}</strong>
              <small>${escape(product.price)} &middot; ${product.colors.length} ${product.colors.length === 1 ? 'color' : 'colors'}</small>
            </button>`;
          }).join('');
        grid.querySelectorAll('[data-store-product]').forEach(button =>
          button.addEventListener('click', () => showProduct(Number(button.dataset.storeProduct))));
      };

      const loadStore = async () => {
        if (loaded) return;
        loaded = true;
        try {
          const response = await fetch(store.dataset.catalogUrl);
          if (!response.ok) throw new Error('Demo unavailable');
          products = await response.json();
          renderStore(store.querySelector('[data-store-filter][aria-pressed="true"]').dataset.storeFilter);
        } catch (_) { grid.innerHTML = '<p>The demo could not load. <button type="button" data-store-retry>Try again</button></p>'; loaded=false; grid.querySelector('[data-store-retry]').addEventListener('click',loadStore); }
      };
      store.querySelectorAll('[data-store-filter]').forEach(button=>button.addEventListener('click',()=>{
        store.querySelectorAll('[data-store-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
        if (loaded) renderStore(button.dataset.storeFilter); else loadStore();
      }));
      store.querySelector('[data-store-close]').addEventListener('click',()=>dialog.close());
      dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
      if ('IntersectionObserver' in window) {
        const demoObserver = new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){demoObserver.disconnect();loadStore();}},{rootMargin:'400px'});
        demoObserver.observe(store);
      } else loadStore();
    }
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
