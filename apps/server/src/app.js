import cors from 'cors'
import express from 'express'
import corsOptions from './config/cors.js'
import routes from './routes/v1/index.js'
import cookieParser from 'cookie-parser'
import { limiter, errorHandler } from './middleware/index.js'
import { csrfConditional } from './middleware/verifyCsrf.js'
import { helmetConfig } from './utils/helmet/helmet.config.js'

const app = express()

app.use(helmetConfig)

// middleware
app.use(
  express.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 })
)

// Body parser para que el navegador pueda enviar reportes CSP
app.use(express.json({ limit: '50mb', type: ['application/json', 'application/csp-report'] }))

app.use(cookieParser())

app.use(cors(corsOptions))

app.use('/api', limiter)

// Aplicar CSRF condicionalmente a todas las rutas
// Routes
app.use('/api/v1', csrfConditional, routes)

// Error hlandler
app.use(errorHandler)

export default app
