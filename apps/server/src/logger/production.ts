import { createLogger, format, transports } from 'winston';
import type { Logger } from 'winston';

const { combine, timestamp, label, printf } = format;

const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} ${label} [${level}]: ${message}`;
});

const productionLogger = (): Logger => {
  return createLogger({
    level: 'warn',
    format: combine(
      label({ label: 'prod' }),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      myFormat
    ),
    transports: [
      new transports.File({
        filename: 'src/logger/logs/production.log',
        level: 'error',
      }),
      new transports.File({ filename: 'src/logger/logs/combined.log' }),
      new transports.Console(),
    ],
  });
};

export default productionLogger;
