import {
  createClient as createGeneratedManagerBackendClient,
  SdkworkBackendClient,
} from '../generated/server-openapi/src/index';
import type { SdkworkBackendConfig } from '../generated/server-openapi/src/types/common';

export { SdkworkBackendClient, createGeneratedManagerBackendClient };
export type { SdkworkBackendConfig };
export * from '../generated/server-openapi/src/types';
export * from '../generated/server-openapi/src/api';
export * from '../generated/server-openapi/src/http';
export * from '../generated/server-openapi/src/auth';

export type SdkworkManagerBackendClient = SdkworkBackendClient;

export function createManagerBackendClient(config: SdkworkBackendConfig): SdkworkManagerBackendClient {
  return createGeneratedManagerBackendClient(config);
}

export function createClient(config: SdkworkBackendConfig): SdkworkManagerBackendClient {
  return createManagerBackendClient(config);
}
