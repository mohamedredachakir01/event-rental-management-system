const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { adminOnly, asyncHandler, auth, cleanText, errorHandler, isValidDate, notFound, pagination, requireEnvironment, sendError, setupApp } = require('../shared/http');

const app = express();
const PORT = process.env.PORT || 5001;
const MONGO_URI = requireEnvironment('MONGO_URI', 'mongodb://localhost/events');
const JWT_SECRET = requireEnvironment('JWT_SECRET', 'development-only-secret');
const fallbackEvents = [
  {
    _id: 'seed-1',
    title: 'Mariage Elegant',
    date: '2026-06-18',
    location: 'Casablanca',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80',
  },
  {
    _id: 'seed-2',
    title: 'Anniversaire Luxe',
    date: '2026-07-08',
    location: 'Rabat',
    image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=900&q=80',
  },
  {
    _id: 'seed-3',
    title: 'Soiree Entreprise',
    date: '2026-08-21',
    location: 'Tanger',
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80',
  },
];
let localEvents = [...fallbackEvents];

setupApp(app, 'event-service');
app.use(express.json({ limit: '64kb' }));

mongoose
  .connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => console.log('Event DB connected'))
  .catch((error) => console.error('Event DB connection error:', error.message));

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    date: { type: String, required: true },
    location: { type: String, required: true, trim: true },
    image: { type: String, default: '', maxlength: 2_000 },
  },
  { timestamps: true }
);

const Event = mongoose.models.Event || mongoose.model('Event', eventSchema);

const normalizeEventPayload = ({ title, date, location, image }) => ({
  title: cleanText(title, 150),
  date,
  location: cleanText(location, 150),
  image: cleanText(image, 2_000),
});

app.post('/events', auth(JWT_SECRET, jwt), adminOnly, asyncHandler(async (req, res) => {
    const { title, date, location, image } = normalizeEventPayload(req.body);

    if (!title || !isValidDate(date) || !location) {
      return sendError(res, 422, 'Title, valid date, and location are required.');
    }

    if (mongoose.connection.readyState !== 1) {
      const fallbackEvent = {
        _id: `seed-${Date.now()}`,
        title,
        date,
        location,
        image: image || '',
      };
      localEvents.unshift(fallbackEvent);
      return res.status(201).json(fallbackEvent);
    }

    const event = await Event.create({ title, date, location, image });
    return res.status(201).json(event);
}));

app.get('/events', asyncHandler(async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
      return res.json(localEvents);
    }

    const { limit, skip } = pagination(req.query);
    const events = await Event.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
    return res.json(events.length ? events : localEvents);
}));

app.put('/events/:id', auth(JWT_SECRET, jwt), adminOnly, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const payload = normalizeEventPayload(req.body);

    if (!payload.title || !isValidDate(payload.date) || !payload.location) {
      return sendError(res, 422, 'Title, valid date, and location are required.');
    }

    if (mongoose.connection.readyState !== 1 || id.startsWith('seed-')) {
      const eventIndex = localEvents.findIndex((event) => event._id === id);

      if (eventIndex === -1) {
        return res.status(404).json({ msg: 'Event not found.' });
      }

      localEvents[eventIndex] = { ...localEvents[eventIndex], ...payload };
      return res.json(localEvents[eventIndex]);
    }

    const updatedEvent = await Event.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });

    if (!updatedEvent) {
      return res.status(404).json({ msg: 'Event not found.' });
    }

    return res.json(updatedEvent);
}));

app.delete('/events/:id', auth(JWT_SECRET, jwt), adminOnly, asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (mongoose.connection.readyState !== 1 || id.startsWith('seed-')) {
      const originalLength = localEvents.length;
      localEvents = localEvents.filter((event) => event._id !== id);

      if (localEvents.length === originalLength) {
        return res.status(404).json({ msg: 'Event not found.' });
      }

      return res.json({ msg: 'Event deleted successfully.' });
    }

    const deletedEvent = await Event.findByIdAndDelete(id);

    if (!deletedEvent) {
      return res.status(404).json({ msg: 'Event not found.' });
    }

    return res.json({ msg: 'Event deleted successfully.' });
}));

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Event Service running on port ${PORT}`);
});
