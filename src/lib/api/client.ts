import createClient from 'openapi-fetch';
import type { paths } from './notes/types';

export interface ApiClientConfig {
  baseUrl: string;
  headers?: Record<string, string>;
}

export class ApiClient {
  private client: ReturnType<typeof createClient<paths>>;

  constructor(config: ApiClientConfig) {
    this.client = createClient<paths>({
      baseUrl: config.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
    });
  }

  get fetch() {
    return this.client;
  }

  setAuthToken(token: string) {
    this.client.use({
      onRequest({ request }) {
        request.headers.set('Authorization', `Bearer ${token}`);
      },
    });
  }

  removeAuthToken() {
    this.client.use({
      onRequest({ request }) {
        request.headers.delete('Authorization');
      },
    });
  }
}

export const createApiClient = (config: ApiClientConfig): ApiClient => {
  return new ApiClient(config);
};