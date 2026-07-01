import { appApiPath } from './paths';
import type { HttpClient } from '../http/client';

import type { ManagerPreferencesUpdateRequest } from '../types';


export class ManagerPreferencesApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Retrieve current user manager preferences */
  async retrieve(): Promise<Record<string, unknown>> {
    return this.client.get<Record<string, unknown>>(appApiPath(`/manager/preferences`));
  }

/** Update current user manager preferences */
  async update(body: ManagerPreferencesUpdateRequest): Promise<Record<string, unknown>> {
    return this.client.put<Record<string, unknown>>(appApiPath(`/manager/preferences`), body, undefined, undefined, 'application/json');
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
