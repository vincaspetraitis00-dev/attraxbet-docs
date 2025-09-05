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

