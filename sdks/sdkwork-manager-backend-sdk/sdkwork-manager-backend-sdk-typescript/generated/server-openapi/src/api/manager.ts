import { backendApiPath } from './paths';
import type { HttpClient } from '../http/client';

import type { CommercialEntitlementDecisionItem, CommercialEntitlementDecisionRequest, CommercialEntitlementItem, PageInfo, UpdateCommercialEntitlementRequest } from '../types';


export class ManagerCommercialEntitlementsCurrentApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Retrieve the current tenant application commercial entitlement snapshot */
  async retrieve(): Promise<CommercialEntitlementItem> {
    return this.client.get<CommercialEntitlementItem>(backendApiPath(`/manager/commercial_entitlements/current`));
  }

/** Replace the current tenant application commercial entitlement snapshot */
  async update(body: UpdateCommercialEntitlementRequest): Promise<CommercialEntitlementItem> {
    return this.client.put<CommercialEntitlementItem>(backendApiPath(`/manager/commercial_entitlements/current`), body, undefined, undefined, 'application/json');
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
  async verify(body: CommercialEntitlementDecisionRequest): Promise<CommercialEntitlementDecisionItem> {
    return this.client.post<CommercialEntitlementDecisionItem>(backendApiPath(`/manager/commercial_entitlements/verify`), body, undefined, undefined, 'application/json');
  }
}

export class ManagerPreferencesAdminApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** List manager preferences for tenant administration */
  async list(): Promise<Record<string, unknown>> {
    return this.client.get<Record<string, unknown>>(backendApiPath(`/manager/preferences`));
  }
}

export class ManagerPreferencesApi {
  private client: HttpClient;
  public readonly admin: ManagerPreferencesAdminApi;

  constructor(client: HttpClient) {
    this.client = client;
    this.admin = new ManagerPreferencesAdminApi(client);
  }

}

export class ManagerApi {
  private client: HttpClient;
  public readonly preferences: ManagerPreferencesApi;
  public readonly commercialEntitlements: ManagerCommercialEntitlementsApi;

  constructor(client: HttpClient) {
    this.client = client;
    this.preferences = new ManagerPreferencesApi(client);
    this.commercialEntitlements = new ManagerCommercialEntitlementsApi(client);
  }

}

export function createManagerApi(client: HttpClient): ManagerApi {
  return new ManagerApi(client);
}

function appendQueryString(path: string, rawQueryString: string): string {
  const query = rawQueryString.replace(/^\?+/, '');
  if (!query) {
    return path;
  }
  return path.includes('?') ? `${path}&${query}` : `${path}?${query}`;
}
