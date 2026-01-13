import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';

const config = {
  region: process.env.AWS_REGION,
};

// Solo existe en LocalStack
if (process.env.AWS_ENDPOINT_URL) {
  config.endpoint = process.env.AWS_ENDPOINT_URL;
}

export const secretsClient = new SecretsManagerClient(config);
