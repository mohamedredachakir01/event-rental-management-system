const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { asyncHandler, auth, cleanText, errorHandler, notFound, pagination, requireEnvironment, sendError, setupApp } = require('../shared/http');

const app = express(); const PORT = process.env.PORT || 5004;
const JWT_SECRET = requireEnvironment('JWT_SECRET', 'development-only-secret');
const MONGO_URI = requireEnvironment('MONGO_URI', 'mongodb://localhost/eventrent-notifications');
setupApp(app, 'notification-service'); app.use(express.json({ limit: '16kb' }));
const notificationSchema = new mongoose.Schema({ userId: { type: String, required: true, index: true }, message: { type: String, required: true, maxlength: 500 }, type: { type: String, default: 'info' }, readAt: Date }, { timestamps: true });
notificationSchema.index({ userId: 1, createdAt: -1 });
const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 }).then(() => console.log('Notification database connected')).catch((error) => console.error('Notification database unavailable:', error.message));
app.post('/notifications', auth(JWT_SECRET, jwt), asyncHandler(async (req, res) => {
  const message = cleanText(req.body.message, 500); if (!message) return sendError(res, 422, 'A notification message is required.');
  if (req.body.to && req.body.to !== req.user.id && req.user.role !== 'admin') return sendError(res, 403, 'You cannot create a notification for another user.');
  const data = await Notification.create({ userId: req.body.to || req.user.id, message, type: cleanText(req.body.type, 30) || 'info' });
  return res.status(201).json({ success: true, data });
}));
app.get('/notifications', auth(JWT_SECRET, jwt), asyncHandler(async (req, res) => {
  const { page, limit, skip } = pagination(req.query); const filter = req.user.role === 'admin' && req.query.all === 'true' ? {} : { userId: req.user.id };
  const [data, total] = await Promise.all([Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(), Notification.countDocuments(filter)]);
  return res.json({ success: true, data, meta: { page, limit, total, pages: Math.ceil(total / limit) } });
}));
app.use(notFound); app.use(errorHandler); app.listen(PORT, () => console.log(`Notification service listening on ${PORT}`));
