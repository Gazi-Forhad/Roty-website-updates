// ✅ DEPLOYMENT CHECK
console.log("✅ attribution.js LOADED — fbclid persistence active");

(function () {
  const KEY = "fbclid";

  // 1) Store fbclid from URL if present
  const params = new URLSearchParams(window.location.search);
  const incoming = params.get(KEY);
  if (incoming) localStorage.setItem(KEY, incoming);

  const fbclid = localStorage.getItem(KEY);
  if (!fbclid) return;

  // 2) Append fbclid to all INTERNAL links (same site)
  document.querySelectorAll("a[href]").forEach((link) => {
    const href = link.getAttribute("href");
    if (!href) return;

    // Skip non-page links
    if (
      href.startsWith("#") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      href.startsWith("javascript:")
    ) return;

    let url;
    try {
      url = new URL(href, window.location.href);
    } catch {
      return;
    }

    // Only rewrite same-origin links (internal navigation)
    if (url.origin !== window.location.origin) return;

    // Don't overwrite if already present
    if (url.searchParams.has(KEY)) return;

    url.searchParams.set(KEY, fbclid);

    // Keep relative links relative where possible
    const isRelative =
      !/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(href) && !href.startsWith("//");

    link.setAttribute(
      "href",
      isRelative
        ? url.pathname + url.search + url.hash
        : url.toString()
    );
  });
})();
