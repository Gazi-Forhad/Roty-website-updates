// ✅ DEPLOYMENT CHECK
console.log("✅ attribution.js LOADED — fbclid TTL (7 days) + loader baton");

(function () {
  const KEY = "fbclid_data";

  // ✅ 7-day click attribution window (Meta-like)
  const TTL_MS = 7 * 24 * 60 * 60 * 1000;

  const ALLOWED_EXTERNAL_HOSTS = new Set([
    "app.bitely.com.au",
    "bitely.com.au",
    "www.bitely.com.au"
  ]);

  // ✅ Loader baton params (for Bitely to show loader on arrival)
  const LOADER_PARAM = "showAppLoader"; // Bitely header checks showAppLoader=1
  const LOADER_TS_PARAM = "lbts";       // timestamp for short validity window

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

  // --- capture incoming fbclid ---
  const params = new URLSearchParams(window.location.search);
  const incoming = params.get("fbclid");
  const stored = readStored();

  // ✅ Only store on first capture or when value changes
  if (incoming && (!stored || stored.value !== incoming)) {
    store(incoming);
  }

  // --- read active fbclid (may be null) ---
  let active = readStored();

  // ✅ Enforce 7-day expiry (only if we actually have one stored)
  if (active && now() - active.ts > TTL_MS) {
    clear();
    active = null;
  }

  const fbclid = active?.value || null;
  if (fbclid) console.log("✅ fbclid active:", fbclid);
  else console.log("ℹ️ no fbclid stored (still patching Bitely loader baton)");

  // ✅ Append fbclid (if present) + loader baton (always) to internal + Bitely links
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

    // ✅ If this is a Bitely link, append loader baton for cross-domain transitions
    // (This will be ignored by Bitely unless you also update the Bitely header script.)
    if (isAllowedExternal) {
      if (!url.searchParams.has(LOADER_PARAM)) {
        url.searchParams.set(LOADER_PARAM, "1");
        url.searchParams.set(LOADER_TS_PARAM, String(Date.now()));
      }
    }

    // ✅ Append fbclid only if we have one and it isn't already present
    if (fbclid && !url.searchParams.has("fbclid")) {
      url.searchParams.set("fbclid", fbclid);
    }

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
