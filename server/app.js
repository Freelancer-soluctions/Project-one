import cors from 'cors'
import express from 'express'
import errorHandler from './middleware/errorHandler.js'
import limiter from './middleware/rateLimit.js'
import corsOptions from './config/cors.js'
import routes from './routes/index.js'
import cookieParser from 'cookie-parser'

const app = express()

// middleware
app.use(
  express.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 })
)
app.use(express.json({ limit: '50mb' }))

app.use(cookieParser())

app.use(cors(corsOptions))

app.use('/api', limiter)

// Routes
app.use('/api/v1', routes)

// Error hlandler
app.use(errorHandler)

export default app
