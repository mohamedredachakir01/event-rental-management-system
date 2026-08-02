const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;
const withBasePath = (basePath, target) =>
  createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: (path) => `${basePath}${path}`,
  });

app.get('/', (req, res) => {
  res.json({
    msg: 'API Gateway is running',
    frontend: 'http://localhost:3001',
  });
});

app.use('/auth', withBasePath('/auth', 'http://localhost:5000'));
app.use('/events', withBasePath('/events', 'http://localhost:5001'));
app.use('/traiteurs', withBasePath('/traiteurs', 'http://localhost:5002'));
app.use('/reservations', withBasePath('/reservations', 'http://localhost:5003'));
app.use('/notifications', withBasePath('/notifications', 'http://localhost:5004'));
app.use('/view', withBasePath('/view', 'http://localhost:5005'));

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
