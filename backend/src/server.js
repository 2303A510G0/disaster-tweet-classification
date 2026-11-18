import app from './app.js';
import { config } from './config/index.js';

const server = app.listen(config.PORT, () => {
  console.log(`[Express] Backend server running on http://localhost:${config.PORT} (env: ${config.NODE_ENV})`);
});

process.on('SIGTERM', () => {
  console.log('[Express] SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('[Express] HTTP server closed');
  });
});

