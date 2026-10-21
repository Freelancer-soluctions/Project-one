import { GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import type { GetSecretValueCommandOutput } from '@aws-sdk/client-secrets-manager';
import { secretsClient } from './secret-manager.client.js';

// AWS Secrets Manager devuelve un objeto JSON plano de clave → valor string
// (ver `.env.example` / docker-compose). Sin consumidores en `src/` hoy.
export async function loadSecrets(): Promise<Record<string, string>> {
  const command = new GetSecretValueCommand({
    SecretId: process.env.SECRET_NAME,
  });

  const response: GetSecretValueCommandOutput =
    await secretsClient.send(command);

  if (!response.SecretString) {
    throw new Error('Secret vacío o no encontrado');
  }

  return JSON.parse(response.SecretString);
}

// {
//     "ARN": "arn:aws:secretsmanager:us-east-1:000000000000:secret:projectone/backend/dev-FeJWea",
//     "Name": "projectone/backend/dev",
//     "VersionId": "2490f59e-fb96-4d42-90b5-d4c491a1471b"
// }
