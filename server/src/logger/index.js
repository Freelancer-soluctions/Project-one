import devLogger from './dev.js'
import uatLogger from './uat.js'
import productionLogger from './production.js'
import dotenv from '../config/dotenv.js'

// if (process.env.NODE_ENV === 'production') {
//   logger = productionLogger()
// }

// if (process.env.NODE_ENV === 'uat') {
//   logger = uatLogger()
// }

// if (process.env.NODE_ENV === 'dev') {
//   logger = devLogger()
// }
/* const logger = {
  production: productionLogger,
  uat: uatLogger,
  dev: devLogger
}

export default logger[dotenv('NODE_ENV')]() */

const loggers = {
  production: productionLogger,
  uat: uatLogger,
  dev: devLogger
}

const environment = dotenv('NODE_ENV')

if (!loggers[environment]) {
  console.warn(`Warning: Environment "${environment}" not found. Defaulting to dev logger.`)
}

export default (loggers[environment] || devLogger)()
