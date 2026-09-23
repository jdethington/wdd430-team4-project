# WatchList – GitHub Copilot Instructions

## Project Overview
WatchList is a private full-stack web application where movie fans can organize
and manage their personal movie collections. Users can search for movies, save
them to one of three categories (Want to Watch, Watched, Want to Rewatch), and
record personal ratings and reviews.

## Tech Stack
- **Framework**: Next.js (App Router)
- **Language**: TypeScript (strict mode preferred)
- **Styling**: Tailwind CSS (dark cinema theme)
- **Validation**: Zod
- **Database**: MongoDB
- **Authentication**: Auth.js v5 (NextAuth.js) 

## Project Structure
```
app/                  # Next.js App Router pages and layouts
  layout.tsx          # Root layout with Navbar and Footer
  page.tsx            # Public landing page
  signup/page.tsx     # Sign-up page
  (auth)/             # Auth routes: /login, /signup
  dashboard/          # Authenticated user dashboard
  api/                # API route handlers
components/
  Navbar.tsx          # Sticky top navigation
  Footer.tsx          # Site footer
  ui/
    Button.tsx        # Reusable button with primary/secondary/disabled variants
  MovieCard.tsx        # Card for displaying movie info in dashboard
  MovieList.tsx        # List of MovieCards with category filters
src/models/           # Mongoose schemas and model functions
```

## Design System & Colors
The app uses a dark cinema theme inspired by IMDb/Letterboxd.

| Token | Value | Usage |
|---|---|---|
| Background | `#1a1a1a` | Page background |
| Surface | `#2c2c2c` | Cards, panels |
| Gold accent | `#f5c518` | Brand color, CTAs, highlights |
| Text primary | `#f5f5f4` | Headings, body |
| Text muted | `#afb6c2` | Secondary text, captions |

- Brand name renders as `WATCH` in white + `LIST` in gold (`#f5c518`)
- Art deco gold gradient accent line appears below the navbar
- Cards use `rounded-sm` not `rounded-lg` for a cinematic feel
- Hover states transition colors, never backgrounds abruptly

## Key Entities & Data Model

### User
```typescript
{
  id: string;
  email: string;         // unique
  passwordHash: string;   // maybe not stored in the model if using Auth.js
  createdAt: Date;
}
```

### Movie
```typescript
{
  id: string;            // stable external provider ID
  title: string;
  year?: string;
  posterUrl?: string;
  summary?: string;
}
```

### WatchlistEntry
```typescript
{
  id: string;
  userId: string;        // owner — enforce on every read/write/delete
  movieId: string;
  category: 'want-to-watch' | 'watched' | 'want-to-rewatch';
  createdAt: Date;
  updatedAt: Date;
}
```

One user may have at most one WatchlistEntry per movie.

## API Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/signup` | No | Create account |
| POST | `/api/auth/signin` | No | Sign in |
| POST | `/api/auth/signout` | Yes | Sign out |
| GET | `/api/movies/search?q={query}` | Yes | Search movies |
| GET | `/api/watchlist` | Yes | Get user's collection |
| POST | `/api/watchlist` | Yes | Add movie to collection |
| GET | `/api/watchlist/{itemId}` | Yes | Get one entry |
| PATCH | `/api/watchlist/{itemId}` | Yes | Update category/rating/review |
| DELETE | `/api/watchlist/{itemId}` | Yes | Delete entry |

All protected endpoints enforce ownership — a user may only read, update,
or delete their own entries. Return 401 for unauthenticated, 403 for
unauthorized, 404 for missing entries (never expose another user's data).

## Naming Conventions
- **Files**: PascalCase for components (`Navbar.tsx`), camelCase for
  utilities and models (`watchlistEntry.ts`)
- **Components**: PascalCase (`WatchlistCard`, `MovieSearchResult`)
- **API handlers**: camelCase verbs (`getWatchlist`, `addToWatchlist`)
- **CSS**: Tailwind utility classes only — no custom CSS except in
  `globals.css` for base resets
- **Zod schemas**: suffix with `Schema` (`watchlistEntrySchema`)
- **Types**: suffix with `Type` or use plain interface names (`WatchlistEntry`)

## Validation Rules (Zod)
- `rating`: `z.number().int().min(1).max(5).optional()`
- `review`: `z.string().max(2000).optional()`
- `category`: `z.enum(['want-to-watch', 'watched', 'want-to-rewatch'])`
- `email`: `z.string().email()`
- Search query `q`: reject blank or whitespace-only strings before
  calling the movie service

## Movie Data Source
1. **Phase 1**: Internal seeded movie catalog in MongoDB
2. **Phase 2**: Streaming Availability API by Movie of the Night

Always store movie details on the WatchlistEntry at save time so the
dashboard remains readable if the external source changes.

## Authentication
- Auth.js v5 (NextAuth.js) 
- Protect all `/api/watchlist` and `/api/movies` routes
- Redirect unauthenticated users to `/login`
- After sign-in redirect to `/dashboard`

## Error & Loading States
Every search and dashboard interaction must handle:
- **Loading**: show a spinner or skeleton, never stale data
- **Empty**: explain how to add movies (don't show a blank page)
- **Validation error**: field-level messages, previous values preserved
- **Service error**: retryable message, no partial data written
- **Auth error**: redirect to `/login`

## Accessibility Requirements
- Keyboard-accessible controls on all interactive elements
- Meaningful `aria-label` on icon-only buttons
- Visible focus states (use `focus:ring-2 focus:ring-[#f5c518]`)
- Sufficient color contrast — `#afb6c2` on `#1a1a1a` meets AA
- Semantic HTML: `<header>`, `<nav>`, `<main>`, `<footer>`, `<article>`

## What NOT to Build (Out of Scope)
- Social features, collaborative lists, public reviews
- Recommendations engine
- Account recovery / password reset
- Social login (Google, GitHub, etc.)
- Movie imports from external services
- TMDB API integration (Phase 1 uses internal catalog, Phase 2 uses Movie of the Night API)
- rating?: number;       // integer 1–5, only on watched entries // future implementation
- review?: string;       // max 2000 characters // future implementation