function setupBulletsAnimation() {
  document.querySelectorAll('.ab-fairness-list').forEach(fairnessList => {
    const items = Array.from(fairnessList.querySelectorAll('li'));
    // Hide all items initially
    items.forEach(li => {
      li.style.opacity = '0';
      li.style.transform = 'translateY(40px)';
      li.style.animation = 'none';
      li.style.visibility = 'hidden';
    });
    let started = false;
    function revealBullets() {
      if (started) return;
      const rect = fairnessList.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        started = true;
        items.forEach((li, i) => {
          setTimeout(() => {
            li.style.visibility = 'visible';
            li.style.animation = 'ab-fade-in-up 1.2s cubic-bezier(.23,1.02,.58,.99) forwards';
            li.style.animationPlayState = 'running';
          }, i * 350);
        });
        window.removeEventListener('scroll', revealBullets);
        window.removeEventListener('resize', revealBullets);
      }
    }
    window.addEventListener('scroll', revealBullets);
    window.addEventListener('resize', revealBullets);
  });
}
document.addEventListener('DOMContentLoaded', setupBulletsAnimation);
if (window.document$ && typeof window.document$.subscribe === 'function') {
  window.document$.subscribe(setupBulletsAnimation);
}
// Aggressively prevent updating the URL hash on scroll or navigation (MkDocs Material)
(function() {
  function removeHash() {
    if (location.hash) {
      history.replaceState(null, '', location.pathname + location.search);
    }
  }

  // Intercept pushState and replaceState to remove hash after navigation
  const origPushState = history.pushState;
  const origReplaceState = history.replaceState;
  history.pushState = function(state, title, url) {
    if (typeof url === 'string' && url.includes('#')) {
      url = url.split('#')[0];
    }
    return origPushState.call(this, state, title, url);
  };
  history.replaceState = function(state, title, url) {
    if (typeof url === 'string' && url.includes('#')) {
      url = url.split('#')[0];
    }
    return origReplaceState.call(this, state, title, url);
  };

  // Remove hash on hashchange
  window.addEventListener('hashchange', removeHash, false);

  // Remove hash after SPA navigation (Material theme)
  if (window.document$ && typeof window.document$.subscribe === 'function') {
    window.document$.subscribe(removeHash);
  }

  // Remove hash on DOMContentLoaded (initial load)
  document.addEventListener('DOMContentLoaded', removeHash);
})();

// Robust spinning logo effect on hover
function attachLogoSpin() {
  const img = document.querySelector(".md-header .md-logo img");
  if (!img) return;
  img.addEventListener("mouseenter", () => {
    img.classList.remove("ab-shrink");
    void img.offsetWidth;
    img.classList.add("ab-grow");
  });
  img.addEventListener("mouseleave", () => {
    img.classList.remove("ab-grow");
    void img.offsetWidth;
    img.classList.add("ab-shrink");
  });
}
document.addEventListener("DOMContentLoaded", attachLogoSpin);
// In case of SPA navigation, re-attach after DOM updates
if (window.document$ && typeof window.document$.subscribe === "function") {
  window.document$.subscribe(attachLogoSpin);
}

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

/* === Page loader: desktop full loader; mobile tiny post-render pulse === */
document.addEventListener("DOMContentLoaded", () => {
  // Detect touch/mobile
  const isTouch = window.matchMedia("(pointer: coarse)").matches;

  // Resolve base for /assets (works locally + GitHub Pages subpaths)
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

  /* --------------------- MOBILE: tiny pulse (non-blocking) --------------------- */
  if (isTouch) {
    const overlay = document.createElement("div");
    overlay.id = "ab-loader";
    const coin = document.createElement("img");
    coin.className = "ab-coin";
    coin.decoding = "async";
    coin.loading = "eager";

    const coinPath = abSiteBase() + "assets/img/attrax-coin.png";
    coin.src = coinPath;
    new Image().src = coinPath; // preload
    coin.addEventListener("error", () => {
      const logo = document.querySelector(".md-header .md-logo img");
      if (logo && logo.src) coin.src = logo.src;
    });

    overlay.appendChild(coin);
    document.body.appendChild(overlay);

    const PULSE_MS = 500;   // how long the coin is visible
    const DELAY_MS = 50;    // start a beat after render to feel smoother
    let showT, hideT;

    const pulse = () => {
      clearTimeout(showT);
      clearTimeout(hideT);
      showT = setTimeout(() => {
        overlay.classList.add("show");
        hideT = setTimeout(() => overlay.classList.remove("show"), PULSE_MS);
      }, DELAY_MS);
    };

    // First load + bfcache restores
    window.addEventListener("load", pulse);
    window.addEventListener("pageshow", (e) => { if (e.persisted) pulse(); });

    // After each Material SPA page render
    if (window.document$ && typeof window.document$.subscribe === "function") {
      window.document$.subscribe(pulse);
    }

    // Important: stop here — no desktop handlers on mobile
    return;
  }

  /* --------------------- DESKTOP: full loader --------------------- */
  // Elements
  const overlay = document.createElement("div");
  overlay.id = "ab-loader";
  const coin = document.createElement("img");
  coin.className = "ab-coin";
  coin.decoding = "async";
  coin.loading = "eager";

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

  // State
  const MIN_MS = 1500;     // adjust to 2000–3000 if you want longer
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
    armWatchdog(); // if nav stalls, auto-hide
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
  const inDrawer = (el) => !!(el && el.closest(".md-drawer"));

  // Triggers
  // Show on pointerdown for non-drawer links (no blink)
  document.addEventListener("pointerdown", (e) => {
    const a = e.target.closest && e.target.closest("a");
    if (!a || inDrawer(a)) return;
    if (isInternalLink(a) && !isSamePage(a)) showLoader();
  }, true);

  // Keyboard nav
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const a = document.activeElement && document.activeElement.closest && document.activeElement.closest("a");
    if (a && isInternalLink(a) && !isSamePage(a)) showLoader();
  }, true);

  // History + hard navigations
  window.addEventListener("popstate", showLoader);
  window.addEventListener("beforeunload", showLoader);

  // Hide after Material SPA render (honors MIN_MS)
  if (window.document$ && typeof window.document$.subscribe === "function") {
    window.document$.subscribe(() => hideLoader());
  } else {
    window.addEventListener("load", hideLoader, { once: true });
  }

  // Safety: if DOM mutates a lot, attempt hide (still respects MIN_MS)
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

