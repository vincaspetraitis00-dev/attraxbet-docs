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

/* === 3) Page loader: coin-only, mobile-drawer safe, with watchdog === */
document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const overlay = document.createElement("div");
  overlay.id = "ab-loader";
  const coin = document.createElement("img");
  coin.className = "ab-coin";
  coin.decoding = "async";
  coin.loading = "eager";

  // Resolve base for /assets (GitHub Pages subpaths)
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

  // Image + preload
  const coinPath = abSiteBase() + "assets/img/attrax-coin.png";
  coin.src = coinPath;
  new Image().src = coinPath;
  coin.addEventListener("error", () => {
    const headerLogo = document.querySelector(".md-header .md-logo img");
    if (headerLogo && headerLogo.src) coin.src = headerLogo.src;
  });

  overlay.appendChild(coin);
  document.body.appendChild(overlay);

  // ---- State
  const MIN_MS = 1500;     // set 2000–3000 if you want longer
  const DEBOUNCE_MS = 150; // ignore duplicate triggers
  let visible = false;
  let minHideAt = 0;
  let lastShowAt = 0;
  let hideTimer = null;
  let navWatchdog = null;

  function armWatchdog(ms = 2500) {
    clearTimeout(navWatchdog);
    navWatchdog = setTimeout(() => hideLoader(), ms);
  }
  function disarmWatchdog() {
    clearTimeout(navWatchdog);
    navWatchdog = null;
  }

  function showLoader() {
    const now = performance.now();
    if (visible || (now - lastShowAt) < DEBOUNCE_MS) return;
    lastShowAt = now;
    visible = true;
    minHideAt = now + MIN_MS;
    overlay.classList.add("show");
    armWatchdog(); // if nav doesn't happen, auto-hide
  }

  function hideLoader() {
    if (!visible) return;
    disarmWatchdog();
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
  function isSamePage(a) {
    try {
      const u = new URL(a.href, location.href);
      return u.origin === location.origin &&
             u.pathname === location.pathname &&
             (u.hash || "") === (location.hash || "");
    } catch { return false; }
  }
  const inDrawer = (el) => !!(el && el.closest(".md-drawer")); // mobile nav drawer

  // ---- Triggers
  // A) For everything NOT in the drawer: show on pointerdown (no blink)
  document.addEventListener("pointerdown", (e) => {
    const a = e.target.closest && e.target.closest("a");
    if (!a || inDrawer(a)) return;                      // drawer handled by click
    if (isInternalLink(a) && !isSamePage(a)) showLoader();
  }, true);

  // C) Keyboard nav on links anywhere
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const a = document.activeElement && document.activeElement.closest && document.activeElement.closest("a");
    if (a && isInternalLink(a) && !isSamePage(a)) showLoader();
  }, true);

  // D) Back/forward and hard navigations
  window.addEventListener("popstate", showLoader);
  window.addEventListener("beforeunload", showLoader);

  // E) Hide after Material renders (SPA) — MIN_MS still enforced
  if (window.document$ && typeof window.document$.subscribe === "function") {
    window.document$.subscribe(() => hideLoader());
  } else {
    window.addEventListener("load", hideLoader, { once: true });
  }

  // F) Safety: if DOM mutates a lot post-nav, attempt hide (still respects MIN_MS)
  const mo = new MutationObserver(() => { if (visible) hideLoader(); });
  mo.observe(document.body, { childList: true, subtree: true });
});

// --- Keep the drawer clean: remove the extra TOC row/label/icon next to the active item
document.addEventListener("DOMContentLoaded", () => {
  const killTocBits = () => {
    document.querySelectorAll(
      // the label-row that toggles the __toc checkbox (shows the little icon)
      '#__toc + label.md-nav__link[for="__toc"],' +
      // any stray label wired to __toc
      'label[for="__toc"],' +
      // button variant some builds use
      '.md-drawer .md-nav__item--active > .md-nav__button[for="__toc"]'
    ).forEach(n => n.remove());
  };

  killTocBits();

  // After each Material SPA render
  if (window.document$ && typeof window.document$.subscribe === "function") {
    window.document$.subscribe(killTocBits);
  }

  // Watch for drawer mutations (late injection)
  new MutationObserver(killTocBits).observe(document.body, { childList: true, subtree: true });
});

