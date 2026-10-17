# DevBoard — Indie Talent Marketplace

> A full-stack platform where founders post scoped software projects and developers apply with focused pitches. No cold DMs, no inbox clutter — just clean project listings and structured applications.

![DevBoard](https://devboard-gamma-gilt.vercel.app/og.png)

## Live Demo

- **Frontend:** https://devboard-gamma-gilt.vercel.app
- **Backend API:** https://devboard-api-tan.vercel.app
- **GitHub:** https://github.com/Shaurya002800/devboard

---

## What It Does

DevBoard is a mini marketplace for indie software projects. Founders post work they need done — with a title, description, tech stack, budget, and deadline. Developers browse open listings, filter by stack or budget, and apply with a focused pitch. Project owners review applicants from their dashboard and accept or reject them directly.

**Core user flows:**

- Register and log in with JWT authentication
- Post a project with tech stack, budget, and deadline
- Browse all open projects with stack and budget filters
- Apply to a project with a written pitch
- Dashboard shows your posted projects and your applications
- Project owners can accept or reject applicants

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS |
| Backend | Node.js, Express |
| Database | PostgreSQL via `pg` |
| Auth | JWT + bcryptjs |
| Deployment | Vercel (frontend + API) + Neon (PostgreSQL) |
| Tooling | ESLint, Prettier |

---

## Project Structure
devboard/
├── client/                  # Next.js frontend
│   ├── app/                 # App router pages
│   │   ├── page.js          # Home / browse page
│   │   ├── auth/            # Login + register pages
│   │   ├── projects/        # Project detail + post pages
│   │   └── dashboard/       # User dashboard
│   ├── components/          # Reusable UI components
│   └── lib/
│       └── api.js           # Centralised API fetch helper
├── server/                  # Express backend
│   ├── routes/
│   │   ├── auth.js          # Register, login, /me
│   │   ├── projects.js      # CRUD + filters
│   │   └── applications.js  # Apply, review, accept/reject
│   ├── middleware/
│   │   └── auth.js          # JWT guard middleware
│   ├── db/
│   │   ├── index.js         # pg Pool connection
│   │   └── migrate.js       # Table creation script
│   └── index.js             # Express app entry point
├── .env.example
└── README.md

## Architecture and Reliability

See [the project review](docs/PROJECT_REVIEW.md) for architecture, lifecycle rules, verified fixes, remaining risks, and regression-test commands.

## Local Setup

### Prerequisites
- Node.js 20.9+
- PostgreSQL running locally

### 1. Clone the repo

```bash
git clone https://github.com/Shaurya002800/devboard.git
cd devboard
```

### 2. Set up the server

```bash
cd server
npm install
cp .env.example .env
# Fill in your values (see Environment Variables below)
npm run migrate
npm run dev
```

### 3. Set up the client

```bash
cd client
npm install
# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local
npm run dev
```

### 4. Open in browser

- Frontend: http://localhost:3000
- API: http://localhost:5000

---

## Environment Variables

### `server/.env`
PORT=5000
DATABASE_URL=postgresql://username@localhost:5432/devboard
JWT_SECRET=your_strong_secret_here
CLIENT_URL=http://localhost:3000
NODE_ENV=development

### `client/.env.local`

NEXT_PUBLIC_API_URL=http://localhost:5000

---

## API Reference

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Login, returns JWT |
| GET | `/api/auth/me` | Yes | Get current user |

### Projects

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/projects` | No | List all (supports `?stack=` and `?budget=` filters) |
| GET | `/api/projects/:id` | No | Single project with applicant count |
| POST | `/api/projects` | Yes | Create a project |
| PATCH | `/api/projects/:id` | Yes | Update (poster only) |
| DELETE | `/api/projects/:id` | Yes | Delete (poster only) |

### Applications

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/applications` | Yes | Apply to a project |
| GET | `/api/applications/mine` | Yes | Your own applications |
| GET | `/api/applications/project/:id` | Yes | All applicants (poster only) |
| PATCH | `/api/applications/:id` | Yes | Accept or reject (poster only) |

---

## Database Schema

```sql
users (
  id UUID PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  password_hash TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ
)

projects (
  id UUID PRIMARY KEY,
  poster_id UUID → users,
  title TEXT,
  description TEXT,
  tech_stack TEXT[],
  budget INTEGER,
  deadline DATE,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ
)

applications (
  id UUID PRIMARY KEY,
  project_id UUID → projects,
  applicant_id UUID → users,
  pitch TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ,
  UNIQUE(project_id, applicant_id)
)
```

---

## Deployment

| Service | Platform | Config |
|---|---|---|
| Frontend | Vercel | Root directory: `client` |
| Backend | Vercel (`devboard-api`) | Root directory: `server`, Express preset |
| Database | Neon Free | Connected to the API through Vercel Marketplace |

**Environment variables to set on each platform:**

Frontend Vercel project:
NEXT_PUBLIC_API_URL = https://devboard-api-tan.vercel.app

Backend Vercel project:
DATABASE_URL = (provided by the Neon integration; TLS-enabled pooled URL)
JWT_SECRET = your_strong_secret
CLIENT_URL = https://devboard-gamma-gilt.vercel.app
NODE_ENV = production

---

The API readiness endpoint is `GET /api/health`; HTTP 200 confirms database connectivity.
Both Vercel projects deploy from `main`. Frontend environment changes require a rebuild.
The API uses a shared connection pool with Vercel lifecycle management and requires
`DATABASE_URL` and `JWT_SECRET` in production. Initialize a new database with
`npm run migrate` from `server` after loading its connection URL securely.

On 18 October 2026, hosting moved from the expired Railway trial to Vercel and a
fresh Neon database. **Old Railway accounts, projects, and applications have not
been imported.** Railway resources were left intact for possible later recovery.
See [migration notes](docs/HOSTING_MIGRATION.md) before restoring old data.

## Scripts

### Client
```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run lint      # Run ESLint
```

### Server
```bash
npm run dev       # Start with nodemon
npm run start     # Start production
npm run migrate   # Create database tables
npm test          # Unit tests; integration tests also run with TEST_DATABASE_URL
```

---

## Further Improvements

- Email notifications when an application is accepted or rejected
- In-app messaging between poster and applicant
- GitHub profile integration on user profiles
- Browser regression tests for client flows
- Saved/bookmarked projects

---

## Screenshots

### Home — Browse Projects
![Browse](screenshots/browse.png)

### Project Detail + Apply
![Detail](screenshots/detail.png)

### Dashboard
![Dashboard](screenshots/dashboard.png)

### Auth Flow
![Auth](screenshots/auth.png)

---

Built by **Shaurya** · VIT Vellore · Full Stack Developer Internship — Round 2