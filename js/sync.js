// Sync ratings across devices through a free JSON store (jsonblob.com), no sign-up.
// The store id ("sync code") comes from js/config.js (syncId), a #sync=CODE link, or is
// created on first use. Anyone with the code can read/write the ratings: family use only.
window.MovieSync = (() => {
  const API = "https://jsonblob.com/api/jsonBlob";
  const LOCAL = "movienight.syncId";
  const get = () => { try { return localStorage.getItem(LOCAL) || ""; } catch (e) { return ""; } };
  const set = (id) => { try { localStorage.setItem(LOCAL, id); } catch (e) {} };

  // A #sync=CODE link joins that store.
  const m = location.hash.match(/sync=([A-Za-z0-9-]+)/);
  if (m) { set(m[1]); history.replaceState(null, "", location.pathname + location.search); }
  const cfg = (window.MOVIE_NIGHT_CONFIG || {}).syncId || "";
  if (cfg && !get()) set(cfg);
  if (cfg && get() !== cfg && !m) set(cfg); // the family code in config wins over a stray local one

  const id = () => get();
  const headers = { "Content-Type": "application/json", Accept: "application/json" };

  async function create(data) {
    const res = await fetch(API, { method: "POST", headers, body: JSON.stringify(data) });
    if (!res.ok) throw new Error("sync create " + res.status);
    let newId = res.headers.get("x-jsonblob-id") || (res.headers.get("location") || "").split("/").pop();
    if (!newId) { try { const b = await res.clone().json(); newId = b && (b.id || b._id); } catch (e) {} }
    if (!newId) throw new Error("sync create: no id");
    set(newId);
    return newId;
  }
  async function pull() {
    if (!id()) return null;
    const res = await fetch(`${API}/${id()}`, { headers, cache: "no-store" });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("sync read " + res.status);
    return res.json();
  }
  async function push(data) {
    if (!id()) { await create(data); return; }
    const res = await fetch(`${API}/${id()}`, { method: "PUT", headers, body: JSON.stringify(data) });
    if (res.status === 404) { set(""); await create(data); return; }
    if (!res.ok) throw new Error("sync write " + res.status);
  }
  return { id, pull, push, link: () => id() ? `${location.origin}${location.pathname}#sync=${id()}` : "" };
})();
