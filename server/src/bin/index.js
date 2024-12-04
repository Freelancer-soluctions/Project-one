import app from '../app.js'
import { swaggerDocs as V1SwaggerDocs } from '../docs/swagger.js'
import dotenv from '../config/dotenv.js'

const PORT = dotenv('PORT') || 3000
const server = app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`)
  V1SwaggerDocs(app, PORT)
})

// keep alive
// Establece el tiempo en milisegundos que el servidor mantendrá una conexión abierta sin actividad
server.keepAliveTimeout = (60 * 1000) + 1000 // 61 segundos
// Establece el tiempo máximo para recibir todos los encabezados antes de cerrar la conexión
server.headersTimeout = (60 * 1000) + 2000 // 62 segundos
