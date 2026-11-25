(() => {
  const STORE = "movienight.v1";

  // Profiles. `likes` nudges suggestions beyond the watch history.
  const PROFILES = {
    jordan: { name: "Jordan", age: 9, emoji: "🦖", blurb: "Action, Disney, Netflix, video-game horror", likes: ["action", "disney", "netflix", "video-game"], kid: true },
    tegan: { name: "Tegan", age: 7, emoji: "🧟", blurb: "Horror, creepy dolls, spooky stop-motion", likes: ["horror", "creepy-dolls"], kid: true },
    both: { name: "Both kids", icon: "img/gremlin.png", blurb: "Picks that work for Jordan and Tegan together", kid: true, combo: ["jordan", "tegan"] },
    kristine: { name: "Kristine", emoji: "🍿", blurb: "Just for you", likes: [] },
    date: { name: "Date Night", emoji: "🥂", blurb: "Kristine and Daniel", likes: [] },
  };

  // "New" rows shown at the top of each tab (need a TMDB key). Genre ids are TMDB's.
  const G = { action: 28, adventure: 12, animation: 16, comedy: 35, family: 10751, fantasy: 14, horror: 27, mystery: 9648, romance: 10749, scifi: 878, thriller: 53, drama: 18 };
  const NEW_ROWS = {
    both: [{ title: "New for the Gremlins", note: "any rating, screened for sexual content", fn: () => TMDB.newByGenre({ kids: true }) }],
    jordan: [{ title: "New for Jordan", note: "any rating, screened for sexual content", fn: () => TMDB.newByGenre({ kids: true, genres: [G.action, G.adventure, G.animation, G.scifi, G.fantasy] }) }],
    tegan: [{ title: "New for Tegan", note: "any rating, screened for sexual content", fn: () => TMDB.newByGenre({ kids: true, genres: [G.horror, G.fantasy, G.mystery, G.animation] }) }],
    kristine: [
      { title: "New in theaters", context: "theaters", fn: () => TMDB.inTheaters() },
      { title: "New on streaming", fn: () => TMDB.newByGenre({ services: state.services }) },
    ],
    date: [
      { title: "New in theaters for date night", context: "theaters", fn: () => TMDB.inTheaters([G.comedy, G.action, G.romance, G.thriller, G.mystery, G.scifi]) },
      { title: "New to stream together", fn: () => TMDB.newByGenre({ services: state.services, genres: [G.comedy, G.action, G.romance, G.thriller, G.mystery, G.scifi] }) },
    ],
  };
  const NEW_DAYS = 45; // NEW! sticker for anything released in the last 45 days

  // ---------- state ----------
  const keyOf = (m) => `${m.title.toLowerCase()}|${m.year || ""}`;
  const defaultState = () => ({
    watched: Object.fromEntries(Object.entries(window.SEED_WATCHED).map(([p, titles]) => [p, titles.map(toWatched)])),
    hidden: { jordan: [], tegan: [], both: [], kristine: [], date: [] },
    tmdbKey: (window.MOVIE_NIGHT_CONFIG && window.MOVIE_NIGHT_CONFIG.tmdbKey) || "",
    services: [],
    info: {},
  });

  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(STORE));
      if (s && s.watched) return { ...defaultState(), ...s };
    } catch (e) { /* storage blocked or empty */ }
    return defaultState();
  }
  const save = () => { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) {} };
  let state = load();
  TMDB.setKey(state.tmdbKey);

  function findInCatalog(title, year) {
    const t = title.trim().toLowerCase();
    return window.CATALOG.find((m) => m.title.toLowerCase() === t && (!year || m.year === year));
  }
  function toWatched(title) {
    const m = findInCatalog(title);
    return m ? { title: m.title, year: m.year, tags: m.tags, kind: m.kind, vote: "yay" } : { title, tags: [], vote: "yay" };
  }
  const entryFrom = (m, vote) => ({ title: m.title, year: m.year, tags: m.tags || [], kind: m.kind, tmdbId: m.tmdbId, mediaType: m.mediaType, vote });
  const isYay = (w) => w.vote !== "nay";

  // ---------- recommendation engine ----------
  // Tags on a YAY add weight, tags on a NAY take weight away, and the profile's
  // "likes" add a little more. A movie's score is how well its tags fit.
  const VOTE_WEIGHT = { yay: 1, nay: -1.25 };
  function tagWeights(profileId) {
    const p = PROFILES[profileId];
    const w = {};
    for (const m of state.watched[profileId] || []) {
      const v = VOTE_WEIGHT[m.vote] ?? 0.5;
      for (const t of m.tags || []) w[t] = (w[t] || 0) + v;
    }
    for (const t of p.likes || []) w[t] = (w[t] || 0) + 1.5;
    return w;
  }

  function scoreFor(profileId, movie) {
    const w = tagWeights(profileId);
    const raw = movie.tags.reduce((s, t) => s + (w[t] || 0), 0);
    return raw / Math.sqrt(movie.tags.length || 1);
  }

  function becauseOf(profileIds, movie) {
    let best = null, bestN = 1;
    for (const pid of profileIds) for (const w of (state.watched[pid] || []).filter(isYay)) {
      const n = (w.tags || []).filter((t) => movie.tags.includes(t)).length;
      if (n > bestN) { best = w; bestN = n; }
    }
    return best;
  }

  function suggestions(profileId) {
    const p = PROFILES[profileId];
    const members = p.combo || [profileId];
    const seen = new Set(members.flatMap((pid) => (state.watched[pid] || []).map(keyOf)));
    const hidden = new Set(state.hidden[profileId] || []);
    return window.CATALOG
      .filter((m) => members.every((pid) => m.for.includes(pid)))
      .filter((m) => !seen.has(keyOf(m)) && !hidden.has(keyOf(m)))
      .map((m, i) => ({ m, i, score: members.reduce((s, pid) => s + scoreFor(pid, m), 0) }))
      .sort((a, b) => b.score - a.score || a.i - b.i)
      .map(({ m }) => ({ ...m, because: becauseOf(members, m) }));
  }

  // ---------- rendering helpers ----------
  const $ = (sel, el = document) => el.querySelector(sel);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const q = (s) => encodeURIComponent(s);

  const INFO_TTL = 3 * 864e5; // re-check streaming every 3 days
  const infoFor = (m) => state.info[keyOf(m)] || {};

  function isNew(m, info) {
    const d = m.date || info.date;
    if (!d) return false;
    const age = (Date.now() - new Date(d + "T12:00:00")) / 864e5;
    return age >= -1 && age <= NEW_DAYS;
  }

  function posterHtml(m, info) {
    const src = info.poster || m.poster;
    const sticker = isNew(m, info) ? `<span class="new-sticker">NEW!</span>` : "";
    if (src) return `<div class="poster-wrap"><img class="poster" src="${esc(src)}" alt="" loading="lazy">${sticker}</div>`;
    const hue = [...m.title].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
    return `<div class="poster-wrap"><div class="poster placeholder" style="--hue:${hue}"><span>${esc(m.title)}</span></div>${sticker}</div>`;
  }

  // "PG-13  ★ 7.4  2019"
  function infoLine(m, info, opts) {
    const rating = m.rating || info.rating;
    const score = info.score ?? m.score;
    const bits = [];
    bits.push(`<span class="cert${rating ? "" : " unrated"}">${esc(rating || "NR")}</span>`);
    if (score) bits.push(`<span class="score">★ ${score.toFixed(1)}</span>`);
    if (opts.showDate && m.date) bits.push(`<span>${esc(fmtDate(m.date))}</span>`);
    else if (m.year) bits.push(`<span>${m.year}</span>`);
    if (m.kind === "series" || m.mediaType === "tv") bits.push(`<span>Series</span>`);
    return `<div class="info">${bits.join("")}</div>`;
  }

  // Streaming services, with yours highlighted.
  function whereHtml(m, info, opts) {
    if (!TMDB.hasKey()) return "";
    if (!info.fetched) return `<div class="where muted">Checking where to stream…</div>`;
    const mine = new Set(state.services.map(String));
    const ids = Object.fromEntries(TMDB.SERVICES.map((s) => [s.name, String(s.id)]));
    if (info.streaming && info.streaming.length) {
      return `<div class="where">${info.streaming.map((n) =>
        `<span class="svc${mine.has(ids[n]) ? " mine" : ""}">${esc(n)}</span>`).join("")}</div>`;
    }
    if (opts.context === "theaters") return `<div class="where muted">In theaters only</div>`;
    return `<div class="where muted">${info.rentBuy ? "Rent or buy" : "Not streaming yet"}</div>`;
  }

  function links(m, kid) {
    const t = `${m.title}${m.year ? " " + m.year : ""}`;
    const parts = [`<a href="https://www.justwatch.com/us/search?q=${q(m.title)}" target="_blank" rel="noopener">Where to watch</a>`];
    if (kid) parts.push(`<a href="https://www.commonsensemedia.org/search/${q(m.title)}" target="_blank" rel="noopener">Parents' guide</a>`);
    else parts.push(`<a href="https://www.google.com/search?q=${q(t + " trailer")}" target="_blank" rel="noopener">Trailer</a>`);
    return `<div class="links">${parts.join("")}</div>`;
  }

  // Cards remember what they were drawn from, so they can be redrawn once TMDB info arrives.
  const cardRegistry = new Map();
  let cardSeq = 0;

  function card(m, profileId, opts = {}) {
    const { actions = true } = opts;
    const kid = PROFILES[profileId] && PROFILES[profileId].kid;
    const info = infoFor(m);
    const id = `c${++cardSeq}`;
    cardRegistry.set(id, { m, profileId, opts });
    return `<article class="card" data-card="${id}">
      ${posterHtml(m, info)}
      <div class="card-body">
        <h4>${esc(m.title)}</h4>
        ${infoLine(m, info, opts)}
        ${whereHtml(m, info, opts)}
        ${m.because ? `<div class="because">Because you watched <b>${esc(m.because.title)}</b></div>` : ""}
        ${m.note ? `<div class="note">${esc(m.note)}</div>` : ""}
        ${m.overview ? `<div class="note overview">${esc(m.overview)}</div>` : ""}
        ${links(m, kid)}
        ${actions ? `<div class="actions">
          <span class="actions-label">Watched it?</span>
          <button class="btn small yay" data-act="vote" data-vote="yay" data-profile="${profileId}" title="Watched it and liked it">👍 Yay</button>
          <button class="btn small nay" data-act="vote" data-vote="nay" data-profile="${profileId}" title="Watched it, didn't like it">👎 Nay</button>
          ${opts.hide !== false ? `<button class="linklike skip" data-act="hide" data-profile="${profileId}" data-key="${esc(keyOf(m))}">Not interested</button>` : ""}
        </div>` : ""}
      </div>
    </article>`;
  }

  // ---------- profile panels ----------
  const openLists = new Set();
  document.addEventListener("toggle", (e) => {
    const d = e.target;
    if (d.classList && d.classList.contains("watched-list")) d.open ? openLists.add(d.dataset.profile) : openLists.delete(d.dataset.profile);
  }, true);
  function watchedHtml(profileId) {
    const list = state.watched[profileId] || [];
    if (!list.length) return `<p class="empty">Nothing yet. Add a few movies with Yay or Nay and the picks will start to fit.</p>`;
    const chip = (w, i) => `<li class="chip ${w.vote === "nay" ? "is-nay" : "is-yay"}">
        <button class="flip" title="Switch to ${w.vote === "nay" ? "Yay" : "Nay"}" data-act="flip" data-profile="${profileId}" data-i="${i}">${w.vote === "nay" ? "👎" : "👍"}</button>
        ${esc(w.title)}${w.year ? ` <small>${w.year}</small>` : ""}
        <button aria-label="Remove ${esc(w.title)}" data-act="unwatch" data-profile="${profileId}" data-i="${i}">×</button></li>`;
    const idx = list.map((w, i) => [w, i]);
    const yays = idx.filter(([w]) => isYay(w)), nays = idx.filter(([w]) => !isYay(w));
    return `<div class="votes">
      <div><div class="vote-head">👍 Yay (${yays.length})</div><ul class="chips">${yays.map(([w, i]) => chip(w, i)).join("") || `<li class="empty">None yet</li>`}</ul></div>
      <div><div class="vote-head">👎 Nay (${nays.length})</div><ul class="chips">${nays.map(([w, i]) => chip(w, i)).join("") || `<li class="empty">None yet</li>`}</ul></div>
    </div>`;
  }

  function panelHtml(profileId) {
    const p = PROFILES[profileId];
    const picks = suggestions(profileId).slice(0, 12);
    const members = p.combo || [profileId];
    const addForm = `<form class="add-watched" data-profile="${profileId}">
        <input name="title" list="catalog-titles" placeholder="${p.combo ? "Something they both watched…" : "Add a movie or show you've watched…"}" autocomplete="off" required>
        <button class="btn small yay" name="vote" value="yay">👍 Yay</button>
        <button class="btn small nay" name="vote" value="nay">👎 Nay</button>
      </form>`;
    const watchedBlock = p.combo
      ? `<div class="watched"><p class="hint">Uses Jordan's and Tegan's own Yays and Nays. Anything you rate here counts for both of them.</p>${addForm}</div>`
      : `<div class="watched">
          <div class="add-label">Already watched something? Rate it:</div>
          ${addForm}
          <details class="watched-list" data-profile="${profileId}" ${openLists.has(profileId) ? "open" : ""}>
            <summary>${p.kid ? p.name + "'s" : profileId === "date" ? "Your date-night" : "Your"} watched list (${state.watched[profileId].length})</summary>
            ${watchedHtml(profileId)}
          </details>
        </div>`;
    const tmdbRow = !p.kid && TMDB.hasKey() && state.watched[profileId].some((w) => w.tmdbId && isYay(w))
      ? `<h4 class="row-title">More like your recent watches</h4><div class="grid" id="tmdb-recs-${profileId}"><p class="empty">Loading…</p></div>` : "";
    return `
      <div class="panel-head">
        <div class="avatar">${p.icon ? `<img src="${p.icon}" alt="">` : p.emoji}</div>
        <div><h3>${esc(p.name)}${p.age ? ` <small>age ${p.age}</small>` : ""}</h3><p class="blurb">${esc(p.blurb)}</p></div>
      </div>
      ${newRowsHtml(profileId)}
      ${watchedBlock}
      <h4 class="row-title">Suggestions</h4>
      <div class="grid">${picks.length ? picks.map((m) => card(m, profileId)).join("") : `<p class="empty">You've seen everything on the list! Add more to <code>js/catalog.js</code>.</p>`}</div>
      ${tmdbRow}`;
  }

  function newRowsHtml(profileId) {
    if (!TMDB.hasKey()) return `<p class="setup-inline">🆕 Want to see what's new in theaters and on streaming here? Add a free TMDB key in <button class="linklike" data-act="settings">Settings</button>.</p>`;
    return NEW_ROWS[profileId].map((r, i) => `<h4 class="row-title new-title">${esc(r.title)}${r.note ? ` <small>(${esc(r.note)}. Still check the parents' guide)</small>` : ""}</h4>
      <div class="grid scroller" id="new-${profileId}-${i}"><p class="empty">Loading…</p></div>`).join("");
  }

  async function loadNewRows(profileId) {
    if (!TMDB.hasKey()) return;
    const watched = new Set((PROFILES[profileId].combo || [profileId]).flatMap((pid) => state.watched[pid]).map((w) => w.title.toLowerCase()));
    const hidden = new Set(state.hidden[profileId]);
    NEW_ROWS[profileId].forEach(async (row, i) => {
      const box = document.getElementById(`new-${profileId}-${i}`);
      try {
        const items = (await row.fn()).filter((m) => !watched.has(m.title.toLowerCase()) && !hidden.has(keyOf(m))).slice(0, 14);
        if (!box.isConnected) return;
        box.innerHTML = items.length
          ? items.map((m) => card({ ...m, overview: "" }, profileId, { showDate: true, context: row.context })).join("")
          : `<p class="empty">Nothing new right now.</p>`;
        fillPosters(box);
      } catch (e) {
        box.innerHTML = `<p class="empty">Couldn't load (${esc(e.message)}). Check your key in Settings.</p>`;
      }
    });
  }

  function renderPanel(profileId) {
    const el = document.getElementById(`panel-${profileId}`);
    if (!el) return;
    el.innerHTML = panelHtml(profileId);
    fillPosters(el);
    loadNewRows(profileId);
    if (!PROFILES[profileId].kid) loadTmdbRecs(profileId);
  }

  function renderSkipped() {
    $("#skipped").innerHTML = window.SKIPPED_FOR_KIDS
      .map((s) => `<li><b>${esc(s.title)}</b> (${s.year}): ${esc(s.why)}</li>`).join("");
  }

  function renderAll() {
    ["both", "jordan", "tegan", "kristine", "date"].forEach(renderPanel);
  }

  // ---------- TMDB-powered bits ----------
  // Look up poster, rating, score and streaming services for every card in `root`
  // that doesn't have fresh info yet, a few at a time, then redraw those cards.
  const inflight = new Map();
  function lookup(m) {
    const k = keyOf(m);
    if (!inflight.has(k)) {
      inflight.set(k, (async () => {
        let id = m.tmdbId, media = m.mediaType || (m.kind === "series" ? "tv" : "movie");
        if (!id) {
          const r = await TMDB.find(m.title, m.year, m.kind);
          if (!r) return { fetched: Date.now(), streaming: [] };
          id = r.tmdbId; media = r.mediaType;
        }
        return TMDB.details(id, media);
      })().then((info) => { state.info[k] = info; return info; })
        .finally(() => setTimeout(() => inflight.delete(k), 0)));
    }
    return inflight.get(k);
  }

  let saveTimer;
  // Without a key we can still show real posters, from Wikipedia.
  function lookupWiki(m) {
    const k = keyOf(m);
    if (!inflight.has(k)) {
      inflight.set(k, TMDB.wikiPoster(m.title, m.year, m.kind)
        .then((poster) => { state.info[k] = { ...(state.info[k] || {}), poster, wikiFetched: Date.now() }; })
        .finally(() => setTimeout(() => inflight.delete(k), 0)));
    }
    return inflight.get(k);
  }

  async function fillPosters(root) {
    const live = TMDB.hasKey();
    const queue = [...root.querySelectorAll("[data-card]")].filter((el) => {
      const c = cardRegistry.get(el.dataset.card);
      if (!c) return false;
      const info = infoFor(c.m);
      if (live) return !(info.fetched && Date.now() - info.fetched < INFO_TTL);
      return !info.poster && !c.m.poster && !(info.wikiFetched && Date.now() - info.wikiFetched < INFO_TTL);
    });
    const lookupFn = live ? lookup : lookupWiki;
    const worker = async () => {
      while (queue.length) {
        const el = queue.shift();
        const c = cardRegistry.get(el.dataset.card);
        try { await lookupFn(c.m); } catch (e) { queue.length = 0; return; }
        if (el.isConnected) el.outerHTML = card(c.m, c.profileId, c.opts);
        cardRegistry.delete(el.dataset.card);
        clearTimeout(saveTimer); saveTimer = setTimeout(save, 500);
      }
    };
    await Promise.all([worker(), worker(), worker(), worker()]);
  }

  async function loadTmdbRecs(profileId) {
    const box = document.getElementById(`tmdb-recs-${profileId}`);
    if (!box) return;
    const recent = state.watched[profileId].filter((w) => w.tmdbId && isYay(w)).slice(-3);
    const seen = new Set(state.watched[profileId].map((w) => w.title.toLowerCase()));
    try {
      const lists = await Promise.all(recent.map((w) => TMDB.recommendations(w.tmdbId, w.mediaType).then((rs) => rs.map((r) => ({ ...r, because: w })))));
      const out = [], used = new Set();
      for (let i = 0; out.length < 8 && i < 20; i++) for (const l of lists) {
        const r = l[i];
        if (r && !used.has(r.title) && !seen.has(r.title.toLowerCase())) { used.add(r.title); out.push(r); }
      }
      box.innerHTML = out.length ? out.map((m) => card({ ...m, overview: "" }, profileId, { hide: false })).join("") : `<p class="empty">No extra picks found.</p>`;
      fillPosters(box);
    } catch (e) {
      box.innerHTML = `<p class="empty">Couldn't reach TMDB (${esc(e.message)}).</p>`;
    }
  }

  const fmtDate = (d) => new Date(d + "T12:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

  // ---------- events ----------
  function catalogItem(k) { return window.CATALOG.find((m) => keyOf(m) === k); }

  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]");
    if (!b) return;
    const { act, profile, key } = b.dataset;
    if (act === "vote") {
      const c = cardRegistry.get(b.closest("[data-card]").dataset.card);
      addWatched(profile, entryFrom(c.m, b.dataset.vote));
    } else if (act === "flip") {
      const w = state.watched[profile][Number(b.dataset.i)];
      w.vote = isYay(w) ? "nay" : "yay";
      save(); renderAffected([profile]);
    } else if (act === "hide") {
      state.hidden[profile].push(key); save(); renderPanel(profile);
    } else if (act === "unwatch") {
      state.watched[profile].splice(Number(b.dataset.i), 1); save(); renderAffected([profile]);
    } else if (act === "settings") {
      openSettings();
    }
  });

  // Rate a movie for a profile ("Both" rates it for each kid). Re-rating replaces the old vote.
  function addWatched(profile, entry) {
    const targets = PROFILES[profile].combo || [profile];
    for (const pid of targets) {
      const list = state.watched[pid];
      const at = list.findIndex((w) => w.title.toLowerCase() === entry.title.toLowerCase());
      if (at >= 0) list.splice(at, 1);
      list.push({ ...entry });
    }
    save(); renderAffected(targets.concat(profile));
  }

  // Kids' changes ripple into the "Both" panel and vice versa.
  function renderAffected(pids) {
    const set = new Set(pids);
    if (set.has("jordan") || set.has("tegan")) { set.add("both"); }
    if (set.has("both")) { set.add("jordan"); set.add("tegan"); }
    set.forEach(renderPanel);
  }

  document.addEventListener("submit", async (e) => {
    const form = e.target.closest(".add-watched");
    if (!form) return;
    e.preventDefault();
    const pid = form.dataset.profile;
    const input = form.elements.namedItem("title");
    const title = input.value.trim();
    const vote = (e.submitter && e.submitter.value) || "yay";
    if (!title) return;
    let entry = { ...toWatched(title), vote };
    if (TMDB.hasKey()) {
      try {
        const known = findInCatalog(title);
        const r = await TMDB.find(known ? known.title : title, known && known.year, known && known.kind);
        if (r && known) Object.assign(entry, { tmdbId: r.tmdbId, mediaType: r.mediaType });
        else if (r) entry = { title: r.title, year: r.year, tags: r.tags, tmdbId: r.tmdbId, mediaType: r.mediaType, vote };
      } catch (err) { /* keep plain entry */ }
    }
    addWatched(pid, entry);
    const again = document.querySelector(`#panel-${pid} .add-watched input`);
    if (again) again.focus();
  });

  // ---------- settings ----------
  function openSettings() {
    const dlg = $("#settings");
    $("#tmdb-key").value = state.tmdbKey;
    $("#services").innerHTML = TMDB.SERVICES.map((s) =>
      `<label class="check"><input type="checkbox" value="${s.id}" ${state.services.includes(s.id) ? "checked" : ""}> ${s.name}</label>`).join("");
    dlg.showModal();
  }
  $("#open-settings").addEventListener("click", openSettings);
  $("#settings-form").addEventListener("submit", (e) => {
    if (e.submitter && e.submitter.value === "cancel") return;
    state.tmdbKey = $("#tmdb-key").value.trim();
    state.services = [...document.querySelectorAll("#services input:checked")].map((i) => Number(i.value));
    TMDB.setKey(state.tmdbKey);
    save(); renderAll();
  });
  $("#reset").addEventListener("click", () => {
    if (!confirm("Reset watch history and hidden picks back to the starting lists?")) return;
    const keep = { tmdbKey: state.tmdbKey, services: state.services, info: state.info };
    state = { ...defaultState(), ...keep };
    save(); $("#settings").close(); renderAll();
  });

  // ---------- gremlins sub-tabs ----------
  document.querySelectorAll(".subtab").forEach((t) => t.addEventListener("click", () => {
    document.querySelectorAll(".subtab").forEach((x) => x.setAttribute("aria-selected", x === t));
    document.querySelectorAll(".kid-panel").forEach((p) => { p.hidden = p.id !== `panel-${t.dataset.kid}`; });
    try { localStorage.setItem(STORE + ".kidtab", t.dataset.kid); } catch (e) {}
  }));
  try {
    const last = localStorage.getItem(STORE + ".kidtab");
    if (last) { const t = document.querySelector(`.subtab[data-kid="${last}"]`); if (t) t.click(); }
  } catch (e) {}

  // ---------- boot ----------
  $("#catalog-titles").innerHTML = window.CATALOG.map((m) => `<option value="${esc(m.title)}">`).join("");
  renderSkipped();
  renderAll();
})();
