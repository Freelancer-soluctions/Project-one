import devLogger from './dev.js'
import uatLogger from './uat.js'
import productionLogger from './production.js'
import dotenv from '../config/dotenv.js'

let logger = null

// if (process.env.NODE_ENV === 'production') {
//   logger = productionLogger()
// }

// if (process.env.NODE_ENV === 'uat') {
//   logger = uatLogger()
// }

// if (process.env.NODE_ENV === 'dev') {
//   logger = devLogger()
// }

if (dotenv('NODE_ENV') === 'production') {
  logger = productionLogger()
}

if (dotenv('NODE_ENV') === 'uat') {
  logger = uatLogger()
}

if (dotenv('NODE_ENV') === 'dev') {
  logger = devLogger()
}

export default logger
