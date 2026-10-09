# WatchList 🎬

A personal movie collection manager for film fans. Search movies, organize them into "Want to Watch," "Watched," and "Want to Rewatch" categories, and manage your collection from a personal dashboard.

**Live Demo:** [watch-list-theta.vercel.app](https://watch-list-theta.vercel.app/)

---

## Team

| Name | GitHub |
|------|--------|
| Jacob Ethington | [jdethington](https://github.com/jdethington) |
| Luthando Lwandile Ngombane | [LuthandoNgombane](https://github.com/LuthandoNgombane) |
| Pamela Lynn Christison | [kimchristian50](https://github.com/kimchristian50) |
| Peter Simon Bwire | [Elitefx755](https://github.com/Elitefx755) |

---

## Features

- **Authentication** — Sign up and sign in with email and password
- **Movie Search** — Search a curated catalog of 29 films by title
- **Personal Dashboard** — View your collection organized by category
- **Add to Watchlist** — Add any movie to your Want to Watch list
- **Remove from Watchlist** — Remove movies with a confirmation modal
- **Protected Routes** — Dashboard requires authentication

---

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Database:** MongoDB Atlas
- **Authentication:** Auth.js v5 (Credentials provider)
- **Styling:** Tailwind CSS
- **Validation:** Zod
- **Deployment:** Vercel

---

## Getting Started

### Prerequisites
- Node.js 18+
- A MongoDB Atlas account
- A Vercel account (for deployment)

### Installation

```bash
git clone https://github.com/jdethington/wdd430-team4-project.git
cd wdd430-team4-project
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB=your_database_name
AUTH_SECRET=your_auth_secret
SESSION_SECRET=your_session_secret
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

## API Routes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/movies/search?q={query}` | No | Search movie catalog by title |
| GET | `/api/watchlist` | Required | Get user's watchlist by category |
| POST | `/api/watchlist` | Required | Add movie to Want to Watch |
| DELETE | `/api/watchlist/{movieId}` | Required | Remove movie from watchlist |

---

## Demo Credentials

To test the app without creating an account:

| Field | Value |
|-------|-------|
| Email | demo@example.com |
| Password | password123 |

*(Or create your own account via the Sign Up page)*

---

## Project Structure

app/
├── api/
│ ├── movies/search/ # Movie search endpoint
│ └── watchlist/ # Watchlist CRUD endpoints
├── dashboard/ # Protected user dashboard
├── login/ # Login page
└── signup/ # Registration page
components/
├── MovieCard.tsx # Movie display card with delete
├── MovieSearch.tsx # Search interface
├── WatchlistDisplay.tsx # Dashboard watchlist sections
└── ConfirmModal.tsx # Delete confirmation modal
lib/
├── db.ts # MongoDB connection
├── users.ts # User data access
├── session.ts # Session helpers
└── watchlist.ts # Watchlist data access


---

## Known Issues / Future Opportunities

- Movie catalog is currently seeded with 29 films — future versions would connect to a live movie API
- Watchlist categories are fixed (Want to Watch, Watched, Rewatch) — future versions could support custom lists
- No ability to move movies between categories yet
- User Story 4 (edit watchlist entries) and User Story 5 (delete with ownership check) are partially implemented

---

## Development

### Branch Naming
Feature branches named by feature: `feature/feature-name`

### Code Quality
```bash
npm run lint    # ESLint
npm run build   # TypeScript check + production build
```

---

*Built with Next.js · Deployed on Vercel*