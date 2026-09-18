# Backend Transfer & Frontend Integration Notes

## What was transferred

The Express backend from `TimmyTailsRD/backend-express` is now included under `backend-express/` in the redesigned frontend project. The transfer includes routes, models, middleware, services, configuration, package manifests, and backend tests.

The original backend `.env` and both projects' `node_modules` were intentionally excluded. Secrets and machine-specific dependency folders should never be packaged as application source.

## Frontend coverage audit

The redesigned frontend already contained functional UI for the backend's major product areas, so duplicate pages were not created:

| Backend capability | Redesigned frontend surface |
| --- | --- |
| Login / Google login / OTP registration | Login, Signup |
| Forgot/reset password | Forgot Password |
| Profile completion / phone OTP / profile update | Complete Profile, Profile |
| Pet CRUD | My Pets |
| Services / availability / create booking | Booking |
| AI style catalog / recommendations / photo verification / generation | Booking style studio |
| Customer appointments / cancel / reschedule | Dashboard, Appointments, appointment modals |
| User notifications | Notification bell / notification hook |
| Contact submission | Contact |
| Admin booking operations | Admin → Bookings / Schedule |
| Admin contacts | Admin → Messages |
| Admin customer account status | Admin → Customers |
| Admin analytics | Admin → Analytics |
| Admin notification broadcasts | Admin → Notifications |

## Migration fixes made

- Fixed the backend database configuration mismatch: code now accepts canonical `MONGODB_URI` and legacy `MONGO_URI`.
- Rebuilt the backend `.env.example` so a fresh setup documents the variables actually used by the transferred backend, including optional AI/LoRA settings.
- Updated a backend end-to-end contract test that still referenced the old `frontend/` directory.
- Fixed conditional React Hook execution in `AppointmentDetailsModal`.
- Moved the shared local-date helper out of the calendar component to keep component exports clean.
- Removed stale/unused redesign state and imports without changing booking behavior.
- Fixed legacy PUT/POST appointment-reschedule aliases so they forward to the PATCH implementation instead of recursively dispatching themselves.
- Updated frontend lint configuration so the nested CommonJS backend is not incorrectly linted as browser ESM.
- Added root convenience scripts for backend start/dev/test and combined tests.

## Design constraint and V2 correction

The first integration retained too much of the old operational-page composition even though it used the redesigned palette. The V2 pass corrects that: customer Overview, Appointments, My Pets, Account, Booking framing, and the Admin workspace now use new page structures and navigation architecture based on the redesigned frontend. The old TimmyTails frontend is retained only as a functionality/API reference. See `REDESIGN_V2_NOTES.md`.

## Validation status

- Frontend tests: **8/8 passing**.
- Backend tests: **37/37 passing** after migration-path fixes.
- Frontend ESLint: **0 errors / 0 warnings**.
- All 60 frontend JS/JSX source files were parsed successfully after the V2 redesign.
- Frontend production build source was checked, but this execution environment could not run the archived Vite dependency because the uploaded Windows `node_modules` contains the Windows Rolldown native binding rather than the Linux binding. A normal `npm install` on the target machine restores the correct platform-specific optional dependency before `npm run build`.

Live end-to-end calls that depend on MongoDB, Google OAuth, TextBee, SMTP, or AI provider credentials require those services to be configured in `.env`.
