# EventRent — local development

## Requirements

- Node.js 20 or newer
- MongoDB running locally on port `27017`

## Install dependencies

Run `npm install` once in `frontend` and in every folder under `microservices`.

## Start everything

From the project root, run:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-project.ps1
```

This starts one terminal per service. The frontend is available on `http://localhost:3001`; the API gateway is `http://localhost:3000`.

## Production configuration

Copy `.env.example` into your secret manager or deployment environment. Set a unique `JWT_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`; never use the development defaults in production.

Each stateful service uses its own MongoDB database locally: `eventrent-auth`, `events`, `eventrent-traiteurs`, `eventrent-reservations`, and `eventrent-notifications`.
