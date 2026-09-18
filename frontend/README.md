# Timmy Tails — Integrated Frontend + Backend

This project uses the redesigned React/Vite interface from `frontend-app-main` and the Express/MongoDB backend transferred from `TimmyTailsRD`.

The old TimmyTails frontend design is **not** used as the visual source. Protected customer pages and admin workflows keep the redesigned frontend's warm ivory, charcoal, muted-gold, peach, serif-led editorial system.

## Project structure

```text
frontend-app-main/
├─ src/                    # React frontend
├─ public/
├─ tests/                  # Frontend tests
├─ backend-express/        # Express API, models, services, middleware and tests
├─ .env.example            # Frontend environment template
└─ package.json
```

## Requirements

- Node.js 18+ for the backend; Node.js 22.12+ is recommended for the current Vite frontend.
- MongoDB running locally or a MongoDB Atlas connection string.
- Optional external credentials for Google sign-in, TextBee SMS, SMTP email, and the AI grooming-preview provider.

## 1. Configure and run the backend

```bash
cd backend-express
npm install
cp .env.example .env
npm run dev
```

On Windows Command Prompt, use `copy .env.example .env` instead of `cp`.

At minimum, configure these backend values:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/timmytails
JWT_SECRET=replace_with_a_long_random_secret
FRONTEND_URL=http://localhost:5173
```

The API runs on `http://localhost:5000` by default. The health endpoint is `http://localhost:5000/api/health`.

## 2. Configure and run the frontend

From the project root in a second terminal:

```bash
npm install
cp .env.example .env
npm run dev
```

Frontend environment values:

```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=
```

If Google sign-in is enabled, use the same Google Web Client ID in `VITE_GOOGLE_CLIENT_ID` and the backend `GOOGLE_CLIENT_ID`.

## Integrated functionality

The redesigned frontend is wired to the transferred backend for authentication and OTP flows, Google sign-in, profile completion and editing, pet management, booking and availability, appointment cancellation/rescheduling, notifications, contact messages, AI grooming previews, and the full admin workspace for bookings, schedule, messages, customers, analytics, account status, and broadcast notifications.

The customer and admin operational areas have been structurally redesigned in the V2 pass. The old TimmyTails frontend is used only as a behavior/API reference; protected-page composition now follows the new editorial frontend. See `REDESIGN_V2_NOTES.md` for the navigation and page-architecture changes.

## Validation

```bash
npm run lint
npm test
npm run backend:test
# or
npm run test:all
```

Production frontend build:

```bash
npm run build
```

The backend can also be started from the project root with:

```bash
npm run backend:start
```

## External-service behavior

The code can run locally without every optional integration, but live delivery/generation requires the corresponding credentials:

- MongoDB: required for persistent application data.
- Google OAuth: required for Google sign-in.
- TextBee: required for real SMS OTP delivery; development can use log-only behavior where configured.
- SMTP: required for real email delivery; development falls back to console output when credentials are absent.
- Google Cloud/Gemini or the optional custom LoRA service: required for live AI grooming-preview generation.

See `backend-express/.env.example` for the complete backend configuration template, `INTEGRATION_NOTES.md` for the backend migration audit, and `REDESIGN_V2_NOTES.md` for the customer/admin redesign.
