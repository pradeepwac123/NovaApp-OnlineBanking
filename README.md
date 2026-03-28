# NovaPay — Digital Banking for Every Indian

A full-stack digital banking web app built with Next.js 14, Tailwind CSS, Prisma, PostgreSQL, and NextAuth.js. PWA-enabled and mobile-first.

## Tech Stack
- **Frontend**: Next.js 14 (App Router), Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (Neon / Supabase)
- **Auth**: NextAuth.js (Credentials)
- **PWA**: next-pwa

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
Create `.env.local`:
```env
DATABASE_URL=postgresql://user:password@host:5432/novapay
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_LOCAL_IP=192.168.1.X
```

Get a free PostgreSQL database from [Neon](https://neon.tech) or [Supabase](https://supabase.com).

### 3. Setup database
```bash
npx prisma migrate dev --name init
npx prisma db seed
```

### 4. Generate PWA icons
Place 192x192 and 512x512 PNG icons in `public/icons/`. You can convert the SVG at `public/icons/icon.svg`.

### 5. Run
```bash
npm run dev
```

### 6. QR/Mobile KYC Testing
For the QR code camera flow to work between desktop and phone:
1. Find your local IP: `ipconfig` (Windows) / `ifconfig` (Mac/Linux)
2. Set `NEXT_PUBLIC_LOCAL_IP` in `.env.local`
3. Phone must be on the **same WiFi network**
4. Access: `http://192.168.x.x:3000`

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| User 1 | demo1@novapay.in | Test@1234 |
| User 2 | demo2@novapay.in | Test@1234 |
| Admin | admin@novapay.in | Admin@1234 |

## Features
- Landing page with animations
- Signup / Login with NextAuth
- 6-step onboarding with KYC (QR + camera flow)
- Dashboard with balance, send money, transaction history
- Admin panel with user management and fund control
- PWA installable on mobile
