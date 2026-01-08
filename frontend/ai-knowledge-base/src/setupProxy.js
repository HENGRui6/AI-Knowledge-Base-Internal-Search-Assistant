const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:8080',
      changeOrigin: true,
      // Keep the /api prefix so backend receives /api/documents/...
      pathRewrite: { '^/api': '/api' },
    })
  );
};

