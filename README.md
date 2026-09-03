# RallyLedger Web

Responsive administration interface for **RallyLedger**, a multi-organization tennis club operations and financial ledger platform.

**Release:** v1.0.0

**Live application:** https://rallyledger-web.vercel.app

**Developer:** [Kharl Rovin Ocampo](https://github.com/kurovin)

## Overview

RallyLedger Web gives authorized club administrators one interface for participants, courts, sessions, matches, configurable fees, charges, payments, ledgers, balances, and reports. Organization identity and available club access come from the authenticated API session.

## Technology

- React
- TypeScript
- Vite
- Tailwind CSS v4
- React Router
- Fetch API
- Google Identity Services
- html-to-image
- Vercel

The frontend communicates with a Go, chi, pgx, and PostgreSQL API deployed on Render with Neon as the production database.

## V1 Features

### Authentication and organizations

- Email/password administrator login
- Google administrator login
- HttpOnly cookie authentication
- Session restoration on refresh
- Global handling of expired sessions and `401` responses
- Logout and theme switching
- Multi-organization access and club switching
- Organization-aware headings and branding
- Protected application interface

Authentication tokens are never stored in `localStorage`. Authenticated API calls use:

```ts
credentials: "include"
```

### Dashboard and reports

- All-time, today, monthly, and custom date ranges
- Participant, session, and match totals
- Charge, payment, and net-balance summaries
- Top outstanding balances
- Payment overview
- Responsive desktop and mobile layouts

### Participants

- Searchable participant list
- Add, edit, and delete participants
- Nullable birthday support
- Membership status
- Temporary guests
- Organization-defined participant categories
- Participant ledger access
- Payment recording

### Courts

- Add, edit, and delete courts
- Surface and location details
- Active/inactive status
- Responsive card and desktop layouts

### Sessions

- Regular Play, Training, Outsider Play, and Event workflows
- Dates, times, capacity, and attendance
- Full, half, or no light usage
- Free-ball and free-light overrides
- Quick guest creation
- Match, Training, activity, results, and charge panels
- Smooth navigation to the active session workspace

### Matches and results

- Singles, Doubles, and Mixed Doubles
- Court selection
- Team assignment
- Match sets and scoring
- Manual status, walkover, draw, and abandoned-result handling
- Match results summary and export-friendly presentation
- Automatic Ball, Court, and Light charge generation

### Training and outsider workflows

- Training attendance management
- Category-specific Training fees
- Pooled Training Light fee divided among eligible attendees
- Safe charge recalculation when attendance changes
- Protection for manually adjusted Light charges
- Outsider Play Ball and Racket rentals

### Fee rules

- Ball, Court, Light, Training, Ball Rental, and Racket Rental fee types
- Organization-defined participant categories
- Optional match-type conditions
- Active/inactive rules
- Specific rules with general fallback behavior
- Explicit zero-value exemptions
- Responsive card and table layouts

### Charges, payments, and ledgers

- Session and Match charge breakdowns
- Participant totals
- Editable one-off charge amounts
- Required adjustment reason
- Adjustment history in Session Charges and Participant Ledger
- Empty adjustment histories hidden automatically
- Payments and running participant balances
- Charges grouped by type and date
- Compact charge and payment tables
- Copy-as-text ledger statement
- PNG ledger export
- Outstanding-balances CSV export for Excel and Google Sheets

## Application Routes

| Route | Purpose |
|---|---|
| `/` | Dashboard |
| `/outstanding` | Outstanding balances |
| `/participants` | Participants and ledgers |
| `/sessions` | Session-centered club operations |
| `/courts` | Court management |
| `/fee-rules` | Organization fee rules |

## Environment Variables

Create `.env.local` for local development:

```env
VITE_API_URL=http://localhost:8080
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

Production normally uses the Vercel rewrite:

```env
VITE_API_URL=/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

Variables prefixed with `VITE_` are exposed to browser code. Never place database credentials, Google client secrets, or other private server values in them.

## Local Development

### Requirements

- Node.js 22 or newer
- npm
- RallyLedger API running locally

Clone and install:

```bash
git clone https://github.com/kurovin/rallyledger-web.git
cd rallyledger-web
npm install
```

Start Vite:

```bash
npm run dev
```

Expose the development server to another device on the local network:

```bash
npm run dev -- --host
```

When testing Google login, add each development origin—such as `http://localhost:5173` or a LAN origin—to the Google OAuth client's authorized JavaScript origins.

## Validation

Before committing:

```bash
npm run lint
npm run build
git diff --check
```

Use LF line endings for source files. In VS Code, click `CRLF` in the status bar, choose `LF`, and save if `git diff --check` reports `^M` as trailing whitespace.

## API Client

All network requests go through the shared API client. It:

- Prepends `VITE_API_URL`
- Includes the HttpOnly session cookie
- Parses JSON and empty `204` responses
- Converts unsuccessful responses into `ApiError`
- Dispatches the global authentication-expired event for `401` responses

The browser is not trusted to select an arbitrary organization ID. The active organization is controlled by the authenticated server session.

## Production Deployment

```text
Browser
    ↓
Vercel — React + Vite
    ↓  /api/* rewrite
Render — RallyLedger API
    ↓
Neon — PostgreSQL
```

The frontend is deployed on Vercel. Pushes to the configured production branch trigger deployments. Confirm that `VITE_GOOGLE_CLIENT_ID` is configured and that `/api/*` forwards to the deployed Render service.

## Project Status

`v1.0.0` is the first production release. Current post-V1 priorities include administrator access management, a unified organization audit log, expanded integration testing, and production performance monitoring.

## Author

**Kharl Rovin Ocampo**  
Creator and full-stack developer of RallyLedger