# AICS Booking API

Express REST API for user CRUD operations using MongoDB, Mongoose, Joi, and bcrypt.

Authentication uses Passport Local, HTTP-only session cookies stored in MongoDB, CSRF tokens, and login rate limiting. Register at the client `/register` page or seed users with the optional seeder. User CRUD endpoints require a signed-in session. Session data survives API-container restarts as long as MongoDB data is retained.

## Requirements

- Node.js 20+ and npm for local development, or Docker Compose

## Start with Docker

1. From this directory, copy `.env.example` to `.env` and replace the example credentials.
2. Start the client, API, MongoDB, and Mongo Express:

   ```sh
   docker compose up --build
   ```

The client is available at `http://localhost:3000` and the Express API at `http://localhost:8000` (`/health` for its health check). MongoDB and Mongo Express stay private inside the Compose network. Stop the services with `docker compose down`; persisted database data remains in the `mongo_data` volume. Use `docker compose down -v` only when you intend to delete that data.

## Start locally

1. Copy `.env.example` to `.env` and set `MONGO_URI` to a reachable MongoDB instance.
2. Install dependencies and start the API:

   ```sh
   npm install
   npm run dev
   ```

## API endpoints

- `GET /api/auth/csrf` — Issue a CSRF token (also sets the session cookie).
- `GET /api/auth/me` — Return the current authenticated user, or `null`.
- `POST /api/auth/register` — Create a standard user and sign them in.
- `POST /api/auth/login` — Sign in with email or username and password.
- `POST /api/auth/logout` — Destroy the current session.
- `POST /api/users` — Create a user.
- `GET /api/users` — List users.
- `GET /api/users/:id` — Get a user.
- `PUT /api/users/:id` — Update user fields.
- `DELETE /api/users/:id` — Delete a user.

## Public AICS appointment booking

The public page at `/aics-appointment-booking` does not require a staff account. Its API routes are also public and rate-limited:

- `GET /api/public-booking/calendar-rules` — Return date bounds, holidays, slot times, and capacity.
- `GET /api/public-booking/assistance-types` — Return active assistance types and their requirements from MongoDB. Defaults are inserted on first request and can be adjusted in the `assistanceTypes` collection.
- Authenticated Super Admin and Admin staff can manage the assistance catalog with `GET/POST /api/assistance-types` and `GET/PUT/DELETE /api/assistance-types/:id`. Codes and reference prefixes are immutable after creation. Types with booking history are deactivated instead of removed.
- `GET /api/public-booking/offices` — Return active SWAD, regional, and satellite offices from MongoDB. The supplied Negros Island Region records are inserted on first request and can be adjusted in the `offices` collection.
- Authenticated staff can manage offices with `GET/POST /api/offices` and `GET/PUT/DELETE /api/offices/:id`. Offices with appointment history cannot be deleted; deactivate them instead.
- `GET /api/public-booking/availability?date=YYYY-MM-DD` — Return open slots and remaining daily capacity.
- `POST /api/public-booking` — Book an appointment. Accepts `officeSlug`, `typeOfAssistance`, `firstName`, optional `middleName`, `lastName`, `birthdate` (`YYYY-MM-DD`, not in the future), `cellNumber` (11 digits beginning with `09`), optional `email`, `appointmentDate` (`YYYY-MM-DD`), and `timeSlot`.
- `POST /api/public-booking/lookup` — Find a booking using `appointmentCode` and the booking `cellNumber`.
- `POST /api/public-booking/cancel` — Cancel a future booking using the same two values and optional `cancellationReason`.

Public booking requests are validated on both client and API. The selected assistance type and office must be active in their MongoDB collections. Each office has a configurable daily appointment capacity split into separately configurable AM and PM limits; the AM and PM values must sum to the daily capacity. Defaults are 60 per day, split evenly at 30 AM and 30 PM, shared across all assistance types at that office. Dates on weekends, configured holidays, in the past, or beyond `BOOKING_CALENDAR_VALID_THROUGH` are rejected. MongoDB-backed date locks serialize concurrent reservations so daily and per-period limits are enforced across API instances. The 2026 Philippine regular holiday list is currently configured in the booking controller and should be updated when official annual/Eid dates are announced.

Google Calendar events and email notifications are optional integrations. To enable them, configure `GOOGLE_CALENDAR_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, and `GOOGLE_PRIVATE_KEY` with a service account that has event access to the target calendar, and configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM`. If these values are omitted, booking still works; integration failures are logged and do not roll back a reserved appointment.

## Seed sample users

The seeder inserts nine sample accounts and skips records whose email or username already exists, so it can be run repeatedly without duplicating users. All seeded accounts share the password provided through `SEED_USER_PASSWORD`; the Mongoose save hook bcrypt-hashes it. Choose a temporary local password that meets the API password rules, and do not reuse it for real accounts.

Staff roles are `super_admin`, `admin`, `booking_officer`, and `congressional_officer`. Existing `user` roles can be migrated to `booking_officer` with `npm run migrate:roles`. Existing `admin` accounts remain `admin`; to explicitly designate super admins, set `SUPER_ADMIN_USERNAMES` to a comma-separated list of usernames before running the migration. Public self-registration always receives the least-privilege `booking_officer` role.

For a local API process, set `SEED_USER_PASSWORD` in the API `.env`, ensure MongoDB is reachable via `MONGO_URI`, then run:

```sh
npm run seed
```

When using Docker Compose, the API container has `NODE_ENV=production`, so seeding is deliberately disabled unless explicitly enabled. To run it inside the API container, pass the password without saving it in a file:

```sh
read -s SEED_USER_PASSWORD
export SEED_USER_PASSWORD
docker compose exec -e SEED_USER_PASSWORD -e ALLOW_PRODUCTION_SEED=true app npm run seed
unset SEED_USER_PASSWORD
```

The seeder never logs the password. It does not update or overwrite existing records.

Create and update requests accept `fname`, `mname`, `lname`, `email`, `username`, `password`, and `role`. The create request requires first/last name, valid email, alphanumeric username, and a password of at least eight characters with uppercase, lowercase, and numeric characters. The role defaults to `booking_officer`. Unknown request-body keys are stripped. Passwords are bcrypt-hashed on save and never included in API responses.

Example create request body:

```json
{
  "fname": "Ada",
  "mname": null,
  "lname": "Lovelace",
  "email": "ada@example.com",
  "username": "adalovelace",
  "password": "Example123",
   "role": "booking_officer"
}
```

All responses use a JSON envelope with `success`, `message`, and (when applicable) `data`. Validation errors include an `errors` array with field and message details.

## Deployment note

The included Compose credentials and fallback session secret are for local development only. Set a long random `SESSION_SECRET`, enable secure cookies behind HTTPS, and restrict exposed ports and Mongo Express access before deployment. Authentication is session-based, but authorization policies for administrative operations and account recovery/verification still need to be designed for production.
# aics-booking-api
