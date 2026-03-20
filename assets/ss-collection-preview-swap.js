(function () {
  function getPreviewMap() {
    try {
      const raw = sessionStorage.getItem("ss_gelato_preview_by_variant");
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function swap() {
    if (!/\/collections\//.test(window.location.pathname)) return;

    const map = getPreviewMap();
    if (!map || typeof map !== "object") return;

    document.querySelectorAll("product-card[data-ss-variant-id]").forEach((card) => {
      const vid = card.getAttribute("data-ss-variant-id");
      const preview = map[String(vid)];
      if (!preview) return;

      const img = card.querySelector("img");
      if (!img) return;

      if (img.getAttribute("data-ss-preview-applied") === "1") return;

      img.src = preview;
      img.srcset = "";
      img.setAttribute("data-ss-preview-applied", "1");
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    swap();
    setTimeout(swap, 500);
    setTimeout(swap, 1500);
  });
})();
