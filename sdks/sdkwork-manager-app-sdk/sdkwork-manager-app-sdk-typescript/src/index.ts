import {
  createClient as createGeneratedManagerAppClient,
  SdkworkAppClient,
} from '../generated/server-openapi/src/index';
import type { SdkworkAppConfig } from '../generated/server-openapi/src/types/common';

export { SdkworkAppClient, createGeneratedManagerAppClient };
export type { SdkworkAppConfig };
export * from '../generated/server-openapi/src/types';
export * from '../generated/server-openapi/src/api';
export * from '../generated/server-openapi/src/http';
export * from '../generated/server-openapi/src/auth';

export type SdkworkManagerAppClient = SdkworkAppClient;

export function createManagerAppClient(config: SdkworkAppConfig): SdkworkManagerAppClient {
  return createGeneratedManagerAppClient(config);
}

export function createClient(config: SdkworkAppConfig): SdkworkManagerAppClient {
  return createManagerAppClient(config);
}
