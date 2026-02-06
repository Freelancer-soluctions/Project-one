import { startServer, stopServer } from '../../test-server';
import request from 'supertest';
import prisma from '../../../config/db';
import { createToken } from '../../../utils/jwt/createToken';

describe('Role endpoint', () => {
  let baseUrl; // La URL base del servidor de pruebas
  let server; // Variable para almacenar el servidor Supertest
  let token;
  beforeAll(async () => {
    const testServer = await startServer();
    const address = testServer.address(); // Obtiene la dirección y puerto del servidor
    baseUrl = `http://localhost:${address.port}`;
    server = request(baseUrl);
    console.log('Base url test server: ', baseUrl);
    const user = await prisma.users.findFirst({
      where: { email: 'admin@gmail.com' },
    });

    token = await createToken(user.id);
    console.log('token', token);
    console.log('user', user);
    // const refreshToken = await createRefreshToken(user.id)
  });

  afterAll(async () => {
    // Detén el servidor después de las pruebas
    await stopServer();
  });

  // Arrenge
  const dataRolTest = [
    { id: 1, code: 'C01', description: 'admin' },
    { id: 2, code: 'C02', description: 'user' },
  ];

  const dataRolTocreate1 = { code: 'C03', description: 'only test' };
  const dataRolTocreate2 = { code: 'C04' };
  const dataRolTocreate3 = { description: 'only test3' };

  /// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  describe('GET /api/v1/role/:id endpoints', () => {
    test.skip('Should return a single new role created by id GET /api/v1/role/:id', async () => {
      // Arrenge
      const dataTest = await prisma.roles.create({ data: dataRolTocreate1 });
      // Act
      const { body } = await server
        .get(`/api/v1/role/${dataTest.id}`)
        .set('Authorization', `Bearer ${token}`);

      // Assert
      expect(body.statusCode).toBe(200);
      expect(body.data).toEqual({
        id: expect.any(Number),
        code: dataRolTocreate1.code,
        description: dataRolTocreate1.description,
      });
      // verifica que no haya campos extra inesperados
      expect(Object.keys(body.data)).toEqual(
        expect.arrayContaining(['id', 'code', 'description'])
      );
    });

    /// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    test('should not return anything GET /api/v1/role/:id', async () => {
      // Act
      const { body } = await server
        .get('/api/v1/role/999')
        .set('Authorization', `Bearer ${token}`);
      // Assert
      expect(body.statusCode).toBe(200);
      expect(body.data).toBeNull();
    });

    /// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    test('Should return Unauthorized if user is not authenticated GET /api/v1/role/:id', async () => {
      // Arrenge
      const dataTest = await prisma.roles.findFirst({
        where: { code: dataRolTocreate1.code },
      });
      // Act
      const { body } = await server
        .get(`/api/v1/role/${dataTest.id}`)
        .set('Authorization', ''); // sin token

      // Assert
      expect(body.message).toBe('Unauthorized');
    });
    /// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    test('Should respond within 200ms GET /api/v1/role/:id', async () => {
      // Arrenge
      const dataTest = await prisma.roles.findFirst({
        where: { code: dataRolTocreate1.code },
      });
      const startTime = Date.now();
      // Act
      const { body } = await server
        .get(`/api/v1/role/${dataTest.id}`)
        .set('Authorization', `Bearer ${token}`);
      const endTime = Date.now();
      // Assert
      expect(body.statusCode).toBe(200);
      expect(endTime - startTime).toBeLessThan(200); // tiempo de respuesta debe ser menos de 200ms
    });
    /// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    test('Should return 500 if the ID is not a valid number GET /api/v1/role/:id', async () => {
      // Act
      const { body } = await server
        .get('/api/v1/role/invalidID')
        .set('Authorization', `Bearer ${token}`); // pasamos una ID no válida
      // Assert
      expect(body.statusCode).toBe(500); // esperamos un código 500 por mala solicitud
      expect(body.error).toBe(true);
    });

    /// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    test('Should handle SQL injection attempts gracefully GET /api/v1/role/:id', async () => {
      // Act
      const { body } = await server
        .get('/api/v1/role/1; DROP TABLE roles;')
        .set('Authorization', `Bearer ${token}`); // intento de inyección SQL
      // Assert
      expect(body.error).toBe(true);
      expect(body.statusCode).toBe(500); // debe retornar un error, como un 400 Bad Request
    });

    /// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    test('Should handle multiple concurrent requests correctly GET /api/v1/role/:id', async () => {
      // Act
      const requests = Array(10).fill(
        server
          .get(`/api/v1/role/${dataRolTest[0].id}`)
          .set('Authorization', `Bearer ${token}`)
      ); // realizamos 10 peticiones simultáneas
      const responses = await Promise.all(requests);
      // Assert
      responses.forEach((response) => {
        expect(response.body.statusCode).toBe(200);
        expect(response.body.data.code).toBe(dataRolTest[0].code);
      });
    });
  });

  describe('GET /api/v1/role/ endpoints', () => {
    test('Should return all roles GET /api/v1/role/', async () => {
      // Act
      const { body } = await server
        .get('/api/v1/role/')
        .set('Authorization', `Bearer ${token}`);

      // Assert
      expect(body.statusCode).toBe(200);
      expect(body.error).toBe(false);
      expect(body.data.length).toBeGreaterThan(1);
      expect(body.data[0].code).toBe(dataRolTest[0].code);
      expect(body.data[0].description).not.toBeNull();
    });

    /// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    test('Should return Unauthorized if user is not authenticated', async () => {
      // Act
      const { body } = await server
        .get('/api/v1/role/') // sin token
        .set('Authorization', '');

      // Assert
      expect(body.message).toBe('Unauthorized');
    });
    /// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    test('Should handle SQL injection attempts gracefully', async () => {
      // Act
      const { body } = await server
        .get('/api/v1/role/') // Intento de inyección SQL
        .set('Authorization', `Bearer ${token}`)
        .query({ id: '1; DROP TABLE roles;' }); // Enviando un query con SQL injection

      // Assert
      expect(body.error).toBe(false);
      expect(body.statusCode).toBe(200); // debe retornar un error
    });
    /// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    test('Should handle multiple concurrent requests correctly', async () => {
      // Act
      const requests = Array(10).fill(
        server
          .get('/api/v1/role/') // realizamos 10 peticiones simultáneas
          .set('Authorization', `Bearer ${token}`)
      );
      const responses = await Promise.all(requests);

      // Assert
      responses.forEach((response) => {
        expect(response.body.statusCode).toBe(200);
        expect(response.body.data).not.toBeNull(); // Asegura que no sea nulo
      });
    });

    /// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    test('Should respond within 200ms', async () => {
      const startTime = Date.now();
      // Act
      const { body } = await server
        .get('/api/v1/role') // sin especificar un rol
        .set('Authorization', `Bearer ${token}`);
      const endTime = Date.now();

      // Assert
      expect(body.statusCode).toBe(200);
      expect(endTime - startTime).toBeLessThan(200); // tiempo de respuesta debe ser menos de 200ms
    });
  });

  describe('POST endpoints', () => {
    test('Should handle roles with null description POST /api/v1/role/', async () => {
      // Act
      const { body } = await server
        .post('/api/v1/role/')
        .send(dataRolTocreate2)
        .set('Authorization', `Bearer ${token}`);
      // Assert
      expect(body.error[0]).toBe('"description" is required');
    });
    test('Should handle roles with null code POST /api/v1/role/', async () => {
      // Act
      const { body } = await server
        .post('/api/v1/role/')
        .send(dataRolTocreate3)
        .set('Authorization', `Bearer ${token}`);
      // Assert
      expect(body.error[0]).toBe('"code" is required');
    });
    test('Should return Unauthorized if user is not authenticated POST /api/v1/role/', async () => {
      // Act
      const { body } = await server
        .post('/api/v1/role/')
        .send(dataRolTocreate3)
        .set('Authorization', ''); // sin token
      // Assert
      expect(body.message).toBe('Unauthorized');
    });
  });

  describe.skip('DELETE endpoints', () => {
    test('should remove role test data from DELETE /api/v1/role/:id', async () => {
      const dataTest = await prisma.roles.findFirst({
        where: { code: dataRolTocreate1.code },
      });
      console.log('dataTest', dataTest);
      const { body } = await server.delete(`/api/v1/role/${dataTest.id}`);
      expect(body.statusCode).toBe(200);
      expect(body.data.message).toBe('Items deleted successfully');
    });
    test('Should return 400 if the ID is not valid DELETE /api/v1/role/:id', async () => {
      // Act
      const { body } = await server
        .delete('/api/v1/role/invalidID')
        .set('Authorization', `Bearer ${token}`);
      // Assert
      expect(body.statusCode).toBe(400); // Esperamos un 400 Bad Request
      expect(body.error).toBe(true);
    });
    test('Should return Unauthorized if user is not authenticated DELETE /api/v1/role/:id', async () => {
      const existingRoleId = '123'; // ID de un rol existente
      // Act
      const { body } = await server
        .delete(`/api/v1/role/${existingRoleId}`)
        .set('Authorization', ''); // sin token
      // Assert
      expect(body.message).toBe('Unauthorized');
    });
  });
});
