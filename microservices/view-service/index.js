const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { adminOnly, asyncHandler, auth, errorHandler, notFound, requireEnvironment, sendError, setupApp } = require('../shared/http');

const app = express();
const PORT = process.env.PORT || 5005;
const JWT_SECRET = requireEnvironment('JWT_SECRET', 'development-only-secret');
const services = {
  events: process.env.EVENT_SERVICE_URL || 'http://localhost:5001',
  reservations: process.env.RESERVATION_SERVICE_URL || 'http://localhost:5003',
  traiteurs: process.env.TRAITEUR_SERVICE_URL || 'http://localhost:5002',
};
setupApp(app, 'view-service');
app.use(express.json({ limit: '16kb' }));

app.get('/dashboard', auth(JWT_SECRET, jwt), adminOnly, asyncHandler(async (req, res) => {
  const headers = { Authorization: req.headers.authorization };
  const client = axios.create({ timeout: 5000, headers });
  const [eventsResult, reservationsResult, traiteursResult] = await Promise.allSettled([
    client.get(`${services.events}/events?limit=100`),
    client.get(`${services.reservations}/reservations?limit=100`),
    client.get(`${services.traiteurs}/traiteurs?limit=100`),
  ]);
  if (eventsResult.status === 'rejected' || reservationsResult.status === 'rejected') {
    return sendError(res, 503, 'Dashboard data is temporarily unavailable.');
  }
  const events = Array.isArray(eventsResult.value.data) ? eventsResult.value.data : eventsResult.value.data.data || [];
  const reservations = reservationsResult.value.data.data || [];
  const traiteurs = traiteursResult.status === 'fulfilled' ? (traiteursResult.value.data.data || []) : [];
  return res.json({ success: true, data: { events, reservations, traiteurs } });
}));
app.use(notFound); app.use(errorHandler); app.listen(PORT, () => console.log(`View service listening on ${PORT}`));
