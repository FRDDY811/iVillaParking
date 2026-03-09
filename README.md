# iVillaParking

A parking management system for a residential community. The main challenge was designing a **fair raffle algorithm** — residents who never got a spot should have priority over those who had one recently. I solved this with a 3-tier system + Fisher-Yates shuffle.

## What it does

- **Admin panel** — approve residents, configure parking spots, run raffles, import/export data, monitor camera detections
- **Resident portal** — register vehicles, sign up for raffles, view assignments
- **Camera simulation** — checks license plates against assigned spots (AUTHORIZED / DETECTED / UNKNOWN)

## Tech Stack

| Layer    | Stack                                                             |
| -------- | ----------------------------------------------------------------- |
| Frontend | React 18, TypeScript, Redux Toolkit + RTK Query, Ant Design, Vite |
| Backend  | Node.js, Express, TypeScript, Prisma ORM, SQLite, Zod             |
| Auth     | JWT (access 15 min + refresh 7 d), bcrypt, httpOnly cookies       |
| Security | Helmet, CORS, rate limiting, XSS sanitization                     |
| Testing  | Jest, Supertest, React Testing Library (48 suites, 335 tests)     |
| Shared   | `@ivillaparking/shared` monorepo package for types and constants  |

## Getting Started

```bash
npm install
cp .env.example .env
npm run db:migrate
npm run db:seed                # creates admin + default parking config
```

Run in two terminals:

```bash
npm run dev:server             # port 3001
npm run dev:client             # port 5173
```

Login with `admin@ivillaparking.com` / `admin123`. New residents register at `/register` and need admin approval.

## Tests

```bash
npm test                       # everything
npm run test:server            # 5 suites, 42 integration tests
npm run test:client            # 43 suites, 293 unit tests
```

## Project Structure

```
shared/          types, enums, validation constants (single source of truth)
server/          Express API — prisma, config, middleware, routes, controllers, services, validators
client/          React SPA — api, store (RTK Query), components, hooks, pages
__tests__/       server integration (Supertest) + client unit (RTL)
```

## API Overview

| Group         | Endpoints                                                |
| ------------- | -------------------------------------------------------- |
| Auth          | register, login, refresh, logout, me                     |
| Users         | list, update, delete, pending approvals                  |
| Vehicles      | CRUD + search by plate                                   |
| Parking       | config (spots per type), current assignments, history    |
| Raffle        | cycles CRUD, register, execute, results                  |
| Import/Export | residents, raffle results, parking config (.xlsx / .csv) |
| Camera        | detect plate, list detections                            |

## Environment Variables

See `.env.example` for all variables. Key ones:

- `JWT_SECRET` / `JWT_REFRESH_SECRET` — required in production (server won't start without them)
- `DATABASE_URL` — defaults to `file:./dev.db` (SQLite)
- `CORS_ORIGIN` — defaults to `http://localhost:5173`
