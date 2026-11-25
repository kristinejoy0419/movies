// Tiny TMDB client. Works with either a v3 API key or a v4 "API Read Access Token".
// Get one free at https://www.themoviedb.org/settings/api

window.TMDB = (() => {
  const BASE = "https://api.themoviedb.org/3";
  const IMG = "https://image.tmdb.org/t/p/";
  const REGION = "US";

  // TMDB genre ids -> our catalog tags, so titles you type in still steer suggestions.
  const GENRE_TAGS = {
    28: "action", 12: "adventure", 16: "animation", 35: "comedy", 80: "crime",
    99: "documentary", 18: "drama", 10751: "family", 14: "fantasy", 36: "history",
    27: "horror", 10402: "musical", 9648: "mystery", 10749: "romance", 878: "sci-fi",
    53: "thriller", 10752: "war", 37: "western",
    // TV genres
    10759: "action", 10762: "family", 10765: "sci-fi", 10768: "war",
  };

  // Streaming services people can pick in Settings (TMDB watch-provider ids, US).
  const SERVICES = [
    { id: 8, name: "Netflix" },
    { id: 337, name: "Disney+" },
    { id: 9, name: "Prime Video" },
    { id: 1899, name: "Max" },
    { id: 15, name: "Hulu" },
    { id: 350, name: "Apple TV+" },
    { id: 531, name: "Paramount+" },
    { id: 386, name: "Peacock" },
  ];

  let key = "";
  const setKey = (k) => { key = (k || "").trim(); };
  const hasKey = () => !!key;

  async function get(path, params = {}) {
    if (!key) throw new Error("No TMDB key");
    const url = new URL(BASE + path);
    const isToken = key.startsWith("eyJ");
    if (!isToken) url.searchParams.set("api_key", key);
    url.searchParams.set("language", "en-US");
    for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") url.searchParams.set(k, v);
    const res = await fetch(url, isToken ? { headers: { Authorization: `Bearer ${key}` } } : {});
    if (!res.ok) throw new Error(`TMDB ${res.status}`);
    return res.json();
  }

  const isoDaysAgo = (n) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
  const today = () => new Date().toISOString().slice(0, 10);

  // Find a title (movie or series) by name. Returns a normalized object or null.
  async function find(title, year, kind = "movie") {
    const path = kind === "series" ? "/search/tv" : "/search/movie";
    const params = { query: title, include_adult: "false" };
    if (year) params[kind === "series" ? "first_air_date_year" : "year"] = year;
    let data = await get(path, params);
    if (!data.results.length && kind === "movie") data = await get("/search/tv", { query: title });
    const r = data.results[0];
    return r ? normalize(r) : null;
  }

  function normalize(r) {
    return {
      tmdbId: r.id,
      mediaType: r.title ? "movie" : "tv",
      title: r.title || r.name,
      year: Number((r.release_date || r.first_air_date || "").slice(0, 4)) || undefined,
      poster: r.poster_path ? IMG + "w342" + r.poster_path : "",
      overview: r.overview || "",
      date: r.release_date || r.first_air_date || "",
      score: r.vote_count >= 20 ? Math.round(r.vote_average * 10) / 10 : null,
      tags: [...new Set((r.genre_ids || []).map((g) => GENRE_TAGS[g]).filter(Boolean))],
    };
  }

  const list = (data) => data.results.filter((r) => !r.adult).map(normalize);

  const nowPlaying = async () => list(await get("/movie/now_playing", { region: REGION }));

  const newOnStreaming = async (serviceIds) => list(await get("/discover/movie", {
    watch_region: REGION,
    with_watch_monetization_types: "flatrate",
    with_watch_providers: (serviceIds && serviceIds.length ? serviceIds : SERVICES.map((s) => s.id)).join("|"),
    "primary_release_date.gte": isoDaysAgo(150),
    "primary_release_date.lte": today(),
    sort_by: "popularity.desc",
    include_adult: "false",
  }));

  // New releases rated G or PG in the US (theaters or streaming).
  const newForKids = async () => list(await get("/discover/movie", {
    certification_country: REGION,
    "certification.lte": "PG",
    "primary_release_date.gte": isoDaysAgo(150),
    "primary_release_date.lte": today(),
    sort_by: "popularity.desc",
    include_adult: "false",
    "vote_count.gte": 5,
  }));

  // Rating, score, poster and where it's streaming (US), in one call.
  async function details(tmdbId, mediaType = "movie") {
    const isTv = mediaType === "tv";
    const d = await get(`/${mediaType}/${tmdbId}`, {
      append_to_response: (isTv ? "content_ratings" : "release_dates") + ",watch/providers",
    });
    let rating = "";
    if (isTv) {
      rating = ((d.content_ratings?.results || []).find((r) => r.iso_3166_1 === REGION) || {}).rating || "";
    } else {
      const us = (d.release_dates?.results || []).find((r) => r.iso_3166_1 === REGION);
      rating = ((us?.release_dates || []).find((x) => x.certification) || {}).certification || "";
    }
    const wp = (d["watch/providers"]?.results || {})[REGION] || {};
    const names = (arr) => [...new Set((arr || []).sort((a, b) => a.display_priority - b.display_priority).map((p) => cleanProvider(p.provider_name)))];
    return {
      tmdbId: d.id,
      mediaType,
      rating,
      score: d.vote_count >= 20 ? Math.round(d.vote_average * 10) / 10 : null,
      poster: d.poster_path ? IMG + "w342" + d.poster_path : "",
      streaming: names(wp.flatrate).concat(names(wp.free), names(wp.ads)).filter((v, i, a) => a.indexOf(v) === i).slice(0, 4),
      providerIds: (wp.flatrate || []).map((p) => p.provider_id),
      rentBuy: !!((wp.rent && wp.rent.length) || (wp.buy && wp.buy.length)),
      link: wp.link || "",
      fetched: Date.now(),
    };
  }
  // "Netflix Standard with Ads" -> "Netflix", "Amazon Prime Video" -> "Prime Video", etc.
  function cleanProvider(n) {
    return n.replace(/ (Standard )?with Ads$/i, "").replace(/ Amazon Channel$/i, "").replace(/ Apple TV Channel$/i, "")
      .replace(/^Amazon Prime Video$/i, "Prime Video").replace(/^Disney Plus$/i, "Disney+").replace(/^Paramount Plus.*$/i, "Paramount+")
      .replace(/^Peacock Premium.*$/i, "Peacock").replace(/^HBO Max$/i, "Max");
  }

  const recommendations = async (tmdbId, mediaType = "movie") =>
    list(await get(`/${mediaType}/${tmdbId}/recommendations`));

  return { setKey, hasKey, find, details, nowPlaying, newOnStreaming, newForKids, recommendations, SERVICES };
})();
