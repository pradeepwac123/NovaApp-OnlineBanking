---
name: NovaPay project context
description: Tech stack, architecture decisions, and key file locations for NovaPay digital banking app
type: project
---

## NovaPay — Digital Banking App

**Stack:** Next.js (App Router), TypeScript, Tailwind CSS, Framer Motion, NextAuth, Prisma

**Why:** South India-focused digital-first bank. Public pages: landing, login, signup. Authenticated: dashboard, send, admin.

**How to apply:** All components are in `app/` using Next.js App Router conventions. `"use client"` directive required for any component using hooks or browser APIs.

### Key File Locations
- Design tokens: `tailwind.config.ts` + `app/globals.css`
- Root layout (fonts, providers): `app/layout.tsx`
- Auth provider wrapper: `components/Providers.tsx`
- Landing page: `app/page.tsx`
- Login/forgot password: `app/login/page.tsx`
- Signup (7-step flow): `app/signup/page.tsx`
- Dashboard: `app/dashboard/page.tsx`
- Admin: `app/admin/page.tsx`
- Mobile WebRTC stream: `app/mobile/stream/page.tsx`

### Signup Flow (7 steps)
1. Account (email, phone, password)
2. Personal details (DOB)
3. MPIN (4-digit PIN with custom PinBoxes component)
4. Document upload (Aadhaar front/back + PAN) — DropZone component
5. Selfie — WebRTC from webcam or phone QR code
6. Review & submit
7. Done (confetti + account summary)

### Light Theme Migration Status (as of 2026-03-29)
All three user-facing authenticated pages are now fully migrated to the Elevated Standard light theme:
- `app/dashboard/page.tsx` — balance hero, virtual card, send money panel, transactions list
- `app/send/page.tsx` — standalone send page (was previously a redirect; now a full send UI with quick-amount chips, recipient search, animated success screen)
- `app/onboarding/page.tsx` — 6-step KYC wizard (progress bar, MPIN boxes, document upload, selfie, confetti done screen)

### Auth
- NextAuth credentials provider
- `/api/auth/me` — get current user + role
- Role-based redirect: admin/super_admin → `/admin`, users → `/dashboard`
- Password reset via `/api/auth/find-user` + `/api/auth/reset-password`

### Environment Variables
- `NEXT_PUBLIC_LOCAL_IP` — used in selfie step for local network QR code generation
