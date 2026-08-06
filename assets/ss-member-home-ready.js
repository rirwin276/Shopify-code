/* Reveal the signed-in homepage only after ss-member-home.js finishes its
 * synchronous enhancement. This prevents the older Liquid layout flashing
 * before the final member command center appears.
 */
(() => {
  const reveal = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.documentElement.classList.remove('ss-member-home-pending');
      });
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', reveal, { once: true });
  } else {
    reveal();
  }
})();
