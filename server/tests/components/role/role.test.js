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
    const { body } = await server.get('/api/v1/role/')

    // console.log(body)
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

  test.skip('should remove role test data from DELETE /api/v1/role/:id', async () => {
    const dataTest = await prisma.roles.findFirst({ where: { code: dataRolTocreate1.code } })
    console.log('dataTest', dataTest)
    const { body } = await server.delete(`/api/v1/role/${dataTest.id}`)
    expect(body.statusCode).toBe(200)
    expect(body.data.message).toBe('Items deleted successfully')
  })
})
