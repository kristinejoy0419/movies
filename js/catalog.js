// Hand-picked catalog that powers the offline suggestions.
//
// Fields:
//   title, year, rating     - MPAA / TV rating
//   kind                    - "movie" (default) or "series"
//   tags                    - what the movie is "about"; used to match against what you've watched
//   for                     - which profiles this can be suggested to: jordan, tegan, kristine, date
//   note                    - short heads-up for parents (kid picks only)
//
// Rule for anything tagged jordan/tegan: NO sexual content or sexual innuendo,
// NO suicide or self-harm, and nothing that spoils Santa.
// Violence, gore and scares are fine (house rule from Kristine).

window.CATALOG = [
  // ---------- Already-watched favorites (seed the kids' history) ----------
  { title: "Jumanji: Welcome to the Jungle", year: 2017, rating: "PG-13", tags: ["action", "adventure", "comedy", "video-game", "jungle"], for: [] },
  { title: "Jumanji", year: 1995, rating: "PG", tags: ["action", "adventure", "fantasy", "board-game", "jungle", "creatures"], for: [] },
  { title: "Five Nights at Freddy's", year: 2023, rating: "PG-13", tags: ["horror", "video-game", "killer-toys", "creatures", "mystery"], for: [] },
  { title: "Five Nights at Freddy's 2", year: 2025, rating: "PG-13", tags: ["horror", "video-game", "killer-toys", "creatures", "mystery"], for: [] },
  { title: "A Quiet Place", year: 2018, rating: "PG-13", tags: ["horror", "survival", "aliens", "creatures", "thriller"], for: [] },
  { title: "The Simpsons Movie", year: 2007, rating: "PG-13", tags: ["animation", "comedy", "cartoon"], for: [] },
  { title: "Stranger Things", year: 2016, rating: "TV-14", kind: "series", tags: ["sci-fi", "horror", "kids-on-bikes", "creatures", "80s", "mystery"], for: [] },
  { title: "Coraline", year: 2009, rating: "PG", tags: ["horror", "stop-motion", "animation", "dark-fantasy", "creepy-dolls", "witches"], for: [] },
  { title: "The Witches", year: 1990, rating: "PG", tags: ["horror", "witches", "dark-fantasy", "creepy-kids-book"], for: [] },
  { title: "Child's Play", year: 1988, rating: "R", tags: ["horror", "killer-toys", "creepy-dolls", "slasher"], for: [] },
  { title: "The Ring", year: 2002, rating: "PG-13", tags: ["horror", "ghost", "mystery", "curse"], for: [] },
  { title: "The Mummy", year: 1999, rating: "PG-13", tags: ["action", "adventure", "horror", "mummy", "curse", "monster"], for: [] },

  // ---------- Gremlins: Tegan (spooky) ----------
  { title: "ParaNorman", year: 2012, rating: "PG", tags: ["horror", "stop-motion", "animation", "ghost", "zombies", "curse", "witches"], for: ["tegan", "jordan"], note: "Zombies and ghosts, a little crude humor." },
  { title: "Monster House", year: 2006, rating: "PG", tags: ["horror", "animation", "haunted-house", "monster", "kids-on-bikes"], for: ["tegan", "jordan"], note: "Genuinely scary in spots." },
  { title: "Corpse Bride", year: 2005, rating: "PG", tags: ["stop-motion", "animation", "dark-fantasy", "ghost", "musical"], for: ["tegan"], note: "Skeletons and spooky imagery, very gentle." },
  { title: "Frankenweenie", year: 2012, rating: "PG", tags: ["stop-motion", "animation", "monster", "dark-fantasy", "pets"], for: ["tegan", "jordan"], note: "Monster pets, a sad dog moment." },
  { title: "The Nightmare Before Christmas", year: 1993, rating: "PG", tags: ["stop-motion", "animation", "dark-fantasy", "musical", "holiday"], for: ["tegan"], note: "Mild scary images." },
  { title: "The Boxtrolls", year: 2014, rating: "PG", tags: ["stop-motion", "animation", "dark-fantasy", "creatures"], for: ["tegan"], note: "From the Coraline studio (Laika)." },
  { title: "Wendell & Wild", year: 2022, rating: "PG-13", tags: ["stop-motion", "animation", "dark-fantasy", "demons"], for: ["tegan"], note: "From the Coraline director. Some language." },
  { title: "The Witches", year: 2020, rating: "PG", tags: ["horror", "witches", "dark-fantasy", "creepy-kids-book"], for: ["tegan"], note: "Remake of the 1990 version she loves." },
  { title: "The House with a Clock in Its Walls", year: 2018, rating: "PG", tags: ["horror", "witches", "haunted-house", "creepy-dolls", "dark-fantasy"], for: ["tegan", "jordan"], note: "Creepy dolls and a scary witch." },
  { title: "Goosebumps", year: 2015, rating: "PG", tags: ["horror", "comedy", "monster", "creepy-dolls", "creepy-kids-book", "adventure"], for: ["tegan", "jordan"], note: "Slappy the dummy is a fun Chucky-lite." },
  { title: "M3GAN", year: 2022, rating: "PG-13", tags: ["horror", "killer-toys", "creepy-dolls", "sci-fi"], for: ["tegan"], note: "Killer doll, violence. If she likes Chucky, this is a hit." },
  { title: "Child's Play 2", year: 1990, rating: "R", tags: ["horror", "killer-toys", "creepy-dolls", "slasher"], for: ["tegan"], note: "Same as the first: violence, language. (Bride of Chucky and later are skipped, see below.)" },
  { title: "Annabelle: Creation", year: 2017, rating: "R", tags: ["horror", "creepy-dolls", "ghost", "demons"], for: ["tegan"], note: "Very intense, scary doll. No sexual content." },
  { title: "Scary Stories to Tell in the Dark", year: 2019, rating: "PG-13", tags: ["horror", "creepy-kids-book", "monster", "curse", "kids-on-bikes"], for: ["tegan", "jordan"], note: "Creature scares, some gore." },
  { title: "Poltergeist", year: 1982, rating: "PG", tags: ["horror", "ghost", "haunted-house", "creepy-dolls"], for: ["tegan", "jordan"], note: "The clown doll scene! Parents briefly smoke pot." },
  { title: "Insidious", year: 2010, rating: "PG-13", tags: ["horror", "ghost", "demons", "haunted-house"], for: ["tegan"], note: "Lots of jump scares." },
  { title: "The Mummy", year: 2026, rating: "R", tags: ["horror", "mummy", "curse", "demons", "creepy-kids"], for: [] },
  { title: "The Mummy Returns", year: 2001, rating: "PG-13", tags: ["action", "adventure", "horror", "mummy", "curse", "monster"], for: ["tegan", "jordan"], note: "Same vibe as The Mummy." },
  { title: "The Watcher in the Woods", year: 1980, rating: "PG", tags: ["horror", "ghost", "mystery", "disney"], for: ["tegan"], note: "Old-school Disney spooky." },
  { title: "Haunted Mansion", year: 2023, rating: "PG-13", tags: ["horror", "comedy", "ghost", "haunted-house", "disney"], for: ["tegan", "jordan"], note: "Spooky but silly." },
  { title: "Over the Garden Wall", year: 2014, rating: "TV-PG", kind: "series", tags: ["animation", "dark-fantasy", "creatures", "cartoon"], for: ["tegan"], note: "10 short episodes, perfect fall watch." },

  // ---------- Gremlins: both kids ----------
  { title: "Ghostbusters: Afterlife", year: 2021, rating: "PG-13", tags: ["action", "comedy", "ghost", "kids-on-bikes", "sci-fi"], for: ["tegan", "jordan"], note: "Fine for kids. (The 1984 original is skipped, see below.)" },
  { title: "A Quiet Place Part II", year: 2021, rating: "PG-13", tags: ["horror", "survival", "aliens", "creatures", "thriller"], for: ["jordan", "tegan"], note: "Creature violence, tense." },
  { title: "A Quiet Place: Day One", year: 2024, rating: "PG-13", tags: ["horror", "survival", "aliens", "creatures", "thriller"], for: ["jordan", "tegan"], note: "Creature violence, sad ending." },

  // ---------- Gremlins: Jordan (action) ----------
  { title: "Jumanji: The Next Level", year: 2019, rating: "PG-13", tags: ["action", "adventure", "comedy", "video-game", "jungle"], for: ["jordan"], note: "Same humor level as Welcome to the Jungle." },
  { title: "Zathura: A Space Adventure", year: 2005, rating: "PG", tags: ["action", "adventure", "board-game", "sci-fi", "aliens"], for: ["jordan", "tegan"], note: "Basically Jumanji in space." },
  { title: "Night at the Museum", year: 2006, rating: "PG", tags: ["action", "adventure", "comedy", "fantasy"], for: ["jordan"], note: "Mild peril." },
  { title: "Spider-Man: Into the Spider-Verse", year: 2018, rating: "PG", tags: ["action", "animation", "superhero"], for: ["jordan"], note: "Action violence." },
  { title: "Spider-Man: Across the Spider-Verse", year: 2023, rating: "PG", tags: ["action", "animation", "superhero"], for: ["jordan"], note: "Action violence, cliffhanger ending." },
  { title: "The Mitchells vs. the Machines", year: 2021, rating: "PG", tags: ["action", "animation", "comedy", "sci-fi", "robots", "netflix"], for: ["jordan", "tegan"], note: "Netflix. Robot apocalypse, very funny." },
  { title: "The Sea Beast", year: 2022, rating: "PG", tags: ["action", "adventure", "animation", "monster", "netflix"], for: ["jordan", "tegan"], note: "Netflix. Sea monsters, action peril." },
  { title: "Big Hero 6", year: 2014, rating: "PG", tags: ["action", "animation", "superhero", "robots", "disney"], for: ["jordan"], note: "Disney. A sad loss early on." },
  { title: "The Incredibles", year: 2004, rating: "PG", tags: ["action", "animation", "superhero", "disney"], for: ["jordan"], note: "Disney/Pixar. Action violence." },
  { title: "Incredibles 2", year: 2018, rating: "PG", tags: ["action", "animation", "superhero", "disney"], for: ["jordan"], note: "Disney/Pixar. Flashing-light scenes." },
  { title: "Raya and the Last Dragon", year: 2021, rating: "PG", tags: ["action", "adventure", "animation", "fantasy", "disney"], for: ["jordan"], note: "Disney. Sword fights." },
  { title: "Sonic the Hedgehog", year: 2020, rating: "PG", tags: ["action", "comedy", "video-game"], for: ["jordan"], note: "Light action." },
  { title: "Sonic the Hedgehog 3", year: 2024, rating: "PG", tags: ["action", "comedy", "video-game"], for: ["jordan"], note: "Light action." },
  { title: "The Super Mario Bros. Movie", year: 2023, rating: "PG", tags: ["action", "animation", "comedy", "video-game"], for: ["jordan", "tegan"], note: "Cartoon action." },
  { title: "Transformers One", year: 2024, rating: "PG", tags: ["action", "animation", "sci-fi", "robots"], for: ["jordan"], note: "Robot fights." },
  { title: "How to Train Your Dragon", year: 2025, rating: "PG", tags: ["action", "adventure", "fantasy", "creatures"], for: ["jordan", "tegan"], note: "Live-action remake. Dragon battles." },
  { title: "Jurassic Park", year: 1993, rating: "PG-13", tags: ["action", "adventure", "sci-fi", "dinosaurs", "creatures", "survival"], for: ["jordan", "tegan"], note: "Scary dino attacks." },
  { title: "Jurassic World Rebirth", year: 2025, rating: "PG-13", tags: ["action", "adventure", "sci-fi", "dinosaurs", "creatures", "survival"], for: ["jordan"], note: "Dino violence, some gore." },
  { title: "Godzilla x Kong: The New Empire", year: 2024, rating: "PG-13", tags: ["action", "sci-fi", "monster", "creatures"], for: ["jordan"], note: "Giant monster brawls." },
  { title: "Super 8", year: 2011, rating: "PG-13", tags: ["sci-fi", "horror", "aliens", "kids-on-bikes", "creatures", "mystery"], for: ["jordan"], note: "Stranger Things before Stranger Things. Some language." },
  { title: "War of the Worlds", year: 2005, rating: "PG-13", tags: ["action", "sci-fi", "aliens", "survival", "thriller"], for: ["jordan"], note: "Intense alien attacks." },
  { title: "Real Steel", year: 2011, rating: "PG-13", tags: ["action", "sci-fi", "robots", "sports"], for: ["jordan"], note: "Robot boxing, some language." },

  // ---------- Kristine ----------
  { title: "Knives Out", year: 2019, rating: "PG-13", tags: ["mystery", "comedy", "whodunit"], for: ["kristine", "date"] },
  { title: "Wake Up Dead Man: A Knives Out Mystery", year: 2025, rating: "PG-13", tags: ["mystery", "comedy", "whodunit"], for: ["kristine", "date"] },
  { title: "Past Lives", year: 2023, rating: "PG-13", tags: ["drama", "romance"], for: ["kristine", "date"] },
  { title: "Everything Everywhere All at Once", year: 2022, rating: "R", tags: ["sci-fi", "action", "comedy", "drama"], for: ["kristine", "date"] },
  { title: "Sinners", year: 2025, rating: "R", tags: ["horror", "thriller", "drama", "vampires"], for: ["kristine", "date"] },
  { title: "Weapons", year: 2025, rating: "R", tags: ["horror", "mystery", "thriller"], for: ["kristine"] },
  { title: "Get Out", year: 2017, rating: "R", tags: ["horror", "thriller", "mystery"], for: ["kristine", "date"] },
  { title: "Hereditary", year: 2018, rating: "R", tags: ["horror", "drama", "demons"], for: ["kristine"] },
  { title: "Conclave", year: 2024, rating: "PG", tags: ["drama", "thriller", "mystery"], for: ["kristine"] },
  { title: "The Holdovers", year: 2023, rating: "R", tags: ["drama", "comedy", "holiday"], for: ["kristine"] },
  { title: "Little Women", year: 2019, rating: "PG", tags: ["drama", "romance", "period"], for: ["kristine"] },
  { title: "Arrival", year: 2016, rating: "PG-13", tags: ["sci-fi", "drama", "aliens"], for: ["kristine", "date"] },
  { title: "Project Hail Mary", year: 2026, rating: "PG-13", tags: ["sci-fi", "adventure", "comedy", "space"], for: ["kristine", "date"] },
  { title: "Anatomy of a Fall", year: 2023, rating: "R", tags: ["drama", "mystery", "thriller"], for: ["kristine"] },
  { title: "Barbie", year: 2023, rating: "PG-13", tags: ["comedy", "fantasy"], for: ["kristine"] },

  // Kristine's own favorites (in her watched list) so their tags train the suggestions.
  { title: "Off Campus", rating: "TV-MA", kind: "series", tags: ["romance", "college", "sports-romance", "book-adaptation", "drama", "comedy"], for: [] },
  { title: "The Summer I Turned Pretty", year: 2022, rating: "TV-14", kind: "series", tags: ["romance", "teen", "coming-of-age", "love-triangle", "book-adaptation", "drama", "summer"], for: [] },
  { title: "To All the Boys I've Loved Before", year: 2018, rating: "PG-13", tags: ["romance", "teen", "coming-of-age", "book-adaptation", "comedy"], for: [] },
  { title: "Voicemails for Isabelle", rating: "PG-13", tags: ["romance", "comedy", "drama"], for: [] },

  // Kristine: romance and coming-of-age
  { title: "To All the Boys: P.S. I Still Love You", year: 2020, rating: "TV-14", tags: ["romance", "teen", "coming-of-age", "book-adaptation", "comedy"], for: ["kristine"] },
  { title: "To All the Boys: Always and Forever", year: 2021, rating: "TV-14", tags: ["romance", "teen", "coming-of-age", "book-adaptation", "comedy"], for: ["kristine"] },
  { title: "Red, White & Royal Blue", year: 2023, rating: "R", tags: ["romance", "comedy", "book-adaptation"], for: ["kristine"] },
  { title: "Purple Hearts", year: 2022, rating: "TV-14", tags: ["romance", "drama", "book-adaptation"], for: ["kristine"] },
  { title: "My Oxford Year", year: 2025, rating: "TV-14", tags: ["romance", "drama", "college", "book-adaptation"], for: ["kristine"] },
  { title: "10 Things I Hate About You", year: 1999, rating: "PG-13", tags: ["romance", "teen", "comedy", "coming-of-age"], for: ["kristine", "date"] },
  { title: "The Notebook", year: 2004, rating: "PG-13", tags: ["romance", "drama", "book-adaptation", "summer"], for: ["kristine"] },
  { title: "Twilight", year: 2008, rating: "PG-13", tags: ["romance", "teen", "fantasy", "vampires", "love-triangle", "book-adaptation"], for: ["kristine"] },

  // ---------- TV shows: Kristine ----------
  { title: "XO, Kitty", year: 2023, rating: "TV-14", kind: "series", tags: ["romance", "teen", "coming-of-age", "comedy", "love-triangle"], for: ["kristine"], note: "Spin-off of To All the Boys." },
  { title: "Bridgerton", year: 2020, rating: "TV-MA", kind: "series", tags: ["romance", "period", "drama", "book-adaptation"], for: ["kristine"] },
  { title: "Heartstopper", year: 2022, rating: "TV-14", kind: "series", tags: ["romance", "teen", "coming-of-age", "book-adaptation"], for: ["kristine"] },
  { title: "My Life with the Walter Boys", year: 2023, rating: "TV-14", kind: "series", tags: ["romance", "teen", "love-triangle", "book-adaptation", "drama"], for: ["kristine"] },
  { title: "Maxton Hall: The World Between Us", year: 2024, rating: "TV-MA", kind: "series", tags: ["romance", "college", "drama", "book-adaptation"], for: ["kristine"] },
  { title: "We Were Liars", year: 2025, rating: "TV-14", kind: "series", tags: ["teen", "mystery", "summer", "romance", "book-adaptation", "drama"], for: ["kristine"] },
  { title: "Never Have I Ever", year: 2020, rating: "TV-14", kind: "series", tags: ["teen", "comedy", "romance", "coming-of-age", "love-triangle"], for: ["kristine"] },
  { title: "Normal People", year: 2020, rating: "TV-MA", kind: "series", tags: ["romance", "drama", "college", "coming-of-age", "book-adaptation"], for: ["kristine"] },
  { title: "Virgin River", year: 2019, rating: "TV-MA", kind: "series", tags: ["romance", "drama", "small-town", "book-adaptation"], for: ["kristine"] },
  { title: "Ginny & Georgia", year: 2021, rating: "TV-14", kind: "series", tags: ["drama", "teen", "comedy", "romance", "mystery"], for: ["kristine"] },
  { title: "Gilmore Girls", year: 2000, rating: "TV-PG", kind: "series", tags: ["comedy", "drama", "small-town", "romance", "coming-of-age"], for: ["kristine"] },
  { title: "Outer Banks", year: 2020, rating: "TV-MA", kind: "series", tags: ["teen", "adventure", "mystery", "romance", "summer"], for: ["kristine"] },
  { title: "Emily in Paris", year: 2020, rating: "TV-MA", kind: "series", tags: ["romance", "comedy", "love-triangle"], for: ["kristine"] },
  { title: "Nobody Wants This", year: 2024, rating: "TV-MA", kind: "series", tags: ["romance", "comedy"], for: ["kristine", "date"] },
  { title: "Only Murders in the Building", year: 2021, rating: "TV-MA", kind: "series", tags: ["mystery", "comedy", "whodunit"], for: ["kristine", "date"] },
  { title: "Wednesday", year: 2022, rating: "TV-14", kind: "series", tags: ["mystery", "comedy", "horror", "teen"], for: ["kristine"] },

  // ---------- Date Night ----------
  { title: "Glass Onion: A Knives Out Mystery", year: 2022, rating: "PG-13", tags: ["mystery", "comedy", "whodunit"], for: ["date", "kristine"] },
  { title: "Top Gun: Maverick", year: 2022, rating: "PG-13", tags: ["action", "drama"], for: ["date"] },
  { title: "Dune: Part Two", year: 2024, rating: "PG-13", tags: ["sci-fi", "action", "adventure", "space"], for: ["date"] },
  { title: "The Fall Guy", year: 2024, rating: "PG-13", tags: ["action", "comedy", "romance"], for: ["date"] },
  { title: "Hit Man", year: 2024, rating: "R", tags: ["comedy", "romance", "thriller"], for: ["date"] },
  { title: "Palm Springs", year: 2020, rating: "R", tags: ["comedy", "romance", "sci-fi"], for: ["date"] },
  { title: "Game Night", year: 2018, rating: "R", tags: ["comedy", "mystery", "action"], for: ["date"] },
  { title: "The Nice Guys", year: 2016, rating: "R", tags: ["comedy", "action", "mystery"], for: ["date"] },
  { title: "Mission: Impossible - Dead Reckoning Part One", year: 2023, rating: "PG-13", tags: ["action", "thriller", "heist"], for: ["date"] },
  { title: "F1", year: 2025, rating: "PG-13", tags: ["action", "drama", "sports"], for: ["date"] },
  { title: "Crazy Rich Asians", year: 2018, rating: "PG-13", tags: ["comedy", "romance"], for: ["date", "kristine"] },
  { title: "Anyone But You", year: 2023, rating: "R", tags: ["comedy", "romance"], for: ["date"] },

  // ---------- TV shows: Date Night ----------
  { title: "The Bear", year: 2022, rating: "TV-MA", kind: "series", tags: ["comedy", "drama"], for: ["date"] },
  { title: "Severance", year: 2022, rating: "TV-MA", kind: "series", tags: ["sci-fi", "mystery", "thriller"], for: ["date", "kristine"] },
  { title: "The White Lotus", year: 2021, rating: "TV-MA", kind: "series", tags: ["drama", "comedy", "mystery"], for: ["date"] },
  { title: "Slow Horses", year: 2022, rating: "TV-MA", kind: "series", tags: ["thriller", "action", "comedy", "spy"], for: ["date"] },
  { title: "Ted Lasso", year: 2020, rating: "TV-MA", kind: "series", tags: ["comedy", "sports", "drama"], for: ["date"] },
  { title: "Shrinking", year: 2023, rating: "TV-MA", kind: "series", tags: ["comedy", "drama"], for: ["date"] },
  { title: "Reacher", year: 2022, rating: "TV-MA", kind: "series", tags: ["action", "thriller", "mystery"], for: ["date"] },
  { title: "The Night Agent", year: 2023, rating: "TV-MA", kind: "series", tags: ["action", "thriller", "spy"], for: ["date"] },
  { title: "Mr. & Mrs. Smith", year: 2024, rating: "TV-MA", kind: "series", tags: ["action", "romance", "comedy", "spy"], for: ["date"] },
  { title: "Abbott Elementary", year: 2021, rating: "TV-PG", kind: "series", tags: ["comedy"], for: ["date"] },
  { title: "The Menu", year: 2022, rating: "R", tags: ["horror", "comedy", "thriller"], for: ["date", "kristine"] },
  { title: "Edge of Tomorrow", year: 2014, rating: "PG-13", tags: ["action", "sci-fi", "aliens"], for: ["date"] },
  { title: "Nope", year: 2022, rating: "R", tags: ["horror", "sci-fi", "aliens", "thriller"], for: ["date", "kristine"] },
];

// Kid-friendly-looking titles we skip on purpose because of sexual content or innuendo.
// Shown in the Gremlins section so nobody wonders why they're missing.
window.SKIPPED_FOR_KIDS = [
  { title: "Gremlins", year: 1984, why: "Sexual content, and a character says there's no Santa." },
  { title: "Gremlins 2: The New Batch", year: 1990, why: "Innuendo, same as the first." },
  { title: "The Others", year: 2001, why: "The twist involves suicide." },
  { title: "Mama", year: 2013, why: "Suicide in the backstory and the ending." },
  { title: "Lights Out", year: 2016, why: "A parent dies by suicide." },
  { title: "Nimona", year: 2023, why: "A scene widely read as a suicide attempt." },
  { title: "Godzilla Minus One", year: 2023, why: "Built around a suicide-mission storyline." },
  { title: "Buddy", year: 2025, why: "Skipped at Kristine's request." },
  { title: "Hocus Pocus", year: 1993, why: "Running virgin jokes and innuendo." },
  { title: "Beetlejuice", year: 1988, why: "Beetlejuice gropes and propositions characters." },
  { title: "Ghostbusters", year: 1984, why: "A sexual dream scene and innuendo." },
  { title: "Bride of Chucky", year: 1998, why: "Sex scene. Same for Seed of Chucky and later sequels." },
  { title: "The Goonies", year: 1985, why: "Crude sexual jokes." },
  { title: "Pirates of the Caribbean", year: 2003, why: "Brothel scenes and innuendo." },
  { title: "Fright Night", year: 1985, why: "Sexual content." },
];

// The kids' starting watch history, from Kristine's notes.
window.SEED_WATCHED = {
  jordan: ["Jumanji: Welcome to the Jungle", "Jumanji", "Five Nights at Freddy's", "Five Nights at Freddy's 2", "A Quiet Place", "A Quiet Place Part II", "A Quiet Place: Day One", ["The Mummy", 2026], "The Simpsons Movie", "Stranger Things"],
  tegan: ["Coraline", "The Witches", "Child's Play", "The Ring", "The Mummy", "Child's Play 2", "Annabelle: Creation", "A Quiet Place", "A Quiet Place Part II", "A Quiet Place: Day One", ["The Mummy", 2026]],
  kristine: ["Off Campus", "The Summer I Turned Pretty", "To All the Boys I've Loved Before", "Voicemails for Isabelle"],
  date: [],
};
