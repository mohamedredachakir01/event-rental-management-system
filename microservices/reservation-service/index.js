const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { asyncHandler, auth, cleanText, errorHandler, isValidDate, notFound, pagination, requireEnvironment, sendError, setupApp } = require('../shared/http');

const app = express();
const PORT = process.env.PORT || 5003;
const JWT_SECRET = requireEnvironment('JWT_SECRET', 'development-only-secret');
const MONGO_URI = requireEnvironment('MONGO_URI', 'mongodb://localhost/eventrent-reservations');
setupApp(app, 'reservation-service');
app.use(express.json({ limit: '16kb' }));

const reservationSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  city: { type: String, required: true, trim: true, maxlength: 100 },
  date: { type: String, required: true, index: true },
  paymentMethod: { type: String, enum: ['Carte Bancaire', 'PayPal', 'Cash'], required: true },
  paymentStatus: { type: String, enum: ['pending'], default: 'pending' },
  traiteurSelection: { guests: Number, food: String, drinks: String, tables: Number, chairs: Number, decor: String },
}, { timestamps: true });
reservationSchema.index({ userId: 1, createdAt: -1 });
reservationSchema.index({ city: 1, date: 1 });
const Reservation = mongoose.models.Reservation || mongoose.model('Reservation', reservationSchema);

mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => console.log('Reservation database connected'))
  .catch((error) => console.error('Reservation database unavailable:', error.message));

app.post('/reservations', auth(JWT_SECRET, jwt), asyncHandler(async (req, res) => {
  const city = cleanText(req.body.city, 100);
  const date = req.body.date;
  const paymentMethod = cleanText(req.body.paymentMethod, 30);
  if (!city || !isValidDate(date) || !['Carte Bancaire', 'PayPal', 'Cash'].includes(paymentMethod)) {
    return sendError(res, 422, 'Provide a city, a valid date, and a supported payment method.');
  }
  const selection = req.body.traiteurSelection || {};
  const reservation = await Reservation.create({
    userId: req.user.id, email: req.user.email, city, date, paymentMethod,
    traiteurSelection: { guests: Number(selection.guests) || 0, food: cleanText(selection.food, 50), drinks: cleanText(selection.drinks, 50), tables: Number(selection.tables) || 0, chairs: Number(selection.chairs) || 0, decor: cleanText(selection.decor, 500) },
  });
  return res.status(201).json({ success: true, message: 'Reservation created.', data: reservation });
}));

app.get('/reservations', auth(JWT_SECRET, jwt), asyncHandler(async (req, res) => {
  const { page, limit, skip } = pagination(req.query);
  const filter = req.user.role === 'admin' ? {} : { userId: req.user.id };
  const [data, total] = await Promise.all([Reservation.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(), Reservation.countDocuments(filter)]);
  return res.json({ success: true, data, meta: { page, limit, total, pages: Math.ceil(total / limit) } });
}));
app.use(notFound);
app.use(errorHandler);
app.listen(PORT, () => console.log(`Reservation service listening on ${PORT}`));
