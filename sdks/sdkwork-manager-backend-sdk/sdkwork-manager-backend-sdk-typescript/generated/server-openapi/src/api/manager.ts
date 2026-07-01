import { backendApiPath } from './paths';
import type { HttpClient } from '../http/client';

import type { PageInfo } from '../types';


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

  constructor(client: HttpClient) {
    this.client = client;
    this.preferences = new ManagerPreferencesApi(client);
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
