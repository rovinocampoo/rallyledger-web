# RallyLedger Web

Responsive administration interface for **RallyLedger**, a multi-organization tennis club operations and financial ledger platform.

**Release:** v1.0.0

**Live application:** https://rallyledger-web.vercel.app

**Developer:** Kharl Rovin Ocampo (https://github.com/kurovin)

## Overview

RallyLedger Web provides authorized club administrators with a single interface for participants, courts, sessions, matches, fee rules, products, charges, payments, ledgers, balances, reports, organization administration, and audit history.

It also provides the public-facing RallyLedger landing page, walkthrough, FAQ, and legal-information pages.

Organization identity and available club access come from the authenticated API session.

## Technology

* React
* TypeScript
* Vite
* Tailwind CSS v4
* React Router
* Fetch API
* Google Identity Services
* html-to-image
* Vercel

The frontend communicates with a Go, chi, pgx, and PostgreSQL API deployed on Render with Neon as the production database.

## Application Features

### Public website

* Public landing page
* Product and platform overview
* Walkthrough page
* FAQ page
* Privacy Policy page
* Terms of Service page
* Cookie Policy page
* Disclaimer page
* Shared public navigation and footer
* Responsive public layout
* Direct navigation to administrator login

The current legal pages are Pass 1 shells. Substantive legal content will be finalized after the application's actual storage, cookies, analytics, third-party services, payment handling, and data-retention behavior are reviewed.

### Authentication and organizations

* Email/password administrator login
* Google administrator login
* HttpOnly cookie authentication
* Session restoration on refresh
* Global handling of expired sessions and `401` responses
* Logout
* Forced password-change flow
* Theme switching
* Multi-organization access
* Club switching
* Organization-aware headings and branding
* Organization logo support
* Organization GCash number configuration
* Organization GCash QR code management
* Protected application interface

Authentication tokens are never stored in `localStorage`.

Authenticated API requests use:

```ts
credentials: "include"
```

### Dashboard and reports

* All-time, today, monthly, and custom date ranges
* Participant, session, and match totals
* Charge, payment, and net-balance summaries
* Top outstanding balances
* Payment overview
* Responsive desktop and mobile layouts

### Participants

* Searchable participant list
* Add, edit, and delete participants
* Nullable birthday support
* Membership status
* Temporary guests
* Organization-defined participant categories
* Group/family package workflows
* Participant ledger access
* Payment recording

### Courts

* Add, edit, and delete courts
* Surface and location details
* Active/inactive status
* Responsive card and desktop layouts

### Sessions

* Regular Play, Training, Outsider Play, and Event workflows
* Dates, times, capacity, and attendance
* Full, half, or no light usage
* Free-ball and free-light overrides
* Quick guest creation
* Match, Training, activity, results, and charge panels
* Session-centered club operations
* Product and participant charging within club workflows

### Matches and results

* Singles, Doubles, and Mixed Doubles
* Court selection
* Team assignment
* Match sets and scoring
* Manual results and result status
* Walkovers
* Draws
* Abandoned matches
* Ball, Court, and Light charge generation
* Session-level match charge generation
* Per-match charge generation fallback
* Charge verification before financial generation

### Training and outsider workflows

* Training attendance management
* Category-specific Training fees
* Pooled Training Light fees divided among eligible attendees
* Safe charge recalculation when attendance changes
* Protection for manually adjusted Light charges
* Outsider Play workflows
* Ball and racket rentals

### Fee rules

* Ball, Court, Light, Training, Ball Rental, and Racket Rental fee types
* Organization-defined participant categories
* Optional match-type conditions
* Active/inactive rules
* Specific rules with general fallback behavior
* Explicit zero-value exemptions
* Responsive card and table layouts

### Products

* Product listing and management
* Create and edit products
* Product descriptions and pricing
* Active/inactive product state
* Participant product charging
* Any participant type can purchase a product
* Current product price used when creating a new charge
* Historical product charges retain their original amount
* Product names displayed in ledgers and charge details
* Product-aware text and PNG ledger exports

### Group and family packages

* Multiple participants within one package
* Responsible participant workflow
* Full package charge assigned to the responsible participant
* No split-charge calculation

### Charges, payments, and ledgers

* Session and Match charge breakdowns
* Participant totals
* Editable one-off charge amounts
* Required adjustment reasons
* Adjustment history
* Empty adjustment histories hidden automatically
* Payments and running participant balances
* Charges grouped by type and date
* Product names in charge details
* Compact charge and payment tables
* Copy-as-text ledger statements
* PNG ledger export
* GCash payment number and QR code in ledger PNG exports
* Outstanding-balances CSV export for Excel and Google Sheets

### Administration

* Administrator access management
* Role-aware application navigation
* Password management
* Forced password changes
* Unified organization audit log
* Organization settings
* Organization branding
* Organization GCash number and QR configuration

### Calendar

* Calendar-based session and match navigation
* Session selection
* Match selection
* Touch-friendly interaction
* Long-press/drag session creation support
* Hourly, daily, weekly, and monthly calendar expansion planned for future work

## Application Routes

### Public

| Route          | Purpose                    |
| -------------- | -------------------------- |
| `/`            | Public landing page        |
| `/walkthrough` | Product walkthrough        |
| `/faq`         | Frequently asked questions |
| `/privacy`     | Privacy Policy             |
| `/terms`       | Terms of Service           |
| `/cookies`     | Cookie Policy              |
| `/disclaimer`  | Disclaimer                 |
| `/login`       | Administrator login        |

### Authenticated

| Route                    | Purpose                          |
| ------------------------ | -------------------------------- |
| `/`                      | Dashboard                        |
| `/outstanding`           | Outstanding balances             |
| `/participants`          | Participants and ledgers         |
| `/sessions`              | Session-centered club operations |
| `/courts`                | Court management                 |
| `/products`              | Product management and charging  |
| `/fee-rules`             | Organization fee rules           |
| `/calendar`              | Calendar workspace               |
| `/admin/access`          | Administrator access management  |
| `/admin/audit-logs`      | Organization audit log           |
| `/organization-settings` | Organization configuration       |
| `/change-password`       | Password management              |

## Environment Variables

Create `.env.local` for local development:

```env
VITE_API_URL=http://localhost:8080

VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

Production normally uses:

```env
VITE_API_URL=/api

VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

Variables prefixed with `VITE_` are exposed to browser code.

Never place database credentials, Google client secrets, or other private server values in frontend environment variables.

The Google OAuth client ID is public configuration and is safe to expose to browser code. The client secret is not.

## Local Development

### Requirements

* Node.js 22 or newer
* npm
* RallyLedger API running locally

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

When testing Google login, add each development origin, such as:

```text
http://localhost:5173

http://localhost
```

to the Google OAuth client's authorized JavaScript origins.

## Validation

Before committing:

```bash
npm run lint

npm run build

git diff --check
```

Use LF line endings for source files. In VS Code, click `CRLF` in the status bar, choose `LF`, and save if `git diff --check` reports `^M` as trailing whitespace.

## API Client

All network requests go through the shared API client.

It:

* Prepends `VITE_API_URL`
* Includes the HttpOnly session cookie
* Parses JSON and empty `204` responses
* Converts unsuccessful responses into `ApiError`
* Dispatches the global authentication-expired event for `401` responses

The browser is not trusted to select an arbitrary organization ID. The active organization is controlled by the authenticated server session.

## Production Deployment

```text
Browser
    ↓
Vercel — React + Vite
    ↓  /api/*
Render — RallyLedger API
    ↓
Neon — PostgreSQL
```

The frontend is deployed on Vercel.

Pushes to the configured production branch trigger deployments.

Production configuration must include:

```text
VITE_API_URL=/api

VITE_GOOGLE_CLIENT_ID=<web OAuth client ID>
```

The production frontend origin must also be configured in the Google OAuth client's authorized JavaScript origins.

## Current Product Roadmap

### V1.2

* Audited Payment Corrections
* Financial Reporting
* Accounting Close & Lock

### V1.3

* Organization Settings improvements
* Fee-Rule Improvements
* Bulk Participant Management
* Session Workflow Polish
* Date-only birthday cleanup
* Charge-adjustment optimization
* Performance improvements

### V1.4

* Auditor Role
* Player Portal

### After V1.4

* Notifications

Additional workflow items being tracked include:

* Editable session players after charges
* Coordinator match-player editing
* Generate Charges reappearing immediately when a new match is added
* Pre-generation player-name confirmation
* Audited participant reassignment workflow
* Matches PNG issue
* Safer test/demo workflows
* Backend calendar endpoint
* Frontend bundle-size and code-splitting improvements

## Project Status

`v1.0.0` is the first production release and is currently deployed for active club use.

The application now includes the public RallyLedger site, administrator authentication, multi-organization administration, participants, courts, sessions, matches, fee rules, products, charges, payments, ledgers, organization administration, GCash payment information, and audit history.

The next major product phase is **V1.2: audited payment corrections, financial reporting, and accounting close/lock**.

## Author

**Kharl Rovin Ocampo**

Creator and full-stack developer of RallyLedger
