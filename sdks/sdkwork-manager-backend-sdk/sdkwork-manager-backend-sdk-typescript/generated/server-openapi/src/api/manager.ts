import { backendApiPath } from './paths';
import type { ApiRequestOptions, HttpClient } from '../http/client';

import type { CommercialEntitlementDecisionItem, CommercialEntitlementDecisionRequest, CommercialEntitlementItem, PageInfo, UpdateCommercialEntitlementRequest } from '../types';


export class ManagerCommercialEntitlementsCurrentApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Retrieve the current tenant application commercial entitlement snapshot */
  async retrieve(requestOptions?: ApiRequestOptions): Promise<CommercialEntitlementItem> {
    return this.client.request<CommercialEntitlementItem>(backendApiPath(`/manager/commercial_entitlements/current`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'GET' as any, sdkworkUnwrapKind: 'item' });
  }

/** Replace the current tenant application commercial entitlement snapshot */
  async update(body: UpdateCommercialEntitlementRequest, requestOptions?: ApiRequestOptions): Promise<CommercialEntitlementItem> {
    return this.client.request<CommercialEntitlementItem>(backendApiPath(`/manager/commercial_entitlements/current`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'PUT' as any, body, contentType: 'application/json', sdkworkUnwrapKind: 'item' });
  }
}

export class ManagerCommercialEntitlementsApi {
  private client: HttpClient;
  public readonly current: ManagerCommercialEntitlementsCurrentApi;

  constructor(client: HttpClient) {
    this.client = client;
    this.current = new ManagerCommercialEntitlementsCurrentApi(client);
  }


/** Evaluate one tenant application commercial entitlement */
  async verify(body: CommercialEntitlementDecisionRequest, requestOptions?: ApiRequestOptions): Promise<CommercialEntitlementDecisionItem> {
    return this.client.request<CommercialEntitlementDecisionItem>(backendApiPath(`/manager/commercial_entitlements/verify`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'POST' as any, body, contentType: 'application/json', sdkworkUnwrapKind: 'command' });
  }
}

export class ManagerPreferencesAdminApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** List manager preferences for tenant administration */
  async list(requestOptions?: ApiRequestOptions): Promise<{ items: { userId: string; theme: string; pinnedCount: number; }[]; pageInfo: PageInfo; }> {
    return this.client.request<{ items: { userId: string; theme: string; pinnedCount: number; }[]; pageInfo: PageInfo; }>(backendApiPath(`/manager/preferences`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'GET' as any, sdkworkUnwrapKind: 'page' });
  }
}

export class ManagerPreferencesApi {
  public readonly admin: ManagerPreferencesAdminApi;

  constructor(client: HttpClient) {
    this.admin = new ManagerPreferencesAdminApi(client);
  }

}

export class ManagerApi {
  public readonly preferences: ManagerPreferencesApi;
  public readonly commercialEntitlements: ManagerCommercialEntitlementsApi;

  constructor(client: HttpClient) {
    this.preferences = new ManagerPreferencesApi(client);
    this.commercialEntitlements = new ManagerCommercialEntitlementsApi(client);
  }

}

export function createManagerApi(client: HttpClient): ManagerApi {
  return new ManagerApi(client);
}
