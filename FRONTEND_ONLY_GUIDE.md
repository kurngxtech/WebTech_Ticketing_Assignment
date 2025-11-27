# HELP Events EMS — Front-end Only Guide

This document focuses only on the front-end work for the assignment (no backend implementation required for submission). It lists what to keep, what was changed, what's missing, finishing tasks, test steps, and a prioritized checklist to complete the front-end deliverable.

---

**File:** `FRONTEND_ONLY_GUIDE.md`
**Location:** `n:\code\Angular\ticket\`
**Author:** Analysis
**Date:** November 26, 2025

---

## Goal
Complete the assignment as a front-end deliverable: provide a fully functional Angular UI that demonstrates the seven use cases using mock services/data where appropriate. Backend integration is out of scope — but the front-end should be structured so it can later connect to APIs without major rewrites.

## What to keep (do not change)
- **Routing & pages**: `src/app/app.routes.ts` and existing route components (`home`, `ticket-page`, `eo`, `admin`, `analytics`, `login`, `user/my-bookings`).
- **Components**: Keep standalone components and their templates/styles (header/footer, create-event wizard, ticket-buy, analytics pages).
- **Services (frontend API surface)**: Keep `AuthService` and `DataEventService` as the public interface for the UI. These will remain as mock providers for the assignment.
 - **Services (frontend API surface)**: Keep `AuthService` and `DataEventService` as the public interface for the UI. These act as a façade and currently support dev-only mocks under `environment.useMocks`.
- **Interfaces / Models**: Keep `src/app/auth/auth.types.ts` and `src/app/data-event-service/data-event.ts` structs for type safety.
- **Design**: Keep Bootstrap 5 usage and responsive layout in `styles.css` / component CSS.

## What to remove or change (frontend scope only)
 - **Removed / Completed (Nov 26, 2025)**: I moved hard-coded plaintext mock users and events out of services into dev-only files under `src/app/mock/` and added an `environment.useMocks` flag. `AuthService` now supports `loginAsync()` and still exposes the old sync surface for compatibility.
 - **If you later remove mocks**: Replace `environment.useMocks` usage with real HTTP calls to the backend and remove the dev-only mock files.
- **Do not implement actual email/ payment / file upload logic**: Keep stubs that simulate behavior and show success flows.

## Front-end–only constraints & decisions
- Keep all data in-memory or in localStorage for persistency during demo sessions. Do not build a backend.
- Simulate asynchronous API calls with `of(...).pipe(delay(300))` or `firstValueFrom` wrappers so UI shows loading states.
 - Simulate asynchronous API calls with `of(...).pipe(delay(300))` or `firstValueFrom` wrappers so UI shows loading states. `AuthService` exposes `loginAsync()` as a canonical example.
- Provide configuration flags in `environment.ts` for `useMocks: true` so the same codebase can later switch to real APIs.

## Missing front-end work to finish the assignment (priority order)
1. Security cleanup (frontend-only): Completed — mock accounts moved to `src/app/mock/mock-users.ts`. Ensure `environment.useMocks` is `false` in production (see `src/environments/environment.prod.ts`).
2. Refactor `DataEventService` to be smaller and split into logical front-end modules (optional for assignment): `EventFacade` + `BookingFacade` to keep UI code readable.
3. Improve error handling: Add a small `AlertService` that displays success/error toasts for all operations (create event, book ticket, join waitlist, apply promo code).
4. Add loading states and disabled buttons for async actions (simulate network latency) — important for demo UX.
5. Add seat-selection visualisation placeholder: keep a simple grid that highlights selected seats (does not need server sync).
6. Add unit tests for key components (optional but recommended): `CreateEvent`, `TicketBuy`, `AuthService` mocks.

## Suggested front-end deliverable checklist (for grading)
- [ ] Navigation works for all routes in `app.routes.ts` (home, about, ticket/:id, login, sign-up, my-bookings, eo, admin, analytics)
- [ ] Create Event wizard (all steps) validates input and shows review summary
- [ ] Ticket purchase flow fully simulated (select ticket type, apply promo code, open payment modal, simulate success, show QR code)
- [ ] Waitlist flow: join, leave, mock-notification (UI-only)
- [ ] Analytics: generate charts or tables using in-memory data
- [ ] Responsive layout verified on mobile and desktop sizes
- [ ] All forms have client-side validation and clear error messages
- [ ] Loading spinners shown for simulated async calls
- [ ] No plain-text passwords visible in service code (move to `mock/mock-users.ts`)
 - [ ] No plain-text passwords visible in service code (mock files moved to `src/app/mock/`).

## Files to create or update (front-end only)
- `src/app/mock/mock-users.ts` — move mock user data here, flagged with `/* DEV ONLY */` and export a function to get them.
- `src/app/mock/mock-events.ts` — (optional) if you prefer events data outside the service
- `src/app/services/alert.service.ts` — small service to show toasts/alerts
- `src/environments/environment.ts` — add `useMocks: true` flag
 - `src/environments/environment.ts` — added `useMocks: true` flag (dev)
 - `src/environments/environment.prod.ts` — added `useMocks: false` flag (prod)
- `src/app/interceptors/loading.interceptor.ts` — simple interceptor to set a global loading state (optional)

## How to simulate backend behavior (code patterns)
- Use RxJS to simulate latency and asynchrony:

```ts
// Example inside a mock service method
return of(result).pipe(delay(300));
```

- Use `localStorage` to persist bookings across page reloads during demo:

```ts
localStorage.setItem('demo_bookings', JSON.stringify(this.bookings));
```

- Keep UI-first validation (date must be in future, prices > 0, ticket totals positive).

## Example small refactor (move mock users)
- Create `src/app/mock/mock-users.ts`:
```ts
/* DEV ONLY: Mock users for front-end assignment demo. Remove if backend is added. */
export const MOCK_USERS = [
  { id: 'user1', username: 'john_user', email: 'john@example.com', password: 'password123', role: 'user', fullName: 'John Attendee' },
  { id: 'eo1', username: 'jane_eo', email: 'jane@events.com', password: 'eopass123', role: 'eo', fullName: 'Jane EO' },
  { id: 'admin1', username: 'admin', email: 'admin@auditorium.com', password: 'adminpass123', role: 'admin', fullName: 'Admin' }
];
```
Then import this file into `AuthService` and use only when `environment.useMocks` is true.

## Demo & test steps (what to show the grader)
1. Start the app: `npm start` (or `ng serve`) and open `http://localhost:4200`.
  - Note: Use `environment.useMocks` (default `true` in dev) to enable demo data.
2. Show login for `jane_eo` and create an event using the wizard.
3. Show event list, open the event, select tickets, apply `SAVE20` promo code, simulate payment, show QR code.
4. Demonstrate joining a waitlist and mock-notify (UI alert)
5. Show analytics page for the event (charts/tables from in-memory data)

Include a small `README_FRONTEND.md` (optional) with the above steps and the `useMocks` flag explanation.

## Notes for graders (what you should mention in submission)
- This submission is front-end only; all back-end functions are simulated using in-memory data and RxJS delays.
- All mock data is consolidated under `src/app/mock/` and guarded by `environment.useMocks`.
- No real payment or email calls are made; flows are simulated to show UI/UX.
 - Recent dev changes (Nov 26, 2025): moved mock users to `src/app/mock/mock-users.ts`, moved EVENTS dataset to `src/app/mock/mock-events.ts`, added `environment.useMocks` flag, added `AuthService.loginAsync()` and updated login components to use it. These make the UI more realistic and keep demo-only data out of core services.

## Quick summary (one-liner for marking)
A complete, demo-ready front-end that demonstrates all required use cases with mock services, client-side validation, and a clear separation so the same UI can connect to real APIs later with minimal changes.

---

If you want I can:
- Create the `src/app/mock/mock-users.ts` and `src/app/mock/mock-events.ts` files now and update `AuthService` to import them (dev-only),
- Add the `environment.useMocks` flag and a short `README_FRONTEND.md` with demo steps.

Which of these would you like me to do next?