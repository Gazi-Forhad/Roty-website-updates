// ✅ DEPLOYMENT CHECK
console.log("✅ attribution.js LOADED — fbclid TTL test mode (120s)");

(function () {
  const KEY = "fbclid_data";

  // ⏱️ TEST MODE: 2 minutes
  const TTL_MS = 120 * 1000;

  // ✅ Allow fbclid to be passed to Bitely checkout
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
    console.log("📥 fbclid captured:", value);
  }

  function clear() {
    localStorage.removeItem(KEY);
    console.log("🧹 fbclid expired — cleared");
  }

  // 1️⃣ Capture fbclid from URL
  const params = new URLSearchParams(window.location.search);
  const incoming = params.get("fbclid");

  if (incoming) {
    store(incoming);
  }

  // 2️⃣ Load stored value
  const stored = readStored();

  if (!stored) {
    console.log("ℹ️ no fbclid stored");
    return;
  }

  // 3️⃣ Expiry check
  if (now() - stored.ts > TTL_MS) {
    clear();
    return;
  }

  const fbclid = stored.value;
  console.log("✅ fbclid active:", fbclid);

  // 4️⃣ Append fbclid to INTERNAL + Bitely links
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
