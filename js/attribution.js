// ✅ DEPLOYMENT CHECK
console.log("✅ attribution.js LOADED — fbclid TTL test mode (120s)");

(function () {
  const KEY = "fbclid_data";
  const TTL_MS = 120 * 1000;

  const ALLOWED_EXTERNAL_HOSTS = new Set([
    "app.bitely.com.au",
    "bitely.com.au",
    "www.bitely.com.au"
  ]);

  function now() {
    return Date.now();
  }

  function readStored() {
    try {
      return JSON.parse(localStorage.getItem(KEY));
    } catch {
      return null;
    }
  }

  function store(value) {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        value,
        ts: now()
      })
    );
    console.log("📥 fbclid captured (first click):", value);
  }

  function clear() {
    localStorage.removeItem(KEY);
    console.log("🧹 fbclid expired — cleared");
  }

  const params = new URLSearchParams(window.location.search);
  const incoming = params.get("fbclid");

  const stored = readStored();

  // ✅ Only store on FIRST capture or if value changes
  if (incoming && (!stored || stored.value !== incoming)) {
    store(incoming);
  }

  const active = readStored();
  if (!active) {
    console.log("ℹ️ no fbclid stored");
    return;
  }

  if (now() - active.ts > TTL_MS) {
    clear();
    return;
  }

  const fbclid = active.value;
  console.log("✅ fbclid active:", fbclid);

  document.querySelectorAll("a[href]").forEach((link) => {
    const href = link.getAttribute("href");
    if (!href) return;

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

    if (!isSameOrigin && !isAllowedExternal) return;

    if (url.searchParams.has("fbclid")) return;

    url.searchParams.set("fbclid", fbclid);

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
