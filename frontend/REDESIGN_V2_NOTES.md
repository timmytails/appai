# Customer + Admin Redesign V2

This revision replaces the inherited operational-page structure that remained after the first backend integration. The old TimmyTails frontend is now treated only as a behavior/API reference, not a page-composition reference.

## Navigation architecture

### Public + signed-in customer

The public header remains the primary brand navigation. The TimmyTails logo always returns to `/`.

Signed-in customers get:

- a clear **My TimmyTails** account entry in the desktop header;
- notification access in the global header;
- a dedicated customer navigation strip on protected pages: **Overview / Appointments / My Pets / Account**;
- **Book a Visit** treated as a primary action, not as another information-navigation tab;
- the same four customer destinations on mobile bottom navigation.

### Admin

The previous permanent dark admin sidebar was removed. Admin now uses a studio-style workspace header and horizontally scrollable task navigation for:

- Dashboard
- Bookings
- Schedule
- Messages
- Customers
- Analytics
- Notifications

This keeps the admin workspace visually related to the redesigned TimmyTails brand while retaining the denser controls needed for operations.

## Customer-page redesign

- **Overview**: no KPI-card row and no old hero + side appointment-card composition. The page now centers the next-care moment, image-led companion profiles, and a visit timeline.
- **Appointments**: converted from stacked dashboard cards into an editorial visit ledger with upcoming and historical sections.
- **My Pets**: converted to image-led companion portraits with staggered editorial presentation. Editing remains available through the existing pet CRUD backend.
- **Account**: converted from stacked settings cards to a two-column identity/settings layout with numbered sections.
- **Booking**: keeps the working multi-step/AI flow but uses the new customer masthead, flatter section hierarchy, and updated review styling.

## Admin-page redesign

- Replaced sidebar application chrome with a branded top workspace and horizontal navigation.
- Reworked the Admin overview from a card wall into a daily operations board:
  - concise daily figures;
  - today’s schedule;
  - pending approval actions;
  - demand and completion pulse.
- Existing Bookings, Schedule, Messages, Customers, Analytics, and Notifications functionality remains connected to the same backend APIs.

## Functionality intentionally preserved

No backend endpoint contracts were changed as part of the visual redesign. Authentication, pets, bookings, appointment changes, notifications, admin account controls, contact messages, analytics, and AI-preview flows continue to use the transferred Express backend.
