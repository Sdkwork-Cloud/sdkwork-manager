import { appApiPath } from './paths';
import type { ApiRequestOptions, HttpClient } from '../http/client';

import type { ManagerPreferencesUpdateRequest } from '../types';


export class ManagerPreferencesApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Retrieve current user manager preferences */
  async retrieve(requestOptions?: ApiRequestOptions): Promise<{ pinnedAppKeys: string[]; theme: string; }> {
    return this.client.request<{ pinnedAppKeys: string[]; theme: string; }>(appApiPath(`/manager/preferences`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'GET' as any, sdkworkUnwrapKind: 'item' });
  }

/** Update current user manager preferences */
  async update(body: ManagerPreferencesUpdateRequest, requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(appApiPath(`/manager/preferences`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'PUT' as any, body, contentType: 'application/json', sdkworkUnwrapKind: 'item' });
  }
}

export class ManagerApi {
  public readonly preferences: ManagerPreferencesApi;

  constructor(client: HttpClient) {
    this.preferences = new ManagerPreferencesApi(client);
  }

}

export function createManagerApi(client: HttpClient): ManagerApi {
  return new ManagerApi(client);
}
