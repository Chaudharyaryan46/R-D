const pino = require('pino');
const path = require('path');

/**
 * Proper System Design for Logging:
 * 1. Development: Human-readable 'pretty' output + persistent local file logs.
 * 2. Vercel/Serverless: JSON output to stdout (best for Vercel logs dashboard & log drains).
 * 3. Self-Hosted Production: Optimized JSON output + rotated file storage.
 */

const isVercel = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production' && !process.env.LOCAL_PROD;
const isDevelopment = process.env.NODE_ENV === 'development';

const getTargets = () => {
  // If we are on Vercel, we only log to stdout in JSON format.
  // Filesystem writing is disabled to prevent errors in serverless environments.
  if (isVercel) {
    return [
      {
        target: 'pino/file',
        level: process.env.LOG_LEVEL || 'info',
        options: { destination: 1 }, // 1 = stdout
      }
    ];
  }

  // Local development or self-hosted: Multi-transport support
  return [
    // 1. Console Transport
    {
      target: isDevelopment ? 'pino-pretty' : 'pino/file',
      level: process.env.LOG_LEVEL || 'info',
      options: isDevelopment ? {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      } : { destination: 1 },
    },
    // 2. Persistent File Transport (only for non-serverless)
    {
      target: 'pino-roll',
      level: 'info',
      options: {
        file: path.join(__dirname, '..', 'logs', 'app.log'),
        size: '10m',
        interval: '1d',
        mkdir: true,
        limit: { count: 5 }
      },
    }
  ];
};

const logger = pino(
  {
    level: process.env.LOG_LEVEL || 'info',
    // Add base info for every log if needed
    base: isVercel ? { env: 'vercel' } : { env: 'local' },
  },
  pino.transport({ targets: getTargets() })
);

module.exports = logger;
