# AICS Booking API

Express REST API for user CRUD operations using MongoDB, Mongoose, Joi, and bcrypt.

## Requirements

- Node.js 20+ and npm for local development, or Docker Compose

## Start with Docker

1. From this directory, copy `.env.example` to `.env` and replace the example credentials.
2. Start the client, API, MongoDB, and Mongo Express:

   ```sh
   docker compose up --build
   ```

The client listens at `http://localhost:3002`, the API at `http://localhost:5000`, and Mongo Express at `http://localhost:8082` (use the credentials from `.env`). The host ports can be changed with `CLIENT_PORT` and `MONGO_EXPRESS_PORT`; for example, set `MONGO_EXPRESS_PORT=8081` if that port is free. Stop the services with `docker compose down`; persisted database data remains in the `mongo_data` volume. Use `docker compose down -v` only when you intend to delete that data.

## Start locally

1. Copy `.env.example` to `.env` and set `MONGO_URI` to a reachable MongoDB instance.
2. Install dependencies and start the API:

   ```sh
   npm install
   npm run dev
   ```

## API endpoints

- `POST /api/users` — Create a user.
- `GET /api/users` — List users.
- `GET /api/users/:id` — Get a user.
- `PUT /api/users/:id` — Update user fields.
- `DELETE /api/users/:id` — Delete a user.

Create and update requests accept `fname`, `mname`, `lname`, `email`, `username`, `password`, and `role`. The create request requires first/last name, valid email, alphanumeric username, and a password of at least eight characters with uppercase, lowercase, and numeric characters. The role defaults to `user`. Unknown request-body keys are stripped. Passwords are bcrypt-hashed on save and never included in API responses.

Example create request body:

```json
{
  "fname": "Ada",
  "mname": null,
  "lname": "Lovelace",
  "email": "ada@example.com",
  "username": "adalovelace",
  "password": "Example123",
  "role": "user"
}
```

All responses use a JSON envelope with `success`, `message`, and (when applicable) `data`. Validation errors include an `errors` array with field and message details.

## Deployment note

The included Compose credentials are for local development only. Replace them with strong secrets and restrict exposed ports and Mongo Express access before deploying to a shared or public environment. This CRUD API does not include authentication/authorization; protect administrative and user-management endpoints before public deployment.
# aics-booking-api
