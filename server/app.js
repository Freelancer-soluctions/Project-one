import express from 'express'
import { errorHandler } from './middleware/errorHandler.js'
import routes from './routes/index.js'

const app = express()

app.use(express.json())

// Routes
app.use('/api/v1', routes)

// Error hlandler
app.use(errorHandler)

export default app
