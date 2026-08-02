# EventRent production-readiness audit

## Scope and stack

This project is a React frontend with Node.js/Express microservices and MongoDB. It is not a Laravel application, so Laravel and PSR conventions do not apply. The refactor follows Node.js and React conventions while preserving the customer flow and the admin dashboard.

## Implemented changes

| Area | Before | Improved implementation | Benefit |
| --- | --- | --- | --- |
| Shared backend code | Every service copied token extraction, JWT validation, errors, and JSON setup. | `microservices/shared/http.js` owns authentication, role checks, error responses, validation helpers, pagination, health endpoints, and request IDs. | One secure behavior to maintain; less duplication. |
| Secrets | Services used `process.env.JWT_SECRET || 'secret'`; admin credentials were hard-coded. | Production fails fast when required environment values are missing; `.env.example` documents required values. Development defaults remain only for local compatibility. | Prevents accidental production deployment with known secrets. |
| Authentication | Password errors exposed whether the account exists; 10 bcrypt rounds; client decided admin access by email. | Generic invalid-login response, bcrypt cost 12, JWT issuer and configurable expiry, backend-only role enforcement, and role saved after login. | Stronger account protection and authorization. |
| Stored payment data | Reservation service retained `cardNumber`, `expiry`, and `cvv` in memory. | Only the payment method and pending status are persisted. Card details are never stored. | Removes a critical PCI and privacy risk. |
| Reservation/traiteur/notification data | Arrays in process memory were lost on restart and list endpoints were public. | MongoDB schemas, timestamps, indexes, authorization filters, pagination, and capped input sizes. | Durable, scalable data with access control. |
| Dashboard | Any authenticated user could request aggregated data; internal requests had no timeout. | Admin-only dashboard, client authorization forwarded to downstream services, 5-second timeout, partial traiteur degradation. | Protects customer data and avoids hanging requests. |
| Input handling | Minimal truthy checks and unbounded bodies/strings. | JSON size limits, cleaned text, numeric/date validation, schema limits, and consistent 422 errors. | Reduces malformed data and resource abuse. |
| Frontend API calls | Each page repeated `fetch`, content-type parsing, raw authorization, and inconsistent errors. | `frontend/src/lib/api.js` centralizes API URL, JSON parsing, Bearer authentication, and friendly errors. | Less duplication and reliable frontend/backend contract. |
| Frontend UX | No page loading states; dashboard assumed old response shape; forms allowed repeated submits. | Shared loading/empty states, dashboard response support, safer failure behavior, and disabled login submission. | Clearer feedback and fewer accidental duplicate requests. |
| Documentation | Default Create React App README and incomplete local startup notes. | `.env.example`, updated `RUN_PROJECT.md`, and this audit. | Repeatable onboarding and safer configuration. |

## Representative code changes

### Repeated authorization

Before (copied in each service):

```js
const token = req.headers.authorization;
req.user = jwt.verify(token, JWT_SECRET);
```

After:

```js
app.get('/reservations', auth(JWT_SECRET), asyncHandler(async (req, res) => {
  const filter = req.user.role === 'admin' ? {} : { userId: req.user.id };
  // paginated query
}));
```

`auth`, standardized failures, and role checks now come from `shared/http.js`.

### Unsafe reservation persistence

Before:

```js
const reservation = { cardNumber, cardName, expiry, cvv };
reservations.push(reservation);
```

After:

```js
const reservation = await Reservation.create({
  userId: req.user.id, city, date, paymentMethod,
  paymentStatus: 'pending', traiteurSelection,
});
```

The API deliberately does not write payment-card fields. A real payment provider must tokenize card payment data.

### Duplicated frontend requests

Before:

```js
const response = await fetch(`${API_BASE_URL}/events`);
const data = await response.json();
if (!response.ok) throw new Error(data.msg);
```

After:

```js
const data = await apiRequest('/events?limit=12');
```

## Verification completed

- `node --check` completed successfully for every non-dependency microservice JavaScript file and the local runner.
- `npm.cmd run build` completed successfully for the React production bundle.

## Scores after this refactor

| Dimension | Score | Notes |
| --- | ---: | --- |
| Performance | 6/10 | Pagination, indexes, lean reads, body limits, and timeout added; no cache/CDN/observability yet. |
| Security | 6/10 | Sensitive payment storage removed, validation and authorization improved; rate limiting, refresh tokens, secret manager, and HTTPS deployment remain. |
| Maintainability | 7/10 | Shared backend utilities and frontend API client reduce duplication; a TypeScript migration and test suite remain. |
| UI/UX | 6/10 | Loading and empty states added; a full design-system/accessibility pass remains. |
| Code quality | 7/10 | Clearer boundaries and standard errors; some legacy single-file service structure remains. |
| Production readiness | 5/10 | Safer and persistent, but deployment, automated tests, CI/CD, monitoring, payments, and infrastructure hardening are still required. |

## Remaining work before a real production launch

1. Use a managed MongoDB cluster with backups, TLS, least-privilege database users, and distinct production databases.
2. Replace the development admin-password branch with seeded admin users, password reset, email verification, refresh-token rotation, and token revocation.
3. Add Helmet/CSP, gateway rate limiting, request logging/metrics, audit logs, CORS allow-lists, HTTPS, and a reverse proxy.
4. Integrate a PCI-compliant payment provider; never collect card data directly in this application.
5. Add integration/unit/E2E tests, linting/formatting, dependency auditing, and CI/CD checks.
6. Move the React app from Create React App to a supported build tool such as Vite; add code-split routes, image CDN/optimization, and an accessible component system.
7. Add real hall availability, booking-conflict transactions, notification delivery (email/SMS), and a contact-service endpoint.
8. Split remaining service entry files into routes, controllers, domain services, repositories, and models as the feature set grows.
