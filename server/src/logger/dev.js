import { createLogger, format, transports } from 'winston'

const { combine, timestamp, label, printf } = format

const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} ${label} [${level}]: ${message}` // LOG FORMAT
})

const devLogger = () => {
  return createLogger({
    level: 'debug',
    format: combine(format.colorize(), label({ label: 'dev' }), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), myFormat),
    transports: [
      new transports.File({ filename: './logger/logs/dev.log', level: 'error' }),
      new transports.File({ filename: './logger/logs/combined.log' }),
      new transports.Console() // ONLY PRINTING LOGS IN TERMINAL
    ]
  })
}

export default devLogger

// const { createLogger, transports, format, log } = require("winston");

// const logger = createLogger({
//   format: format.combine(format.timestamp(), format.json()),
//   transports: [new transports.File({ filename: "file.log" })],
// });

// async function executeError(){
//   try {
//     throw new Error('Ops');
//   } catch (error) {s
//     logger.error({
//       message: error.message,
//       name: error.name,
//       stack: error.stack
//     });
//   }
// }

// executeError();
