// Sync ratings across devices through one shared "basket" in a free Pantry (getpantry.cloud).
// The basket URL lives in js/config.js (syncUrl), so every device joins automatically.
// Anyone with the URL can read/write the ratings: fine for a family movie list.
window.MovieSync = (() => {
  const url = () => ((window.MOVIE_NIGHT_CONFIG || {}).syncUrl || "");
  // Pantry rate-limits bursts, so space requests out and retry once if one is turned away.
  let last = 0, chain = Promise.resolve();
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  function call(opts) {
    const run = async () => {
      for (let attempt = 0; attempt < 3; attempt++) {
        const gap = 2000 - (Date.now() - last);
        if (gap > 0) await wait(gap);
        last = Date.now();
        try {
          const res = await fetch(url(), opts);
          if (res.status !== 429) return res;
        } catch (e) { if (attempt === 2) throw e; } // blocked burst shows up as a network error
        await wait(2000 * (attempt + 1));
      }
      throw new Error("sync busy");
    };
    const p = chain.then(run, run);
    chain = p.catch(() => {});
    return p;
  }
  async function pull() {
    if (!url()) throw new Error("no sync url");
    const res = await call({ cache: "no-store" });
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
    const res = await call({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!res.ok) throw new Error("sync write " + res.status);
  }
  return { pull, push, enabled: () => !!url() };
})();
