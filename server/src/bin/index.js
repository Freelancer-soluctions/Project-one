import app from '../app.js'
import { swaggerDocs as V1SwaggerDocs } from '../docs/swagger.js'
import dotenv from '../config/dotenv.js'

const PORT = dotenv('PORT') || 3000
const server = app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`)
  V1SwaggerDocs(app, PORT)
})

// keep alive
server.keepAliveTimeout = (60 * 1000) + 1000
server.headersTimeout = (60 * 1000) + 2000
