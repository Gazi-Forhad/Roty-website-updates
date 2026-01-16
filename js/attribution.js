// ✅ DEPLOYMENT CHECK
console.log("✅ attribution.js LOADED — fbclid persistence active");

(function () {
  const KEY = "fbclid";

  // ✅ Allow fbclid to be passed to Bitely checkout
  const ALLOWED_EXTERNAL_HOSTS = new Set([
    "app.bitely.com.au",
    "bitely.com.au",
    "www.bitely.com.au"
  ]);

  // 1) Store fbclid from URL if present
  const params = new URLSearchParams(window.location.search);
  const incoming = params.get(KEY);
  if (incoming) localStorage.setItem(KEY, incoming);

  const fbclid = localStorage.getItem(KEY);
  if (!fbclid) return;

  // 2) Append fbclid to INTERNAL links + Bitely checkout links
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

    const isSameOrigin = url.origin === window.location.origin;
    const isAllowedExternal = ALLOWED_EXTERNAL_HOSTS.has(url.host);

    // Only rewrite:
    // - internal links, OR
    // - Bitely checkout links
    if (!isSameOrigin && !isAllowedExternal) return;

    // Don't overwrite if already present
    if (url.searchParams.has(KEY)) return;

    url.searchParams.set(KEY, fbclid);

    // Keep relative links relative where possible
    const isRelative =
      !/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(href) && !href.startsWith("//");

    link.setAttribute(
      "href",
      isRelative && isSameOrigin
        ? url.pathname + url.search + url.hash
        : url.toString()
    );
  });
})();
