import app from '../app.js'
import { swaggerDocs as V1SwaggerDocs } from '../docs/swagger.js'
import dotenv from '../config/dotenv.js'

const PORT = dotenv('PORT') || 3000
app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`)
  V1SwaggerDocs(app, PORT)
})
