# DevBoard

DevBoard is a full-stack marketplace where founders can post software projects and developers can apply with focused pitches. The stack is intentionally simple and reviewer-friendly: Next.js on the frontend, Express on the backend, and PostgreSQL with `pg` for the data layer.

## Live Demo

- Frontend: `TBD`
- Backend API: `TBD`
- Loom walkthrough: `TBD`

Replace the placeholders above before submission with your Vercel URL, Railway API URL, and optional walkthrough link.

## Features

- JWT-based authentication with password hashing via `bcryptjs`
- Browse page with stack and budget filters plus pagination
- Project detail page with application flow
- Post project form with validation and auth guard
- Dashboard with `My posts` and `My apps` tabs
- Applicant review flow for project owners
- Loading skeletons, empty states, toasts, and responsive UI

## Tech Stack

- Frontend: Next.js App Router, React 19, Tailwind CSS
- Backend: Node.js, Express
- Database: PostgreSQL via `pg`
- Auth: JWT, `bcryptjs`
- Tooling: ESLint, Prettier

## Project Structure

```text
devboard/
├── client/
│   ├── app/
│   ├── components/
│   └── lib/api.js
├── server/
│   ├── db/
│   ├── middleware/
│   ├── routes/
│   └── index.js
├── .env.example
└── README.md
```

## Local Setup

1. Copy env values:

```bash
cp .env.example .env
cp client/.env.example client/.env.local
cp server/.env.example server/.env
```

2. Install dependencies:

```bash
cd client && npm install
cd ../server && npm install
```

3. Start PostgreSQL and create a database named `devboard`.

4. Run migrations:

```bash
cd server
npm run migrate
```

5. Start the apps:

```bash
cd client
npm run dev
```

```bash
cd server
npm run dev
```

Frontend runs on [http://localhost:3000](http://localhost:3000) and the API runs on [http://localhost:5000](http://localhost:5000).

## Available Scripts

### Client

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run format`

### Server

- `npm run dev`
- `npm run start`
- `npm run migrate`
- `npm run check`
- `npm run format`

## API Summary

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`

### Projects

- `GET /api/projects`
- `GET /api/projects/:id`
- `POST /api/projects`
- `PATCH /api/projects/:id`
- `DELETE /api/projects/:id`

### Applications

- `POST /api/applications`
- `GET /api/applications/project/:id`
- `PATCH /api/applications/:id`
- `GET /api/applications/mine`

## Deployment Notes

- Deploy `client/` to Vercel
- Deploy `server/` to Railway
- Provision PostgreSQL on Railway
- Set `CLIENT_URL` on the server to your deployed Vercel domain
- Set `NEXT_PUBLIC_API_URL` on the client to your deployed API URL, including `/api`

## Screenshots

Add submission screenshots here:

- Home / browse page
- Project detail page
- Dashboard
- Auth flow

## What I’d Add With More Time

- Richer profile pages and saved developer bios
- Project editing UI and better poster-side moderation tools
- Automated tests for route behavior and critical client flows
- Email notifications when applications are submitted or reviewed
