# TimmyTails — frontend redesign

This is the supplied React + Vite frontend, redesigned using the attached screenshots. It is not a separate demo project.

## Run locally

Use Node.js 22.12 or newer. Extract the ZIP, open a terminal in the extracted `frontend` folder (the folder containing `package.json`), then run:

```sh
npm install
npm run dev
```

Open the local address printed by Vite, normally `http://localhost:5173`.

To produce the production build:

```sh
npm run build
```

The archive excludes `node_modules`, generated `dist`, and tool caches. `npm install` restores dependencies. All supplied source assets and environment configuration are retained.

## What changed

- Centered, restrained header, service dropdowns, account navigation, and mobile hamburger menu.
- Warm ivory, blush, charcoal, and muted gold palette with a consistent serif treatment.
- Homepage with large oval hero placeholder, smaller arch, five service icons, split before/after treatment, benefits, Why Choose Us, dark service grid, booking steps, gallery, salon section, and four-column footer.
- Services page uses the arch hero, alternating image/text section, large benefits panel, FAQ, and service pricing grid from the reference compositions.
- Every existing service is accessible at `/services?service=SERVICE_ID`; its booking button carries that selection through the sign-in return URL.
- About and Contact use the same editorial layouts. The Contact form fields, validation, and submission handler remain.
- Login, Signup, and Forgot Password use placeholder artwork. Their authentication flows and validation remain.
- Existing protected pages, booking controls, modals, and mobile bottom navigation receive the shared neutral palette and flatter controls.
- Public marketing photos are placeholders; actual user pet photos, AI previews, and booking references remain functional.
- Gallery controls and booking actions are retained. Automatic gallery rotation is optional with an explicit play/pause control and reduced-motion support.
- Existing operational information, service names, prices, durations, legal text, and meaningful UI labels remain. Marketing paragraphs use temporary copy.

## Replace placeholders later

Use `src/components/editorial/ImagePlaceholder.jsx`. It accepts `label`, `variant`, `className`, `src`, and `alt`. Passing a real `src` replaces the placeholder without changing its container.

```jsx
<ImagePlaceholder
  variant="arch"
  src="/your-grooming-photo.jpg"
  alt="A pet receiving grooming care"
/>
```

The shared styles, design tokens, dimensions, and breakpoints are in `src/index.css`. Shared page sections are in `src/components/editorial/Sections.jsx`. Existing service identifiers and display prices are in `src/data/services.js`.

The reference screenshots show different desktop zoom levels. The implementation uses a consistent 864px public content container, with wider hero artwork, full-width service benefits, and a wide footer. Mobile sections stack below 640px; navigation collapses below 900px. The existing mobile account navigation is also retained.

## Validation and limits

- `npm install`: completed.
- `npm run build`: passed. Vite reports an advisory about the existing combined application's JavaScript chunk exceeding 500 kB; it is not a build failure.
- `npm test`: all 8 existing tests passed.
- Targeted ESLint check for the new editorial components, redesigned public pages, header, footer, gallery, and service data: passed.
- Server-rendering smoke checks cover Home, Services, selected service, About, Contact, Login, Signup, Forgot Password, Privacy Policy, and Terms of Service.
- All original application routes remain. API utilities, authentication context, hooks, and existing test files were compared with the uploaded archive and remain byte-for-byte unchanged.
- The cloud browser could not access the local preview. Final browser screenshots, measured desktop/mobile overflow checks, and interactive navigation checks were therefore not completed here. Responsive CSS is implemented but still needs a visual review in your local browser.
- The Express backend from the supplied TimmyTailsRD project has now been transferred into `backend-express/`. Live external-service flows still require MongoDB and any OAuth/SMS/SMTP/AI credentials configured in local environment files.
