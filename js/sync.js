// Sync ratings across devices through one shared "basket" in a free Pantry (getpantry.cloud).
// The basket URL lives in js/config.js (syncUrl), so every device joins automatically.
// Anyone with the URL can read/write the ratings: fine for a family movie list.
window.MovieSync = (() => {
  const url = () => ((window.MOVIE_NIGHT_CONFIG || {}).syncUrl || "");
  async function pull() {
    if (!url()) throw new Error("no sync url");
    const res = await fetch(url(), { cache: "no-store" });
    if (!res.ok) {
      const t = await res.text();
      if (/not found|does not exist|could not get basket/i.test(t)) return null; // nothing saved yet
      throw new Error("sync read " + res.status);
    }
    return res.json();
  }
  async function push(data) {
    if (!url()) throw new Error("no sync url");
    // POST replaces the whole basket (PUT would deep-merge and keep deleted entries).
    const res = await fetch(url(), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!res.ok) throw new Error("sync write " + res.status);
  }
  return { pull, push, enabled: () => !!url() };
})();
