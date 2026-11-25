# 🍿 Movie Night

A small static site that suggests movies for our house, based on what we've watched.

- **Gremlins** (the kids, main use): separate tabs for **Jordan** (9, action), **Tegan** (7, horror) and **Both**. Scary and gory is fine; anything with sexual content or innuendo is left out (see "Left out on purpose" on the page).
- **New now**: in theaters, new on your streaming services, and new G/PG releases for the kids.
- **Kristine** and **Date Night**: their own watch history and suggestions.

Every card shows the rating (G/PG/PG-13/R or TV rating), the TMDB score, and which streaming services have it, with your own services highlighted.

## How suggestions work

`js/catalog.js` is a hand-picked list of movies, each with tags (horror, killer-toys, stop-motion, video-game…) and who it's for. Each profile's watch history builds up tag weights, and the catalog is ranked by how well it overlaps. Mark something **✓ Watched** or **Not for us** and the list updates. History is saved in the browser (localStorage).

To add movies, add a line to `js/catalog.js`. For anything tagged `jordan` or `tegan`, check the parents' guide for sexual content first.

## Live data (TMDB)

Ratings, streaming services, posters and the **New now** section come from [TMDB](https://www.themoviedb.org/), which is free:

1. Make an account at themoviedb.org and go to **Settings → API**.
2. Copy the **API Key** (or the **API Read Access Token**).
3. Open the site, click **⚙︎ Settings**, paste it, and tick the streaming services you have.

To skip the paste on every device, put the key in `js/config.js` instead.

## Hosting

No build step. Any static host works:

- **GitHub Pages**: repo Settings → Pages → Deploy from branch → `main` / root. (Pages on a private repo needs a paid GitHub plan.)
- **Netlify / Cloudflare Pages**: point it at this repo, no build command, publish directory `/`.
- **Locally**: open `index.html` in a browser.
