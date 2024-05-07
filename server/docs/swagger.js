import swaggerJSDoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'

// Basic Meta Informations about our API
const options = {
  definition: {
    openapi: '3.1.0',
    info: { title: 'Crossfit WOD API', version: '1.0.0' }
  },
  apis: ['./components/**/routes.js', './docs/schemas.js']
  // ['./api/**/routes.js', './api/**/schema.js']

}

// Docs in JSON format
const swaggerSpec = swaggerJSDoc(options)

// Function to setup our docs
export const swaggerDocs = (app, port) => {
  // Route-Handler to visit our docs
  app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
  // Make our docs in JSON format available
  app.get('/api/v1/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json')
    res.send(swaggerSpec)
  })
  console.log(
      `Version 1 Docs are available on http://localhost:${port}/api/v1/docs`
  )
}
