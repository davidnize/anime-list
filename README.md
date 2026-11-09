# Romance Anime List

A small shelf for favorite couples. Twenty well-known romance anime start each account, grouped into Slice of Life, Harem, Love Triangle, and Movies. Sign in, filter the shelf, search a title, look one up online, or add one of your own. Each person's list is private.

![Romance Anime List](screenshot.png)

## How to run

You need Node.js 20 or newer and a Postgres database.

```bash
npm install
```

Create a database, then start the app with its two environment variables:

```bash
createdb romance_anime
DATABASE_URL=postgres://localhost:5432/romance_anime \
SESSION_SECRET=a-long-random-string-you-keep-secret \
npm start
```

Open http://localhost:3000. `DATABASE_URL` is the Postgres connection string. `SESSION_SECRET` signs the login cookie and should be at least 16 characters. The server creates its tables the first time it starts.

Copy `.env.example` if you want those variables in a file, and export them yourself before `npm start`. The server reads the environment, not a dotenv file.

On Render, `render.yaml` defines a free web service and a free Postgres database. `DATABASE_URL` comes from the database, and `SESSION_SECRET` is generated. The service runs `npm install` then `npm start`, and Render checks `/health`.

## Features

- Sign up and log in with a username and a passphrase of at least 8 characters. The passphrase is stored as a bcrypt hash, never in plain text
- A signed, httpOnly, SameSite session cookie. Auth routes are rate limited
- Each account has a private list in Postgres. A new account starts with the twenty seeded titles
- Filter buttons for All, Slice of Life, Harem, Love Triangle, and Movies, each with a live count
- Search across title, year, and note on your saved shelf
- Search online for a title on MyAnimeList. The page calls the Jikan API v4 (`https://api.jikan.moe/v4/anime?q=<query>&limit=10&sfw=true`), which needs no key. That public host stopped answering in October 2026, so if it does not respond the same query is sent to [Tenrai](https://tenrai.org/), a free Jikan-compatible API (`https://api.tenrai.org/v1/anime`) with the same result shape
- Online results show a poster, title, year, score, type (such as TV or Movie), and a short synopsis, with loading, empty, error, and rate-limit (HTTP 429) messages
- Add an online result with the category picker. The poster URL is saved with the card
- Add a title by hand, delete a card, or reset to the original twenty
- If this browser still has a guest shelf from before accounts, you can import it after signing in

## What Cursor helped create

Cursor helped me create a beginner-friendly romance anime shelf in plain HTML, CSS, and JavaScript, with real titles sorted into Slice of Life, Harem, Love Triangle, and Movies, plus category counts and cards that stay readable on a phone or a wide window. It also wired up search, adding, deleting, and browser saving, so the list I build is still there after a refresh.

Cursor also added accounts: a small Express server, a private Postgres list for each person, and a login screen so the shelf is no longer shared in one browser.
