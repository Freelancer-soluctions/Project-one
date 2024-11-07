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
const logger = {
  production: productionLogger,
  uat: uatLogger,
  dev: devLogger
}

export default logger[dotenv('NODE_ENV')]()
