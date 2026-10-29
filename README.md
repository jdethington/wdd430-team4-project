# WatchList 🎬

A personal movie collection manager for film fans. Search movies, organize them into **Want to Watch**, **Watched**, and **Want to Rewatch**, rate and review titles, and manage your account from a responsive dashboard.

**Live Demo:** [watch-list-theta.vercel.app](https://watch-list-theta.vercel.app/)

---

## Team

| Name                       | GitHub                                                  |
| -------------------------- | ------------------------------------------------------- |
| Jacob Ethington            | [jdethington](https://github.com/jdethington)           |
| Luthando Lwandile Ngombane | [LuthandoNgombane](https://github.com/LuthandoNgombane) |
| Pamela Lynn Christison     | [kimchristian50](https://github.com/kimchristian50)     |
| Peter Simon Bwire          | [elitefx75](https://github.com/elitefx75)               |

---

## Features

### Core watchlist

- **Authentication** — Email/password sign up and sign in (Auth.js v5)
- **Movie search** — Search via TMDB-backed catalog
- **Personal dashboard** — Collection grouped by Want to Watch, Watched, and Want to Rewatch
- **Add / move / remove** — Full watchlist lifecycle with confirmation modals
- **Ratings & reviews** — Star ratings and notes; review prompt when moving to Watched
- **Movie detail pages** — Poster, overview, cast, runtime, and where-to-watch options
- **Protected routes** — Dashboard, account, and admin require authentication; login supports `callbackUrl`

### Account

- Update name and email (with current password confirmation)
- Change password
- Soft-delete account

### Admin (role: `admin`)

- List/search users, including soft-deleted
- Edit name, email, role, and status
- Force password reset
- Soft-delete users (cannot delete or demote the last admin)

### UX

- Responsive layout with mobile nav (hamburger)
- Mobile-friendly admin user cards
- Loading skeletons, image fallbacks, and improved modal focus handling

---

## Tech Stack

| Layer                  | Choice                     |
| ---------------------- | -------------------------- |
| Framework              | Next.js 16 (App Router)    |
| Language               | TypeScript                 |
| Database               | MongoDB Atlas              |
| Auth                   | Auth.js v5 (Credentials)   |
| Movie data             | TMDB API                   |
| Streaming availability | Streaming Availability API |
| Styling                | Tailwind CSS               |
| Validation             | Zod                        |
| Formatting             | Prettier                   |
| Deployment             | Vercel                     |

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account
- TMDB API access token
- Streaming Availability API key (optional; for where-to-watch)
- Vercel account (for deployment)

### Installation

```bash
git clone https://github.com/jdethington/wdd430-team4-project.git
cd wdd430-team4-project
npm install
```

### Environment Variables

Copy `.env.example` to `.env.local` and fill in values:

```env
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB=your_database_name

AUTH_SECRET=your_auth_secret
# Optional alias used in some setups:
SESSION_SECRET=your_session_secret

# TMDB (search + movie details) — API Read Access Token (Bearer)
TMDB_ACCESS_TOKEN=your_tmdb_access_token
# Optional fallback:
TMDB_API_KEY=your_tmdb_api_key

# Streaming Availability (where-to-watch)
STREAMING_AVAILABILITY_API_KEY=your_key
RAPIDAPI_STREAMING_AVAILABILITY_API_KEY=your_rapidapi_key
```

Generate `AUTH_SECRET` with:

```bash
npx auth secret
```

### Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## Demo Credentials

| Field    | Value            |
| -------- | ---------------- |
| Email    | demo@example.com |
| Password | password123      |

Or create an account on the Sign Up page.

---

## API Routes

| Method           | Endpoint                               | Auth     | Description                      |
| ---------------- | -------------------------------------- | -------- | -------------------------------- |
| GET              | `/api/movies/search?q={query}`         | No       | Search movies by title           |
| GET              | `/api/watchlist`                       | Required | User watchlist by category       |
| GET              | `/api/watchlist?category={cat}`        | Required | Filter by category               |
| POST             | `/api/watchlist`                       | Required | Add movie to Want to Watch       |
| PATCH            | `/api/watchlist/{itemId}`              | Required | Update status, rating, or review |
| DELETE           | `/api/watchlist/{itemId}`              | Required | Remove from watchlist            |
| GET/PATCH/DELETE | `/api/account`                         | Required | Profile read/update/delete       |
| PATCH            | `/api/account/password`                | Required | Change password                  |
| GET              | `/api/admin/users`                     | Admin    | List/search users                |
| GET/PATCH/DELETE | `/api/admin/users/{id}`                | Admin    | User admin operations            |
| POST             | `/api/admin/users/{id}/reset-password` | Admin    | Require password reset           |

---

## Project Structure

```
app/
├── api/
│   ├── account/          # Profile & password
│   ├── admin/users/      # Admin user management
│   ├── auth/             # Auth.js + signup
│   ├── movies/search/    # Movie search
│   └── watchlist/        # Watchlist CRUD
├── account/              # User account UI
├── admin/users/          # Admin UI
├── dashboard/            # Protected dashboard
├── login/ · signup/
├── movies/[id]/         # Movie detail
└── page.tsx              # Marketing home + preview

components/
├── account/              # Profile, password, delete account
├── admin/                # Users table, edit modal
├── ui/                   # Button, Toast, CardSkeleton, LogoutButton
├── ConfirmModal.tsx
├── MovieCard.tsx
├── MovieCast.tsx
├── MovieSearch.tsx
├── MovieWatchlistControls.tsx
├── Navbar.tsx / NavbarClient.tsx
├── ReviewModal.tsx
├── WatchlistContext.tsx
└── WatchListDisplay.tsx

lib/
├── db.ts · users.ts · watchlist.ts
├── tmdb.ts · movies.ts · streaming.ts
└── authz.ts · auth-redirect.ts

auth.ts · middleware.ts
```

---

## Development

### Scripts

```bash
npm run dev           # Development server
npm run lint          # ESLint
npm run format        # Prettier write
npm run format:check  # Prettier check
npm run build         # Production build + typecheck
```

### Branch naming

Feature branches: `feature/feature-name` or topic branches such as `polish/account-admin-ux`.

---

## Known limitations / future ideas

- Watchlist categories are fixed (three lists); custom lists are a possible extension
- Streaming availability depends on external API coverage by country
- Shared toast component exists; not every action surface uses it yet
- Next.js 16 may warn about the `middleware` file convention (`proxy` migration)

---

_Built with Next.js · Deployed on Vercel_  
_This product uses the TMDB API but is not endorsed or certified by TMDB._

```

```
