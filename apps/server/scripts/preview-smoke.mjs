#!/usr/bin/env node
/* global process, console, fetch */
// ============================================================
// preview-smoke.mjs - Smoke tests contra AWS emulado (Floci)
// ============================================================
// Ejecuta CreateSecret + GetSecretValue contra Secrets Manager emulado
// Y verifica que el path de secretsClient de la app funciona (GET /_smoke/secrets)
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

// URL base del servidor (por defecto localhost:3000 en CI)
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:3000';

async function runSmokeTest() {
  console.log('🚀 Iniciando smoke test contra AWS emulado (Floci)');
  console.log(`   Endpoint: ${config.endpoint}`);
  console.log(`   Región: ${config.region}`);
  console.log(`   Secret de prueba: ${TEST_SECRET_NAME}`);
  console.log(`   Server URL: ${SERVER_BASE_URL}`);

  try {
    // PASO 1: CreateSecret directamente contra Floci
    console.log('\n📝 Paso 1: Creando secreto de prueba en Floci...');
    const createCommand = new CreateSecretCommand({
      Name: TEST_SECRET_NAME,
      SecretString: TEST_SECRET_VALUE,
      Description: 'Secret de prueba para smoke test de preview',
    });

    const createResponse = await client.send(createCommand);
    console.log(`   ✅ Secreto creado: ${createResponse.ARN}`);

    // PASO 2: GetSecretValue directamente contra Floci
    console.log('\n🔍 Paso 2: Leyendo secreto de prueba desde Floci...');
    const getCommand = new GetSecretValueCommand({
      SecretId: TEST_SECRET_NAME,
    });

    const getResponse = await client.send(getCommand);
    const retrievedValue = getResponse.SecretString;

    console.log(`   ✅ Secreto recuperado desde Floci`);

    // Verificar que el valor coincide
    if (retrievedValue !== TEST_SECRET_VALUE) {
      throw new Error(
        `Valor recuperado no coincide. Esperado: ${TEST_SECRET_VALUE}, Obtenido: ${retrievedValue}`
      );
    }
    console.log(`   ✅ Valor verificado correctamente en Floci`);

    // PASO 3: Verificar el path de la app (secretsClient) via endpoint /_smoke/secrets
    console.log(
      '\n🔗 Paso 3: Verificando path de secretsClient de la app (/health -> /_smoke/secrets)...'
    );
    const smokeResponse = await fetch(
      `${SERVER_BASE_URL}/_smoke/secrets?name=${encodeURIComponent(TEST_SECRET_NAME)}`
    );
    const smokeData = await smokeResponse.json();

    if (!smokeResponse.ok || !smokeData.success) {
      throw new Error(
        `App secretsClient path falló: ${smokeData.error || 'Respuesta no exitosa'}`
      );
    }

    if (smokeData.value !== TEST_SECRET_VALUE) {
      throw new Error(
        `Valor desde app no coincide. Esperado: ${TEST_SECRET_VALUE}, Obtenido: ${smokeData.value}`
      );
    }
    console.log(
      `   ✅ Path de secretsClient de la app verificado correctamente`
    );

    // PASO 4: Cleanup - DeleteSecret (ForceDeleteWithoutRecovery para emulador)
    console.log('\n🧹 Paso 4: Limpiando secreto de prueba...');
    const deleteCommand = new DeleteSecretCommand({
      SecretId: TEST_SECRET_NAME,
      ForceDeleteWithoutRecovery: true,
    });

    await client.send(deleteCommand);
    console.log(`   ✅ Secreto eliminado`);

    console.log(
      '\n🎉 Smoke test PASSED - Secrets Manager emulado Y path de la app funcionan correctamente'
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
