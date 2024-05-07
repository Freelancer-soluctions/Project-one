import app from '../app.js'
import { swaggerDocs as V1SwaggerDocs } from '../docs/swagger.js'

const PORT = 3000
app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`)
  V1SwaggerDocs(app, PORT)
})
