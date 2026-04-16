// ss-wow.js — Stella & Sage visual enhancements
// Scroll-reveal animations using IntersectionObserver
(function() {
  if (typeof window === 'undefined') return;

  // --- SCROLL REVEAL ---
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('ss-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  function initReveal() {
    // Build a map of parent -> stagger index so each stagger group starts at 0
    const staggerCounters = new Map();

    document.querySelectorAll('.ss-reveal').forEach((el) => {
      let delay;
      if (el.dataset.delay) {
        delay = el.dataset.delay;
      } else if (el.dataset.stagger) {
        const parent = el.parentElement;
        const idx = staggerCounters.get(parent) || 0;
        staggerCounters.set(parent, idx + 1);
        delay = idx * 80;
      } else {
        delay = 0;
      }
      el.style.transitionDelay = delay + 'ms';
      revealObserver.observe(el);
    });
  }

  // --- HERO BROWSER PARALLAX ---
  function initBrowserParallax() {
    const frame = document.querySelector('.sshub__browserFrame');
    if (!frame) return;
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          const maxScroll = 400;
          const progress = Math.min(scrollY / maxScroll, 1);
          const rotateX = 5 * (1 - progress);
          const translateY = scrollY * 0.12;
          frame.style.transform = `rotateX(${rotateX}deg) translateY(${translateY}px)`;
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  // --- BUTTON PRESS EFFECT ---
  function initButtonPress() {
    document.addEventListener('pointerdown', (e) => {
      const btn = e.target.closest('a.sshub__btn, button.sf-btn, a.sf-btn, a.ssx-btn');
      if (!btn) return;
      btn.style.transform = 'scale(0.96)';
    });
    document.addEventListener('pointerup', (e) => {
      const btn = e.target.closest('a.sshub__btn, button.sf-btn, a.sf-btn, a.ssx-btn');
      if (!btn) return;
      btn.style.transform = '';
    });
    document.addEventListener('pointercancel', (e) => {
      const btn = e.target.closest('a.sshub__btn, button.sf-btn, a.sf-btn, a.ssx-btn');
      if (!btn) return;
      btn.style.transform = '';
    });
  }

  // --- STAT COUNTER ANIMATION ---
  function initCounters() {
    const counters = document.querySelectorAll('.ss-stat-num[data-target]');
    if (!counters.length) return;

    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.dataset.target, 10);
        const suffix = el.dataset.suffix || '';
        const prefix = el.dataset.prefix || '';
        const duration = 1400;
        const start = performance.now();

        function tick(now) {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          // Ease out cubic
          const eased = 1 - Math.pow(1 - progress, 3);
          const current = Math.round(eased * target);
          el.textContent = prefix + current.toLocaleString() + suffix;
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        counterObserver.unobserve(el);
      });
    }, { threshold: 0.5 });

    counters.forEach(el => counterObserver.observe(el));
  }

  // --- INIT ---
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initReveal();
      initBrowserParallax();
      initButtonPress();
      initCounters();
    });
  } else {
    initReveal();
    initBrowserParallax();
    initButtonPress();
    initCounters();
  }
})();
