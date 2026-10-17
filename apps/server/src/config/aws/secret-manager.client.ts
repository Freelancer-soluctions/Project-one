import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import type { SecretsManagerClientConfig } from '@aws-sdk/client-secrets-manager';

const config: SecretsManagerClientConfig = {
  region: process.env.AWS_REGION,
};

// Solo existe en LocalStack
if (process.env.AWS_ENDPOINT_URL) {
  config.endpoint = process.env.AWS_ENDPOINT_URL;
}

export const secretsClient = new SecretsManagerClient(config);
