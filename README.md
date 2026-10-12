# WatchList 🎬

A personal movie collection manager for film fans. Search movies, organize them into "Want to Watch," "Watched," and "Want to Rewatch" categories, manage ratings and reviews, and control your collection from a personal dashboard.

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

- **Authentication** — Sign up and sign in with email and password
- **Movie Search** — Search a curated catalog of 29 films by title
- **Personal Dashboard** — View your collection organized by category
- **Add to Watchlist** — Add any movie to your Want to Watch list
- **Move Between Categories** — Change a movie's status between Want to Watch, Watched, and Want to Rewatch
- **Ratings & Reviews** — Rate movies and add personal review notes
- **Remove from Watchlist** — Remove movies with a confirmation modal
- **Protected Routes** — Dashboard requires authentication

---

## Tech Stack

- **Framework:** Next.js 15+ (App Router)
- **Language:** TypeScript
- **Database:** MongoDB Atlas
- **Authentication:** Auth.js v5 (Credentials provider)
- **Styling:** Tailwind CSS
- **Validation:** Zod
- **Formatting:** Prettier
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

| Method | Endpoint                        | Auth     | Description                                |
| ------ | ------------------------------- | -------- | ------------------------------------------ |
| GET    | `/api/movies/search?q={query}`  | No       | Search movie catalog by title              |
| GET    | `/api/watchlist`                | Required | Get user's watchlist organized by category |
| GET    | `/api/watchlist?category={cat}` | Required | Filter watchlist by category               |
| POST   | `/api/watchlist`                | Required | Add movie to Want to Watch                 |
| PATCH  | `/api/watchlist/{itemId}`       | Required | Update movie category or add rating/review |
| DELETE | `/api/watchlist/{itemId}`       | Required | Remove movie from watchlist                |

---

## Demo Credentials

To test the app without creating an account:

| Field    | Value            |
| -------- | ---------------- |
| Email    | demo@example.com |
| Password | password123      |

_(Or create your own account via the Sign Up page)_

---

## Project Structure
```
app/
├── api/
│ ├── auth/ # Auth.js route handlers
│ ├── movies/search/ # Movie search endpoint
│ └── watchlist/ # Watchlist CRUD endpoints
│ └── [itemId]/ # PATCH and DELETE by movie id
├── dashboard/ # Protected user dashboard
├── login/ # Login page
├── signup/ # Registration page
└── types/ # TypeScript declarations
components/
├── ui/
│ └── Button.tsx # Reusable button component
├── ConfirmModal.tsx # Delete confirmation modal
├── DashboardClient.tsx # Client wrapper for dashboard
├── Footer.tsx # Site footer
├── MovieCard.tsx # Movie display card
├── MovieSearch.tsx # Search interface
├── Navbar.tsx # Site navigation
├── ReviewModal.tsx # Rating and review modal
├── WatchlistContext.tsx # Shared watchlist state
└── WatchListDisplay.tsx # Dashboard watchlist sections
lib/
├── db.ts # MongoDB connection
├── users.ts # User data access
└── watchlist.ts # Watchlist data access
```
---

## Known Issues / Future Opportunities

- Movie catalog is seeded with 29 films — future versions would connect to a live external movie API
- Watchlist categories are fixed — future versions could support custom lists

---

## Development

### Branch Naming

Feature branches named by feature: `feature/feature-name`

### Code Quality

```bash
npm run lint      # ESLint
npm run format    # Prettier
npm run build     # TypeScript check + production build
```

---

_Built with Next.js · Deployed on Vercel_
