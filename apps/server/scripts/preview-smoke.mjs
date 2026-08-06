#!/usr/bin/env node
/* global process, console */
// ============================================================
// preview-smoke.mjs - Smoke tests contra AWS emulado (Floci)
// ============================================================
// Ejecuta CreateSecret + GetSecretValue contra Secrets Manager emulado
// Usa AWS_ENDPOINT_URL para apuntar a Floci
// Sale con código no-cero en caso de fallo
// ============================================================

import {
  SecretsManagerClient,
  CreateSecretCommand,
  GetSecretValueCommand,
  DeleteSecretCommand,
} from '@aws-sdk/client-secrets-manager';

// Configuración del cliente usando variables de entorno del stack emulado
const config = {
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.AWS_ENDPOINT_URL,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
  },
};

// Validar que tenemos endpoint configurado
if (!config.endpoint) {
  console.error('❌ ERROR: AWS_ENDPOINT_URL no está configurada');
  process.exit(1);
}

const client = new SecretsManagerClient(config);
const TEST_SECRET_NAME = `preview-smoke-test-${Date.now()}`;
const TEST_SECRET_VALUE = JSON.stringify({
  test: true,
  timestamp: Date.now(),
  message: 'Smoke test secret for preview validation',
});

async function runSmokeTest() {
  console.log('🚀 Iniciando smoke test contra AWS emulado (Floci)');
  console.log(`   Endpoint: ${config.endpoint}`);
  console.log(`   Región: ${config.region}`);
  console.log(`   Secret de prueba: ${TEST_SECRET_NAME}`);

  try {
    // PASO 1: CreateSecret
    console.log('\n📝 Paso 1: Creando secreto de prueba...');
    const createCommand = new CreateSecretCommand({
      Name: TEST_SECRET_NAME,
      SecretString: TEST_SECRET_VALUE,
      Description: 'Secret de prueba para smoke test de preview',
    });

    const createResponse = await client.send(createCommand);
    console.log(`   ✅ Secreto creado: ${createResponse.ARN}`);

    // PASO 2: GetSecretValue
    console.log('\n🔍 Paso 2: Leyendo secreto de prueba...');
    const getCommand = new GetSecretValueCommand({
      SecretId: TEST_SECRET_NAME,
    });

    const getResponse = await client.send(getCommand);
    const retrievedValue = getResponse.SecretString;

    console.log(`   ✅ Secreto recuperado`);

    // Verificar que el valor coincide
    if (retrievedValue !== TEST_SECRET_VALUE) {
      throw new Error(
        `Valor recuperado no coincide. Esperado: ${TEST_SECRET_VALUE}, Obtenido: ${retrievedValue}`
      );
    }
    console.log(`   ✅ Valor verificado correctamente`);

    // PASO 3: Cleanup - DeleteSecret (ForceDeleteWithoutRecovery para emulador)
    console.log('\n🧹 Paso 3: Limpiando secreto de prueba...');
    const deleteCommand = new DeleteSecretCommand({
      SecretId: TEST_SECRET_NAME,
      ForceDeleteWithoutRecovery: true,
    });

    await client.send(deleteCommand);
    console.log(`   ✅ Secreto eliminado`);

    console.log(
      '\n🎉 Smoke test PASSED - Secrets Manager emulado funciona correctamente'
    );
    return true;
  } catch (error) {
    console.error('\n❌ Smoke test FAILED:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    return false;
  }
}

// Ejecutar y salir con código apropiado
runSmokeTest()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ Error inesperado:', error);
    process.exit(1);
  });
