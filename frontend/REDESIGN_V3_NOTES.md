# TimmyTails Redesign V3

This pass separates the application into three navigation contexts and rebuilds the booking flow around the customer task rather than around the preview technology.

## Navigation architecture

- **Public website** (`/`, `/about`, `/services`, `/contact`, policy pages) uses the public marketing header and public mobile navigation.
- **Customer portal** (`/dashboard`, `/appointments`, `/my-pets`, `/profile`, `/booking`) uses `CustomerHeader.jsx` and customer-only mobile navigation. The public Home/About/Services navigation is not rendered inside customer pages.
- **Admin** (`/admin`) remains a standalone workspace with its own administration header and task navigation. The TimmyTails logo opens the admin overview; `View website` is an explicit exit from the workspace.

## Booking redesign

- Booking is now a sequential flow. Only the active step is shown on desktop and mobile.
- Non-haircut services skip the style-preview step entirely.
- The permanent right-side booking summary was removed.
- The booking can only be confirmed on the final Review step.
- The service copy was rewritten in a salon/service tone with realistic scope descriptions.
- Preview UI uses customer-facing wording such as **Style preview**, **Create preview**, **Original photo**, and **Preview** instead of presenting the interface as an AI demonstration.
- Seasonal promotional badges, top-suggestion labels, breed-marketing badges, and long generated recommendation copy were removed from the customer flow.
- Style cards now use concise grooming descriptions and a short groomer note about coat condition, maintenance, or safety.
- Preview generation still uses the existing backend contract and cache/verification workflow. The customer chooses a style, generates it, reviews the result, and then continues to Date & Time.
- The final review includes pet, service, reference style when relevant, date/time, price, and the generated reference image when available.

## Admin copy cleanup

Admin remains explicit about operational data but customer-preview terminology was normalized to **Style preview** / **Grooming style reference** where the underlying implementation detail is not needed for day-to-day salon work.

## Validation

- Frontend ESLint: 0 errors / 0 warnings.
- Frontend tests: 10/10 passing, including new layout-separation and booking-presentation checks.
- Backend tests: 37/37 passing.
- Production Vite build cannot be executed in the provided Linux workspace using the archived dependency folder because that folder is missing the Linux Rolldown native optional binding. A clean `npm install` on the target machine installs the appropriate native dependency.
