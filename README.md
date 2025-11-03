# GHRCE Portal – v4

Modern Next.js portal for student internships, faculty workflows, and admin tools.

## What’s new in v4

- Email system refactor: replaced `lib/email.ts` with `lib/send-email-server.ts` using Nodemailer.
- API hardening and utilities cleanup in `lib/auth-new.ts` and `lib/server-actions.ts`.
- New data imports and companies pipeline under `app/api/import/*` and `app/api/companies`.
- Prisma migrations for repository files and company details.
- Next.js 15 and React 19 upgrade, Tailwind CSS v4 stack.

## Tech stack

- Next.js 15, React 19, TypeScript
- Tailwind CSS v4, shadcn/ui
- PostgreSQL + Prisma (6.16.x)
- Nodemailer for SMTP email

## Getting started

### Prerequisites
- Node.js 18+
- PostgreSQL

### Setup
```bash
git clone https://github.com/Swarnim-Chandve/college.git
cd college
npm install

# Environment
cp .env.example .env
# Then edit .env
```

Required env vars (examples):

- DATABASE_URL=postgresql://user:pass@localhost:5432/college
- NEXTAUTH_SECRET=any-long-random-string (if applicable)
- SMTP_HOST=smtp.yourprovider.com
- SMTP_PORT=587
- SMTP_USER=your-user
- SMTP_PASS=your-pass
- EMAIL_FROM=no-reply@yourdomain.com

### Database
```bash
# Generate Prisma client
npx prisma generate

# Create database schema (dev)
npx prisma db push

# Seed sample data (optional)
npm run db:seed
```

### Run
```bash
npm run dev
# open http://localhost:3000
```

### Build & start (production)
```bash
npm run build
npm run start
```

In CI/CD or hosted environments use Prisma migrate if you manage migrations:
```bash
npx prisma migrate deploy
```

## Project structure
```
college/
├─ app/
│  ├─ api/
│  ├─ faculty/
│  └─ student/
├─ components/
├─ lib/
├─ prisma/
└─ public/
```

## Key routes and scripts

- API: `app/api/companies`, `app/api/import/*`, `app/api/email/send`.
- Seeding: `npm run db:seed` (runs `prisma/seed.ts`).
- Utilities: `scripts/parse-companies.ts`, `scripts/get-actual-student-ids.js`, `scripts/get-random-students.js`.

## Upgrading from v3 → v4

- Replace legacy email envs with SMTP vars listed above.
- Review breaking upgrades for Next.js 15/React 19 and Tailwind v4.
- Ensure Prisma is on 6.16.x and regenerate client.

## Contributing

1. Create a feature branch: `git checkout -b feature/xyz`
2. Commit: `git commit -m "feat: xyz"`
3. Push: `git push origin feature/xyz`
4. Open a PR

## License

MIT
