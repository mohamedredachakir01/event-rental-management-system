const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { asyncHandler, auth, cleanText, errorHandler, notFound, pagination, requireEnvironment, sendError, setupApp } = require('../shared/http');

const app = express();
const PORT = process.env.PORT || 5002;
const JWT_SECRET = requireEnvironment('JWT_SECRET', 'development-only-secret');
const MONGO_URI = requireEnvironment('MONGO_URI', 'mongodb://localhost/eventrent-traiteurs');
setupApp(app, 'traiteur-service');
app.use(express.json({ limit: '16kb' }));

const traiteurSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true }, guests: { type: Number, required: true, min: 1, max: 10000 },
  food: { type: String, required: true, maxlength: 50 }, drinks: { type: String, required: true, maxlength: 50 },
  tables: { type: Number, min: 0, max: 10000, default: 0 }, chairs: { type: Number, min: 0, max: 10000, default: 0 }, decor: { type: String, maxlength: 500, default: '' },
}, { timestamps: true });
traiteurSchema.index({ userId: 1, createdAt: -1 });
const Traiteur = mongoose.models.Traiteur || mongoose.model('Traiteur', traiteurSchema);
mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 }).then(() => console.log('Traiteur database connected')).catch((error) => console.error('Traiteur database unavailable:', error.message));

app.post('/traiteurs', auth(JWT_SECRET, jwt), asyncHandler(async (req, res) => {
  const guests = Number(req.body.guests); const food = cleanText(req.body.food, 50); const drinks = cleanText(req.body.drinks, 50);
  if (!Number.isInteger(guests) || guests < 1 || guests > 10000 || !food || !drinks) return sendError(res, 422, 'Provide valid guest, food, and drink options.');
  const data = await Traiteur.create({ userId: req.user.id, guests, food, drinks, tables: Math.max(Number(req.body.tables) || 0, 0), chairs: Math.max(Number(req.body.chairs) || 0, 0), decor: cleanText(req.body.decor, 500) });
  return res.status(201).json({ success: true, data });
}));
app.get('/traiteurs', auth(JWT_SECRET, jwt), asyncHandler(async (req, res) => {
  const { page, limit, skip } = pagination(req.query); const filter = req.user.role === 'admin' ? {} : { userId: req.user.id };
  const [data, total] = await Promise.all([Traiteur.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(), Traiteur.countDocuments(filter)]);
  return res.json({ success: true, data, meta: { page, limit, total, pages: Math.ceil(total / limit) } });
}));
app.use(notFound); app.use(errorHandler); app.listen(PORT, () => console.log(`Traiteur service listening on ${PORT}`));
