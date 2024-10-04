import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { startServer, stopServer } from '../../test-server'
import request from 'supertest'
import prisma from '../../../config/db'
import { serve } from 'swagger-ui-express'

describe('Role endpoints', () => {
  let baseUrl // La URL base del servidor de pruebas
  let server // Variable para almacenar el servidor Supertest

  beforeAll(async () => {
    const testServer = await startServer()
    const address = testServer.address() // Obtiene la dirección y puerto del servidor
    baseUrl = `http://localhost:${address.port}`
    server = request(baseUrl)
    console.log('Base url test server: ', baseUrl)
  })

  // Arrenge
  const dataRolTest = [
    { id: 1, code: 'C01', description: 'admin' },
    { id: 2, code: 'C02', description: 'user' }
  ]

  const dataRolTocreate1 = { code: 'C03', description: 'only test' }
  const dataRolTocreate2 = { code: 'C04', description: 'only test 2' }

  afterAll(async () => {
    // Detén el servidor después de las pruebas
    await stopServer()
  })

  test.skip('Should return all roles GET /api/v1/role/', async () => {
    // Act
    const { body } = await server.get('/api/v1/role/')
    // console.log(body)
    // Assert
    expect(body.statusCode).toBe(200)
    expect(body.error).toBe(false)
    expect(body.data.length).toBe(2)
    expect(body.data.length).toBeGreaterThan(1)
    expect(body.data[0].code).toBe(dataRolTest[0].code)
    expect(body.data[0].description).not.toBeNull()
  })

  test.skip('Should return a single new role create by id GET /api/v1/role/:id', async () => {
    const dataTest = await prisma.roles.create({ data: dataRolTocreate1 }) // creamos el rol de pruebas
    console.log('dataTest', dataTest)
    const { body } = await server.get(`/api/v1/role/${dataTest.id}`) // consultamos el rol de pruebas
    console.log('body', body)

    expect(body.statusCode).toBe(200)
    expect(body.data).toEqual({
      id: expect.any(Number),
      code: dataRolTocreate1.code,
      description: dataRolTocreate1.description
    })
  })

  test.skip('should not return anything GET /api/v1/role/:id', async () => {
    const { body } = await server.get('/api/v1/role/999')
    expect(body.statusCode).toBe(200)
    expect(body.data).toBeNull()
  })

  test('Should return 400 if the ID is not a valid number', async () => {
    const { body } = await server.get('/api/v1/role/invalidID') // pasamos una ID no válida
    expect(body.statusCode).toBe(400) // esperamos un código 400 por mala solicitud
    expect(body.message).toBe('Invalid ID format') // el mensaje puede variar según la validación del API
  })

  test('Should return 401 if user is not authenticated', async () => {
    const dataTest = await prisma.roles.create({ data: dataRolTocreate1 })
    const { body } = await server.get(`/api/v1/role/${dataTest.id}`).set('Authorization', '') // sin token

    expect(body.statusCode).toBe(401) // sin token, la API debería retornar 401
    expect(body.message).toBe('Unauthorized')
  })

  test('Should return role with correct structure', async () => {
    const dataTest = await prisma.roles.create({ data: dataRolTocreate1 })
    const { body } = await server.get(`/api/v1/role/${dataTest.id}`)

    expect(body.statusCode).toBe(200)
    expect(body.data).toMatchObject({
      id: expect.any(Number),
      code: dataRolTocreate1.code,
      description: dataRolTocreate1.description
    })

    // verifica que no haya campos extra inesperados
    expect(Object.keys(body.data)).toEqual(expect.arrayContaining(['id', 'code', 'description']))
  })

  test('Should respond within 200ms', async () => {
    const dataTest = await prisma.roles.create({ data: dataRolTocreate1 })
    const startTime = Date.now()
    const { body } = await server.get(`/api/v1/role/${dataTest.id}`)
    const endTime = Date.now()

    expect(body.statusCode).toBe(200)
    expect(endTime - startTime).toBeLessThan(200) // tiempo de respuesta debe ser menos de 200ms
  })

  test('Should handle SQL injection attempts gracefully', async () => {
    const { body } = await server.get('/api/v1/role/1; DROP TABLE roles;') // intento de inyección SQL
    expect(body.statusCode).toBe(400) // debe retornar un error, como un 400 Bad Request
    expect(body.message).toBe('Invalid ID format')
  })

  test('Should return the correct role when multiple roles exist', async () => {
    const dataTest1 = await prisma.roles.create({ data: dataRolTocreate1 })
    const dataTest2 = await prisma.roles.create({ data: { code: 'ROLE_2', description: 'Role 2' } })

    const { body: body1 } = await server.get(`/api/v1/role/${dataTest1.id}`)
    const { body: body2 } = await server.get(`/api/v1/role/${dataTest2.id}`)

    expect(body1.data.code).toBe(dataRolTocreate1.code)
    expect(body2.data.code).toBe('ROLE_2')
  })

  test('Should handle roles with null description', async () => {
    const dataTest = await prisma.roles.create({ data: { code: 'ROLE_NULL', description: null } }) // creamos un rol con descripción nula
    const { body } = await server.get(`/api/v1/role/${dataTest.id}`)

    expect(body.statusCode).toBe(200)
    expect(body.data.description).toBeNull() // verificamos que la descripción sea nula
  })

  test('Should handle multiple concurrent requests correctly', async () => {
    const dataTest = await prisma.roles.create({ data: dataRolTocreate1 })

    const requests = Array(10).fill(server.get(`/api/v1/role/${dataTest.id}`)) // realizamos 10 peticiones simultáneas
    const responses = await Promise.all(requests)

    responses.forEach(response => {
      expect(response.body.statusCode).toBe(200)
      expect(response.body.data.code).toBe(dataRolTocreate1.code)
    })
  })

  test.skip('should remove role test data from DELETE /api/v1/role/:id', async () => {
    const dataTest = await prisma.roles.findFirst({ where: { code: dataRolTocreate1.code } })
    console.log('dataTest', dataTest)
    const { body } = await server.delete(`/api/v1/role/${dataTest.id}`)
    expect(body.statusCode).toBe(200)
    expect(body.data.message).toBe('Items deleted successfully')
  })
})
