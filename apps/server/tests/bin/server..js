import { describe, expect, vi, it } from 'vitest';
import app from '../../app'; // Importa tu aplicación
// import dotenv from '../../config/dotenv'

// Mockeamos app.listen para los que no son default
// vi.mock('../../app', () => ({
//   listen: vi.fn()
// }))

// Mockeamos app.listen con export default
vi.mock('./app', () => ({
  default: {
    // Necesitas devolver un objeto con "default" para exportaciones por defecto
    listen: vi.fn(),
  },
}));

describe.skip('Appplication should start with port ', () => {
  it.skip('Should start', { skip: true }, async (context) => {
    context.skip();
    // const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    // const PORT = 3000 // Definimos un valor para el puerto
    // const mockListen = app.listen

    // // Simulamos el código del servidor
    // const server = app.listen(PORT, () => {
    //   console.log(`listening on port ${PORT}`)
    // })

    // // Verificamos que app.listen haya sido llamado con el puerto correcto
    // expect(mockListen).toHaveBeenCalledWith(PORT, expect.any(Function))

    // // Ejecutamos el callback de listen para simular el comportamiento
    // const listenCallback = mockListen.mock.calls[0][1]
    // listenCallback()

    // // Verificamos que console.log haya sido llamado con el mensaje esperado
    // expect(consoleSpy).toHaveBeenCalledWith(`listening on port ${PORT}`)

    // // Limpiamos el mock de console.log
    // consoleSpy.mockRestore()

    // ---------------
    console.log(
      'puerto usado por configuracion de setupTest.js:',
      process.env.PORT
    );
    const appSpy = vi.spyOn(app, 'listen').mockImplementation(() => {});

    await import('../../bin/index'); // Archivo de arranca del servidor
    // Verificamos que el servidor haya sido llamado solo una vez
    expect(appSpy).toHaveBeenCalledTimes(1);

    // Verificamos que app.listen haya sido llamado con el puerto correcto
    expect(appSpy).toHaveBeenCalledWith(process.env.PORT, expect.any(Function));
  });
});
