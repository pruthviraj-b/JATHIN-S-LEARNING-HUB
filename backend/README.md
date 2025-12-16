# Backend (Express + Prisma)

Prereqs:
- Node.js 18+
- PostgreSQL (or change `DATABASE_URL` in `.env`)

Quick start (PowerShell):

```powershell
cd backend
copy .env.example .env
# Edit .env, then:
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

The server listens on the port in `.env` (default `4000`).
