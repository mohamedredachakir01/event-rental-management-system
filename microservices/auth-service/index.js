const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const crypto = require('crypto');
const {
  asyncHandler, auth, cleanText, errorHandler, notFound, requireEnvironment, sendError, setupApp,
} = require('../shared/http');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = requireEnvironment('MONGO_URI', 'mongodb://localhost/eventrent-auth');
const JWT_SECRET = requireEnvironment('JWT_SECRET', 'development-only-secret');
const ADMIN_EMAIL = requireEnvironment('ADMIN_EMAIL', 'admin@gmail.com').toLowerCase();
const ADMIN_PASSWORD = requireEnvironment('ADMIN_PASSWORD', 'admin123');

setupApp(app, 'auth-service');
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3001'], methods: ['GET', 'POST'] }));
app.use(express.json({ limit: '16kb' }));

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 254 },
  password: { type: String, required: true, select: false },
}, { timestamps: true });
const User = mongoose.models.User || mongoose.model('User', userSchema);
const localUsers = [];
const hasDatabaseConnection = () => mongoose.connection.readyState === 1;

const createToken = (user) => jwt.sign(
  { id: String(user.id), email: user.email, role: user.role || 'user' },
  JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '1h', issuer: 'eventrent-auth' }
);

mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => console.log('Auth database connected'))
  .catch((error) => console.error('Auth database unavailable:', error.message));

app.post('/auth/register', asyncHandler(async (req, res) => {
  const name = cleanText(req.body.name, 100);
  const email = cleanText(req.body.email, 254).toLowerCase();
  const password = req.body.password;

  if (!name || !/^\S+@\S+\.\S+$/.test(email) || typeof password !== 'string' || password.length < 8) {
    return sendError(res, 422, 'Provide a name, a valid email, and a password of at least 8 characters.');
  }
  if (email === ADMIN_EMAIL) return sendError(res, 403, 'This email address cannot be registered.');

  const existingUser = hasDatabaseConnection()
    ? await User.exists({ email })
    : localUsers.some((user) => user.email === email);
  if (existingUser) return sendError(res, 409, 'An account with this email already exists.');

  const passwordHash = await bcrypt.hash(password, 12);
  const user = hasDatabaseConnection()
    ? await User.create({ name, email, password: passwordHash })
    : { id: `local-${crypto.randomUUID()}`, name, email, password: passwordHash };
  if (!hasDatabaseConnection()) localUsers.push(user);
  return res.status(201).json({ success: true, message: 'Account created successfully.', user: { id: user.id, name: user.name, email: user.email } });
}));

app.post('/auth/login', asyncHandler(async (req, res) => {
  const email = cleanText(req.body.email, 254).toLowerCase();
  const password = req.body.password;
  if (!/^\S+@\S+\.\S+$/.test(email) || typeof password !== 'string' || !password) {
    return sendError(res, 422, 'A valid email and password are required.');
  }

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const admin = { id: 'admin-user', email: ADMIN_EMAIL, role: 'admin' };
    return res.json({ success: true, token: createToken(admin), user: admin });
  }

  const user = hasDatabaseConnection()
    ? await User.findOne({ email }).select('+password')
    : localUsers.find((localUser) => localUser.email === email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return sendError(res, 401, 'Invalid email or password.');
  }

  return res.json({ success: true, token: createToken({ id: user.id, email: user.email }), user: { id: user.id, name: user.name, email: user.email, role: 'user' } });
}));

app.get('/auth/profile', auth(JWT_SECRET, jwt), (req, res) => res.json({ success: true, user: req.user }));
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => console.log(`Auth service listening on ${PORT}`));
