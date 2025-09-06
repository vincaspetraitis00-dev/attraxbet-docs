document.addEventListener("DOMContentLoaded", () => {
  const img = document.querySelector(".md-header .md-logo img");
  if (!img) return;

  // Hover in: play grow+spin (clockwise)
  img.addEventListener("mouseenter", () => {
    img.classList.remove("ab-shrink");
    // restart animation if it was mid-flight
    void img.offsetWidth;
    img.classList.add("ab-grow");
  });

  // Hover out: play shrink+spin (counter-clockwise)
  img.addEventListener("mouseleave", () => {
    img.classList.remove("ab-grow");
    void img.offsetWidth;
    img.classList.add("ab-shrink");
  });
});

// ===== Sticky header title: set the text directly (robust) =====
document.addEventListener("DOMContentLoaded", () => {
  const SITE_TITLE = "AttraxBet Docs";
  const SCROLLED_TITLE = "Leading Casino on Abstract";

  // This span shows the current page title in the header when you scroll
  const getTopicSpan = () =>
    document.querySelector('[data-md-component="header-topic"] .md-ellipsis');

  const setStickyTitle = () => {
    const topic = getTopicSpan();
    if (!topic) return;

    if (window.scrollY > 16) {
      // Show our custom text when scrolled
      if (topic.textContent !== SCROLLED_TITLE) topic.textContent = SCROLLED_TITLE;
      document.documentElement.classList.add("ab-scrolled");
    } else {
      // At the top, show site title in the same place (Material may hide it, that's fine)
      if (topic.textContent !== SITE_TITLE) topic.textContent = SITE_TITLE;
      document.documentElement.classList.remove("ab-scrolled");
    }
  };

  setStickyTitle();
  document.addEventListener("scroll", setStickyTitle, { passive: true });

  // Re-apply after Material's instant navigation or DOM changes
  const obs = new MutationObserver(setStickyTitle);
  obs.observe(document.body, { childList: true, subtree: true });
});

/* === 3) Page loader: coin-only, no bar, smooth & no blink === */
document.addEventListener("DOMContentLoaded", () => {
  // Elements (overlay stays in <body> across Material's instant nav)
  const overlay = document.createElement("div");
  overlay.id = "ab-loader";
  const coin = document.createElement("img");
  coin.className = "ab-coin";
  coin.decoding = "async";
  coin.loading = "eager";

  // Resolve site base so /assets works locally + GitHub Pages subpaths
  function abSiteBase() {
    const cfg = document.getElementById("__config");
    if (cfg) {
      try {
        const base = JSON.parse(cfg.textContent || "{}").base;
        if (base) return base.endsWith("/") ? base : base + "/";
      } catch {}
    }
    const any = document.querySelector('link[href*="/assets/"], script[src*="/assets/"]');
    if (any) {
      const url = new URL(any.getAttribute("href") || any.getAttribute("src"), location.href);
      const prefix = url.pathname.split("/assets/")[0];
      return (prefix.endsWith("/") ? prefix : prefix + "/") || "/";
    }
    return "/";
  }

  // Image source + preload (prevents first-show flicker)
  const coinPath = abSiteBase() + "assets/img/attrax-coin.png";
  coin.src = coinPath;
  new Image().src = coinPath;
  coin.addEventListener("error", () => {
    const headerLogo = document.querySelector(".md-header .md-logo img");
    if (headerLogo && headerLogo.src) coin.src = headerLogo.src;
  });

  overlay.appendChild(coin);
  document.body.appendChild(overlay);

  // --- State
  const MIN_MS = 1200;             // feel free to set 1500–2000 for more presence
  let visible = false;
  let minHideAt = 0;
  let hideTimer = null;
  let lastShowAt = 0;

  function showLoader() {
    const now = performance.now();
    // Debounce: ignore repeated triggers within 150ms
    if (visible || (now - lastShowAt) < 150) return;
    lastShowAt = now;

    visible = true;
    minHideAt = now + MIN_MS;
    overlay.classList.add("show");
  }

  function hideLoader() {
if (!visible) return;
const wait = Math.max(0, minHideAt - performance.now());
clearTimeout(hideTimer);
hideTimer = setTimeout(() => {
overlay.classList.remove("show");
visible = false;
}, wait);
}


  // Helpers
  function isInternalLink(a) {
    if (!a) return false;
    const href = a.getAttribute("href") || "";
    if (a.target === "_blank" || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:"))
      return false;
    try {
      const u = new URL(a.href, location.href);
      return u.origin === location.origin;
    } catch { return false; }
  }

  // --- Triggers (no blink):
  // 1) pointerdown: show immediately so it’s on before the page swap
  document.addEventListener("pointerdown", (e) => {
    const a = e.target.closest && e.target.closest("a");
    if (isInternalLink(a)) showLoader();
  }, true);

  // 2) keyboard nav on links
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const a = document.activeElement && document.activeElement.closest && document.activeElement.closest("a");
    if (isInternalLink(a)) showLoader();
  }, true);

  // 3) When Material finishes rendering the next page, hide (respects MIN_MS)
  if (window.document$ && typeof window.document$.subscribe === "function") {
    window.document$.subscribe(() => { hideLoader(); });
  } else {
    // Full reload fallback
    window.addEventListener("load", hideLoader);
  }

  // 4) Browser back/forward should also show/hide
  window.addEventListener("popstate", showLoader);
  window.addEventListener("beforeunload", showLoader); // hard navs too
});

