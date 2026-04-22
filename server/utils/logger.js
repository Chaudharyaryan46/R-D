const pino = require('pino');
const path = require('path');

const isDevelopment = process.env.NODE_ENV === 'development';

const transports = pino.transport({
  targets: [
    // 1. Console Transport (Pretty in Dev)
    {
      target: 'pino-pretty',
      level: process.env.LOG_LEVEL || 'info',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
    // 2. Persistent File Transport (with Rotation)
    {
      target: 'pino-roll',
      level: 'info',
      options: {
        file: path.join(__dirname, '..', 'logs', 'app.log'),
        size: '10m',      // Rotate when file reaches 10MB
        interval: '1d',   // Or rotate daily
        mkdir: true,      // Ensure the directory exists
        limit: {
          count: 5        // Keep only the last 5 log files
        }
      },
    },
  ],
});

const logger = pino(
  {
    level: process.env.LOG_LEVEL || 'info',
    // In production, we might want to disable console pretty print to avoid overhead
    // but here we keep it flexible based on the transports defined above.
  },
  transports
);

module.exports = logger;
