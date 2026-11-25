# 🍿 Movie Night

A small static site that suggests movies for our house, based on what we've watched.

- **Gremlins** (the kids, main use): separate tabs for **Jordan** (9, action), **Tegan** (7, horror) and **Both**. Scary and gory is fine; anything with sexual content or innuendo is left out (see "Left out on purpose" on the page).
- **Kristine** and **Date Night**: their own watch history and suggestions.
- Each tab opens with a **New** row (new G/PG releases for the kids; in theaters and new on your streaming services for the grown-ups). Anything released in the last 45 days gets a **NEW!** sticker.

Every card shows the poster, rating (G/PG/PG-13/R or TV rating), TMDB score, and which streaming services have it, with your own services highlighted. Without a TMDB key, posters come from Wikipedia.

## How suggestions work

`js/catalog.js` is a hand-picked list of movies, each with tags (horror, killer-toys, stop-motion, video-game…) and who it's for. Each profile's watch history builds up tag weights, and the catalog is ranked by how well it overlaps. Rate anything you've watched **👍 Yay** or **👎 Nay**, from a card or by typing it into the "Already watched something?" box. Yays pull similar movies up, Nays push them down, and **Not interested** just hides a pick. Tap the 👍/👎 on a watched movie to flip it. History is saved in the browser (localStorage).

To add movies, add a line to `js/catalog.js`. For anything tagged `jordan` or `tegan`, check the parents' guide for sexual content first.

## Live data (TMDB)

Ratings, streaming services, posters and the **New** rows come from [TMDB](https://www.themoviedb.org/), which is free:

1. Make an account at themoviedb.org and go to **Settings → API**.
2. Copy the **API Key** (or the **API Read Access Token**).
3. Open the site, click **⚙︎ Settings**, paste it, and tick the streaming services you have.

To skip the paste on every device, put the key in `js/config.js` instead.

## Hosting

No build step. Any static host works:

- **GitHub Pages**: repo Settings → Pages → Deploy from branch → `main` / root. (Pages on a private repo needs a paid GitHub plan.)
- **Netlify / Cloudflare Pages**: point it at this repo, no build command, publish directory `/`.
- **Locally**: open `index.html` in a browser.
