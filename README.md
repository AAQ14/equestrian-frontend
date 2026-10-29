# Equestria: React frontend

Frontend for the Equestrian Management & Booking System (Spring Boot API on port 8000).
Built with Vite, React 18, React Router and axios. Plain CSS, no UI library.

## Run
1. Start the backend on port 8000.
2. `npm install` (first time only)
3. `npm run dev`, then open http://localhost:5173

Vite forwards `/api` and `/auth` to `http://localhost:8000` (see `vite.config.js`), so the backend needs no CORS setup.

Demo accounts (password `Password123!`):
admin@equestrian.com · layla@ / omar@equestrian.com (instructors) · sara@ / khalid@ / noor@equestrian.com (clients)

## Features by role
| Role | Pages |
|------|-------|
| Guest | Home, lessons (asks to log in), register, verify email, login, forgot password |
| Client | Lessons + booking, my bookings (cancel, horse), tournaments, cinema seat map, buy ticket, my tickets (cancel, change seat) |
| Instructor | My sessions (create, edit, cancel, book a client), bookings of my sessions (confirm, complete, cancel, horse), tickets |
| Admin | Tournaments (create, edit, cancel), tickets + sales, users (activate/deactivate), horses, instructors, audit log, concurrency demo |

Everyone signed in gets a notification bell with live notifications (Server-Sent Events).

## Folder structure
```
src/
  api/          axiosInstance.js (token + 401 handler), authApi.js, endpoints.js (all other endpoints)
  assets/       images.js (all photo links)
  components/   Navbar, Footer, Button, Toast, ui.jsx (Badge, Modal, Spinner, Skeleton, EmptyState,
                PageHeader, FilterPills), SeatMap, NotificationBell, HorseAssignmentModal, ProtectedRoute
  context/      AuthContext, ToastContext, NotificationContext
  hooks/        useApi (load data), useSse (live notifications), useReveal (scroll animation)
  pages/        auth/, client/, tournaments/, instructor/, admin/
  styles/       variables.css (colours, fonts), global.css
  utils/        format.js (dates, prices, enum lists), jwt.js (read role from the token)
```

## Notes
- The role comes from the JWT (`role` claim), because the login response has no role field.
- SSE uses `fetch` + `ReadableStream` instead of `EventSource`, because EventSource cannot send the `Authorization` header.
- The seat map reloads every 10 seconds and right after a ticket notification. On 409 it shows "This seat was just taken" and refreshes.
- Horse photos: uploaded images are not served by the backend yet, so stock photos are shown.
# equestrian-frontend
