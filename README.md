# RallyLedger Web

**Version:** v0.5.0

Frontend admin application for **RallyLedger**, a tennis club management and ledger system.

RallyLedger provides a responsive interface for managing participants, courts, sessions, matches, configurable fees, charges, payments, balances, and reports.

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS v4
- React Router
- Fetch API
- html-to-image
- Vercel
- Git / GitHub

Backend services:

- Go
- chi
- PostgreSQL
- Render
- Neon

## Current Features

### Authentication

- Admin email/password login
- Session restoration on page refresh
- HttpOnly cookie authentication
- Logout
- Protected application interface

Authentication tokens are not stored in `localStorage`.

Authenticated requests use:

```ts
credentials: "include";
```

### Participants

- View participants
- Add participants
- Edit participants
- Delete participants
- Participant classification
- Membership status
- Participant ledger
- Record payments

### Courts

- View courts
- Add courts
- Edit courts
- Active/inactive court support

### Sessions

- Create sessions
- Edit sessions
- Delete sessions
- Manage session participants
- Manage matches within sessions
- View generated charges

### Matches

- Singles
- Doubles
- Mixed doubles
- Court selection
- Team A / Team B
- Player assignment
- Match scoring
- Match sets
- Lights-used option
- Automatic charge generation

### Fee Rules

Administrators can manage configurable fee rules for:

- Ball
- Court
- Light

Rules may vary by participant classification and match type.

### Participant Ledger

Participant ledgers display:

- Total charges
- Total payments
- Current balance
- Charge history
- Payment history

Balance is calculated using:

```text
Total Charges - Total Payments
```

A negative balance represents participant credit.

Ledger information can currently be shared as text or PNG.

### Reports

The frontend includes reporting and participant balance views backed by the RallyLedger API.

## API Configuration

The frontend communicates with the Go backend through the shared API client.

Local development:

```env
VITE_API_URL=http://localhost:8080
```

Production:

```env
VITE_API_URL=/api
```

Production requests use paths such as:

```text
/api/auth/me
/api/participants
/api/sessions
/api/reports/...
```

Vercel forwards `/api/*` requests to the deployed Render API.

## Running Locally

Install dependencies:

```bash
npm install
```

Start Vite:

```bash
npm run dev
```

To expose the frontend to other devices on the local network:

```bash
npm run dev -- --host
```

## Validation

Before pushing changes:

```bash
npm run lint
npm run build
```

## Environment Files

Local environment files should not be committed.

Example:

```gitignore
.env
.env.*
```

## Deployment

Current production architecture:

```text
User
    ↓
Vercel
React + Vite
    ↓
/api/*
    ↓
Vercel Rewrite
    ↓
Render
Go API
    ↓
Neon PostgreSQL
```

The frontend is deployed on **Vercel**.

The backend API is deployed on **Render**.

PostgreSQL is hosted on **Neon**.

## Project Status

### v0.5.0

Current deployed functionality includes:

- Admin authentication
- Dashboard
- Participants
- Courts
- Sessions
- Match management
- Match participants
- Match sets
- Fee rules
- Charge generation
- Payments
- Participant ledger
- Outstanding balances
- Reports
- Responsive desktop/mobile interface
- Production deployment

## Planned v0.6

The next version will focus on improving the real tennis-club workflow.

Planned features include:

- Period-based PNG ledger statements
- Period-based Copy as Text statements
- Global 401 handling
- Session-centered workflow
- Regular Play
- Training
- Outsider Play
- Quick Add Guest
- Training fees
- Ball rental
- Racket rental
- Google admin login
- Multi-tenant isolation testing
- CSRF / Origin protection
- Mobile workflow improvements

The goal is to move away from separate CRUD-style workflows and make a Session the main operational workspace.

## Author

**Kharl Rovin Ocampo**

Bachelor of Science in Computer Science  
Mariano Marcos State University
