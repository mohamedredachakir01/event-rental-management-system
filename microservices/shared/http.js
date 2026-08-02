const crypto = require('crypto');

const getToken = (header = '') => (header.startsWith('Bearer ') ? header.slice(7) : header);

const sendError = (res, status, message, details) =>
  res.status(status).json({ success: false, message, ...(details ? { details } : {}) });

const auth = (secret, jwt) => (req, res, next) => {
  const token = getToken(req.headers.authorization);

  if (!token) return sendError(res, 401, 'Authentication is required.');

  try {
    req.user = jwt.verify(token, secret);
    return next();
  } catch {
    return sendError(res, 401, 'Your session is invalid or has expired.');
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') return sendError(res, 403, 'Administrator access is required.');
  return next();
};

const asyncHandler = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

const pagination = (query) => {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 20, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

const cleanText = (value, maxLength = 255) =>
  typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, maxLength) : '';

const isValidDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value || '') && !Number.isNaN(Date.parse(value));

const setupApp = (app, serviceName) => {
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    req.requestId = crypto.randomUUID();
    res.setHeader('X-Request-Id', req.requestId);
    next();
  });
  app.get('/health', (_req, res) => res.json({ success: true, service: serviceName, status: 'ok' }));
};

const notFound = (req, res) => sendError(res, 404, `Route ${req.method} ${req.originalUrl} was not found.`);

const errorHandler = (error, req, res, _next) => {
  console.error(`[${req.requestId || 'unknown'}]`, error.message);
  if (error.name === 'MongooseServerSelectionError' || error.name === 'MongoServerSelectionError') {
    return sendError(res, 503, 'The database is temporarily unavailable. Please try again shortly.');
  }
  if (error.name === 'ValidationError') return sendError(res, 422, 'Validation failed.');
  if (error.name === 'CastError') return sendError(res, 400, 'The provided identifier is invalid.');
  return sendError(res, 500, 'An unexpected server error occurred.');
};

const requireEnvironment = (name, fallback) => {
  const value = process.env[name] || fallback;
  if (process.env.NODE_ENV === 'production' && (!value || value === fallback)) {
    throw new Error(`${name} must be configured in production.`);
  }
  return value;
};

module.exports = {
  adminOnly, asyncHandler, auth, cleanText, errorHandler, isValidDate, notFound,
  pagination, requireEnvironment, sendError, setupApp,
};
