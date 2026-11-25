(() => {
  const STORE = "movienight.v1";

  // Profiles. `likes` nudges suggestions beyond the watch history.
  const PROFILES = {
    jordan: { name: "Jordan", age: 9, emoji: "🦖", icon: "img/jordan.svg", blurb: "Action, Disney, Netflix, video-game horror", likes: ["action", "disney", "netflix", "video-game"], kid: true },
    tegan: { name: "Tegan", age: 7, emoji: "🧟", icon: "img/tegan.svg", blurb: "Horror, creepy dolls, spooky stop-motion", likes: ["horror", "creepy-dolls"], kid: true },
    both: { name: "Both kids", icon: "img/both.svg", blurb: "Picks that work for Jordan and Tegan together", kid: true, combo: ["jordan", "tegan"] },
    kristine: { name: "Kristine", icon: "img/kristine.svg", blurb: "Just for you", likes: [] },
    date: { name: "Date Night", icon: "img/date-night.svg", blurb: "Kristine and Daniel", likes: [] },
  };

  // "New" rows shown at the top of each tab (need a TMDB key). Genre ids are TMDB's.
  const G = { action: 28, adventure: 12, animation: 16, comedy: 35, family: 10751, fantasy: 14, horror: 27, mystery: 9648, romance: 10749, scifi: 878, thriller: 53, drama: 18 };
  const NEW_ROWS = {
    both: [{ title: "New for the Gremlins", note: "any rating, screened for sexual content and suicide", fn: () => TMDB.newByGenre({ kids: true }) }],
    jordan: [{ title: "New for Jordan", note: "any rating, screened for sexual content and suicide", fn: () => TMDB.newByGenre({ kids: true, genres: [G.action, G.adventure, G.animation, G.scifi, G.fantasy] }) }],
    tegan: [{ title: "New for Tegan", note: "any rating, screened for sexual content and suicide", fn: () => TMDB.newByGenre({ kids: true, genres: [G.horror, G.fantasy, G.mystery, G.animation] }) }],
    kristine: [
      { title: "New in theaters", context: "theaters", fn: () => TMDB.inTheaters() },
      { title: "New on streaming", fn: () => TMDB.newByGenre({ services: state.services }) },
      { title: "New TV episodes", fn: () => TMDB.newTv({ services: state.services }) },
    ],
    date: [
      { title: "New in theaters for date night", context: "theaters", fn: () => TMDB.inTheaters([G.comedy, G.action, G.romance, G.thriller, G.mystery, G.scifi]) },
      { title: "New to stream together", fn: () => TMDB.newByGenre({ services: state.services, genres: [G.comedy, G.action, G.romance, G.thriller, G.mystery, G.scifi] }) },
      { title: "New TV to watch together", fn: () => TMDB.newTv({ services: state.services, genres: [G.comedy, G.drama, G.mystery, 10759, 10765, 80] }) },
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
      if (s && s.watched) {
        const merged = { ...defaultState(), ...s };
        // Add seed titles added since this browser last loaded (once each, so deleting one sticks).
        merged.seeded = merged.seeded || {};
        for (const [pid, titles] of Object.entries(window.SEED_WATCHED)) {
          const list = merged.watched[pid] = merged.watched[pid] || [];
          const done = new Set(merged.seeded[pid] || (pid === "kristine" || pid === "date" ? [] : titles.map((t) => toWatched(t).title.toLowerCase())));
          const adds = [];
          for (const t of titles) {
            const w = toWatched(t), k = w.title.toLowerCase();
            if (!done.has(k) && !list.some((x) => x.title.toLowerCase() === k)) adds.push(w);
            done.add(k);
          }
          list.unshift(...adds);
          merged.seeded[pid] = [...done];
        }
        if (!merged.tmdbKey) merged.tmdbKey = (window.MOVIE_NIGHT_CONFIG || {}).tmdbKey || ""; // built-in key fills in
        return merged;
      }
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
    let year;
    if (Array.isArray(title)) [title, year] = title; // seed entries can pin a year: ["The Mummy", 2026]
    const m = findInCatalog(title, year);
    return m ? { title: m.title, year: m.year, tags: m.tags, kind: m.kind, vote: "yay" } : { title, tags: [], vote: "yay" };
  }
  const entryFrom = (m, vote) => ({ title: m.title, year: m.year, tags: m.tags || [], kind: m.kind, tmdbId: m.tmdbId, mediaType: m.mediaType, vote });
  const isYay = (w) => w.vote !== "nay";

  // ---------- recommendation engine ----------
  // Tags on a YAY add weight, tags on a NAY take weight away, and the profile's
  // "likes" add a little more. A movie's score is how well its tags fit.
  const VOTE_WEIGHT = { yay: 1, nay: -1.25 };
  // Newer votes count up to 50% more, so tastes can change over time.
  // "Not interested" teaches a little too (half a Nay).
  function tagWeights(profileId) {
    const p = PROFILES[profileId];
    const w = {};
    const add = (tags, v) => { for (const t of tags || []) w[t] = (w[t] || 0) + v; };
    const list = state.watched[profileId] || [];
    list.forEach((m, i) => {
      const recency = 1 + 0.5 * (list.length > 1 ? i / (list.length - 1) : 1);
      add(m.tags, (VOTE_WEIGHT[m.vote] ?? 0.5) * recency);
    });
    for (const k of state.hidden[profileId] || []) {
      const m = window.CATALOG.find((c) => keyOf(c) === k) || (state.hiddenTags || {})[k];
      if (m) add(m.tags, VOTE_WEIGHT.nay / 2);
    }
    for (const t of p.likes || []) w[t] = (w[t] || 0) + 1.5;
    return w;
  }

  // Plain-English summary of what the picks have learned, shown in each tab.
  const TAG_NAMES = {
    "video-game": "video-game movies", "kids-on-bikes": "kids-on-an-adventure stories", "creepy-dolls": "creepy dolls",
    "killer-toys": "killer toys", "stop-motion": "stop-motion", "dark-fantasy": "dark fantasy", "haunted-house": "haunted houses",
    "creepy-kids-book": "spooky book adaptations", "board-game": "board-game adventures", "sci-fi": "sci-fi", "creatures": "creature features",
    "monster": "monsters", "ghost": "ghosts", "curse": "curses", "action": "action", "adventure": "adventure", "comedy": "comedy",
    "horror": "horror", "aliens": "aliens", "dinosaurs": "dinosaurs", "robots": "robots", "survival": "survival stories",
    "witches": "witches", "mummy": "mummies", "demons": "demons", "zombies": "zombies", "superhero": "superheroes", "animation": "animation",
    "disney": "Disney", "netflix": "Netflix", "cartoon": "cartoons", "slasher": "slashers", "jungle": "jungle adventures", "musical": "musicals",
  };
  const TAG_LABEL = (t) => TAG_NAMES[t] || t.replace(/-/g, " ");
  const listify = (a) => a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1];

  // A short, plain-English synopsis of what the two kids like, from their ratings.
  function bothSynopsis() {
    const wJ = tagWeights("jordan"), wT = tagWeights("tegan");
    const tags = [...new Set([...Object.keys(wJ), ...Object.keys(wT)])];
    const j = (t) => wJ[t] || 0, tg = (t) => wT[t] || 0;
    const shared = tags.filter((t) => j(t) > 0.75 && tg(t) > 0.75).sort((a, b) => Math.min(j(b), tg(b)) - Math.min(j(a), tg(a))).slice(0, 4);
    const jOnly = tags.filter((t) => j(t) > 1 && tg(t) <= 0.75).sort((a, b) => j(b) - j(a)).slice(0, 3);
    const tOnly = tags.filter((t) => tg(t) > 1 && j(t) <= 0.75).sort((a, b) => tg(b) - tg(a)).slice(0, 3);
    // Just the best bet for both: the tastes they share, plus the top pick right now.
    const bet = (shared.length ? shared : [...jOnly.slice(0, 1), ...tOnly.slice(0, 1)]).slice(0, 2).map(TAG_LABEL);
    const top = suggestions("both")[0];
    let out = bet.length ? `Best bet for both: <b>${esc(listify(bet))}</b>` : "Best bet for both: rate a few more to find out";
    if (top) out += `, like <b>${esc(top.title)}</b>`;
    out += ".";
    return out;
  }
  function learnedHtml(profileId) {
    const members = PROFILES[profileId].combo || [profileId];
    const votes = members.reduce((n, pid) => n + state.watched[pid].length + (state.hidden[pid] || []).length, 0);
    if (!votes) return "";
    const w = {};
    for (const pid of members) for (const [t, v] of Object.entries(tagWeights(pid))) w[t] = (w[t] || 0) + v;
    const sorted = Object.entries(w).sort((a, b) => b[1] - a[1]);
    const likes = sorted.filter(([, v]) => v > 0.75).slice(0, 5).map(([t]) => TAG_LABEL(t));
    const nos = sorted.filter(([, v]) => v < -0.5).reverse().slice(0, 4).map(([t]) => TAG_LABEL(t));
    if (!likes.length && !nos.length) return "";
    return `<p class="learned">🧠 Learned from ${votes} rating${votes === 1 ? "" : "s"}:
      ${likes.length ? `more <b>${likes.join(", ")}</b>` : ""}${likes.length && nos.length ? "; " : ""}${nos.length ? `less <b>${nos.join(", ")}</b>` : ""}.</p>`;
  }

  function scoreFor(profileId, movie) {
    const w = tagWeights(profileId);
    const raw = movie.tags.reduce((s, t) => s + (w[t] || 0), 0);
    return raw / Math.sqrt(movie.tags.length || 1);
  }

  // Live TMDB lists: keep only movies that fit this profile's taste, best first.
  // Until someone has rated anything there's nothing to go on, so we show nothing.
  const MIN_FIT = 0.6;
  function tasteFilter(profileId, items, limit = 14) {
    const members = PROFILES[profileId].combo || [profileId];
    const trained = members.some((pid) => (state.watched[pid] || []).length || (state.hidden[pid] || []).length);
    const scored = items
      .map((m, i) => ({ m, i, score: members.reduce((s, pid) => s + scoreFor(pid, m), 0) / members.length }))
      .sort((a, b) => b.score - a.score || a.i - b.i);
    if (!trained) return { items: [], trained };
    // Must fit overall AND share something with a movie they gave a Yay.
    return { items: scored.filter((x) => x.score >= MIN_FIT && becauseOf(members, x.m)).slice(0, limit).map((x) => ({ ...x.m, because: x.m.because || becauseOf(members, x.m) })), trained };
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
      // Drop add-on channels ("Paramount+ Roku Premium Channel") and duplicates ("AMC Plus" vs "AMC+"),
      // put your services first, and show at most two pills plus a "+N".
      const norm = (n) => n.toLowerCase().replace(/\bplus\b/g, "+").replace(/[^a-z0-9+]/g, "");
      const seen = new Set();
      const list = info.streaming
        .filter((n) => !/(channel|amazon channel|with ads)$/i.test(n))
        .filter((n) => { const k = norm(n); if (seen.has(k)) return false; seen.add(k); return true; })
        .sort((a, b) => (mine.has(ids[b]) ? 1 : 0) - (mine.has(ids[a]) ? 1 : 0));
      const shown = (list.length ? list : info.streaming).slice(0, 2);
      const extra = (list.length ? list : info.streaming).length - shown.length;
      return `<div class="where">${shown.map((n) =>
        `<span class="svc${mine.has(ids[n]) ? " mine" : ""}">${esc(n)}</span>`).join("")}${extra > 0 ? `<span class="svc more" title="${esc(list.slice(2).join(", "))}">+${extra}</span>` : ""}</div>`;
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
    return `<article class="card" data-card="${id}" data-title="${esc(normTitle(m.title))}">
      ${posterHtml(m, info)}
      <div class="card-body">
        <h4>${esc(m.title)}</h4>
        ${infoLine(m, info, opts)}
        ${whereHtml(m, info, opts)}
        ${m.seasonNote ? `<div class="season-note">🔔 ${esc(m.seasonNote)}</div>` : ""}
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
    const all = suggestions(profileId);
    // Grown-up profiles get separate rows for movies and TV shows.
    const picks = (p.kid ? all : all.filter((m) => m.kind !== "series")).slice(0, 24);
    const shows = p.kid ? [] : all.filter((m) => m.kind === "series").slice(0, 24);
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
      ? `<h4 class="row-title">More like your recent watches</h4><div class="grid scroller" id="tmdb-recs-${profileId}"><p class="empty">Loading…</p></div>` : "";
    return `
      <div class="panel-head">
        <div class="avatar">${p.icon ? `<img src="${p.icon}" alt="">` : p.emoji}</div>
        <div><h3>${esc(p.name)}${p.age ? ` <small>age ${p.age}</small>` : ""}</h3><p class="blurb">${esc(p.blurb)}</p>${profileId === "both" ? `<p class="synopsis">${bothSynopsis()}</p>` : ""}</div>
      </div>
      <div id="seasons-${profileId}" class="seasons" hidden></div>
      ${newRowsHtml(profileId)}
      ${watchedBlock}
      <h4 class="row-title">${p.kid ? "Suggestions" : "Movie suggestions"}</h4>
      ${learnedHtml(profileId)}
      <div class="grid scroller">${picks.length ? picks.map((m) => card(m, profileId)).join("") : `<p class="empty">You've seen everything on the list! Add more to <code>js/catalog.js</code>.</p>`}</div>
      ${p.kid ? "" : `<h4 class="row-title">Show suggestions</h4>
      <div class="grid scroller">${shows.length ? shows.map((m) => card(m, profileId)).join("") : `<p class="empty">You've seen every show on the list!</p>`}</div>`}
      ${tmdbRow}`;
  }

  function newRowsHtml(profileId) {
    if (!TMDB.hasKey()) return `<p class="setup-inline">🆕 Want to see what's new in theaters and on streaming here? Add a free TMDB key in <button class="linklike" data-act="settings">Settings</button>.</p>`;
    return NEW_ROWS[profileId].map((r, i) => `<h4 class="row-title new-title">${esc(r.title)}${r.note ? ` <small>(${esc(r.note)}. Still check the parents' guide)</small>` : ""}</h4>
      <div class="grid scroller" id="new-${profileId}-${i}"><p class="empty">Loading…</p></div>`).join("");
  }

  // New seasons of shows this profile rated Yay: coming soon, or just started.
  async function loadSeasonNews(profileId) {
    if (!TMDB.hasKey()) return;
    const box = document.getElementById(`seasons-${profileId}`);
    const seen = new Set();
    const shows = (PROFILES[profileId].combo || [profileId]).flatMap((pid) => state.watched[pid] || [])
      .filter((w) => isYay(w) && (w.kind === "series" || w.mediaType === "tv"))
      .filter((w) => { const k = w.title.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
    if (!box || !shows.length) return;
    const items = await TMDB.seasonNews(shows);
    if (!box.isConnected || !items.length) return;
    box.innerHTML = `<h4 class="row-title">🔔 New seasons of shows you liked</h4>
      <div class="grid scroller">${items.map((m) => card(m, profileId, { actions: false })).join("")}</div>`;
    box.hidden = false;
    fillPosters(box);
  }

  async function loadNewRows(profileId) {
    if (!TMDB.hasKey()) return;
    const watched = new Set((PROFILES[profileId].combo || [profileId]).flatMap((pid) => state.watched[pid]).map((w) => w.title.toLowerCase()));
    const hidden = new Set(state.hidden[profileId]);
    NEW_ROWS[profileId].forEach(async (row, i) => {
      const box = document.getElementById(`new-${profileId}-${i}`);
      try {
        const { items, trained } = tasteFilter(profileId,
          (await row.fn()).filter((m) => !watched.has(m.title.toLowerCase()) && !hidden.has(keyOf(m))));
        if (!box.isConnected) return;
        if (!trained && !(box.previousElementSibling && box.previousElementSibling.classList.contains("untrained-note"))) {
          box.insertAdjacentHTML("beforebegin", `<p class="untrained-note">Rate a few movies you've watched with 👍/👎 and new ones that fit will show up here.</p>`);
        }
        box.innerHTML = (items.length
            ? items.map((m) => card({ ...m, overview: "" }, profileId, { showDate: true, context: row.context })).join("")
            : `<p class="empty">${trained ? "Nothing new that fits right now. Check back soon." : ""}</p>`);
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
    loadSeasonNews(profileId);
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

  // Each title shows once per tab: the first row it lands in (top of the page) keeps it.
  const normTitle = (t) => String(t || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  function dedupePanel(panel) {
    if (!panel) return;
    const seen = new Set();
    panel.querySelectorAll(".card[data-title]").forEach((c) => {
      const k = c.dataset.title;
      c.hidden = seen.has(k);
      seen.add(k);
    });
  }

  async function fillPosters(root) {
    dedupePanel(root.closest ? (root.closest(".panel") || root) : root);
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
        if (el.isConnected) { const hid = el.hidden; el.outerHTML = card(c.m, c.profileId, c.opts); if (hid) { const n = root.querySelector(`[data-card="c${cardSeq}"]`); if (n) n.hidden = true; } }
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
      for (let i = 0; i < 20; i++) for (const l of lists) {
        const r = l[i];
        if (r && !used.has(r.title) && !seen.has(r.title.toLowerCase()) && !(state.hidden[profileId] || []).includes(keyOf(r))) { used.add(r.title); out.push(r); }
      }
      out.splice(0, out.length, ...tasteFilter(profileId, out, 8).items);
      box.innerHTML = out.length ? out.map((m) => card({ ...m, overview: "" }, profileId, { hide: false })).join("") : `<p class="empty">Nothing else that fits right now.</p>`;
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
      for (const pid of new Set([profile, ...(PROFILES[profile].combo || [])])) state.hidden[pid].push(key);
      const c = cardRegistry.get((b.closest("[data-card]") || {}).dataset?.card);
      if (c && !catalogItem(key)) (state.hiddenTags = state.hiddenTags || {})[key] = { tags: c.m.tags || [] };
      save(); renderAffected([profile]);
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
