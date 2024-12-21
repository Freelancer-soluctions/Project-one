import app from '../app'

let testServer
export const startServer = () => {
  return new Promise((resolve, reject) => {
    testServer = app.listen(process.env.PORT, () => {
      console.log(`Test server listening on port: ${process.env.PORT}`)
      resolve(testServer) // Devuelve el servidor para ser utilizado por Supertest
    })
    testServer.on('error', reject)
  })
}

export const stopServer = () => {
  return new Promise((resolve, reject) => {
    if (testServer) {
      testServer.close((err) => {
        if (err) return reject(err)
        console.log('Server stopped')
        resolve()
      })
    } else {
      resolve()
    }
  })
}
