# Studioflow — Agency CRM

Studioflow is a full-stack SaaS CRM for small agencies and freelancers. It covers clients, projects, tasks, invoices, team collaboration, and dashboard analytics — built with Next.js, Supabase, and Resend.

## Tech stack

- **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui
- **Backend:** Server Actions, Supabase (Auth, PostgreSQL, Storage)
- **Email:** Resend
- **PDF:** pdf-lib
- **Deployment:** Vercel + Supabase Cloud

## Prerequisites

- Node.js 20+
- npm
- Supabase project (URL, anon/publishable key, service role key)
- Resend API key with verified sender domain/email

## Local setup

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env.local
```

3. Fill in `.env.local` with your Supabase and Resend credentials.

4. Apply database migrations (Supabase CLI or SQL editor):

```bash
# From project root, if using Supabase CLI linked to your project:
supabase db push
```

Migration files live in `supabase/migrations/`.

5. (Optional) Seed demo data:

```bash
npm run seed
```

6. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase publishable/anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key (server only) |
| `RESEND_API_KEY` | Yes | Resend API key |
| `RESEND_FROM_EMAIL` | Yes | Verified sender, e.g. `Studioflow <hello@yourdomain.com>` |
| `NEXT_PUBLIC_APP_URL` | Yes | App URL for auth redirects and email links |
| `CRON_SECRET` | Production | Bearer token for `/api/cron/overdue-invoices` |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run lint` | ESLint |
| `npm run seed` | Seed database with demo data |

## Deploy to Vercel

1. Push the repo to GitHub and import the project in Vercel.
2. Set all environment variables from `.env.example` in the Vercel project settings.
3. Generate a strong `CRON_SECRET` and add it to Vercel env vars.
4. Ensure Supabase migrations are applied on your production database.
5. Deploy — Vercel will run `npm run build`.

The included `vercel.json` schedules a daily cron job at 09:00 UTC to mark overdue invoices and send reminder emails.

### Supabase auth redirect URLs

Add these to your Supabase Auth URL configuration:

- `http://localhost:3000/auth/callback` (local)
- `https://your-domain.com/auth/callback` (production)

## Documentation

- Product requirements: [`docs/PRD.md`](docs/PRD.md)
- Architecture: [`docs/Tech.md`](docs/Tech.md)
- Database schema: [`docs/DB.md`](docs/DB.md)

## Email triggers

| Email | Trigger |
|-------|---------|
| Welcome | After email confirmation / first login |
| Task assigned | Task assignee set or changed |
| Project completed | Project status → Completed |
| Invoice created | New invoice created (sent to client) |
| Invoice overdue | Due date passed or status → Overdue |

## License

Private — portfolio / commercial SaaS demo project.
