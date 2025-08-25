import createClient from "openapi-fetch";
import type { paths } from "./notes/types";

export interface ApiClientConfig {
  baseUrl: string;
  headers?: Record<string, string>;
}

export class ApiClient {
  private client: ReturnType<typeof createClient<paths>>;
  private currentToken: string | null = null;

  private isTokenValid(token: string): boolean {
    if (!token || typeof token !== 'string') return false;
    
    // Basic JWT format validation (header.payload.signature)
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    try {
      // Decode payload to check expiration
      const payload = JSON.parse(atob(parts[1]));
      const now = Math.floor(Date.now() / 1000);
      
      // Check if token is expired (with 30 second buffer)
      return payload.exp && payload.exp > (now + 30);
    } catch {
      return false;
    }
  }

  constructor(config: ApiClientConfig) {
    this.client = createClient<paths>({
      baseUrl: config.baseUrl,
      headers: {
        ...config.headers,
      },
    });

    // Set up single middleware that reads current token state
    this.client.use({
      onRequest: ({ request }) => {
        // Only set Content-Type for requests with body (POST, PUT, PATCH)
        if (request.method !== "GET" && request.method !== "DELETE") {
          request.headers.set("Content-Type", "application/json");
        }
        
        if (this.currentToken && this.isTokenValid(this.currentToken)) {
          const authHeader = `Bearer ${this.currentToken}`;
          request.headers.set("Authorization", authHeader);
        } else {
          request.headers.delete("Authorization");
          // Clear invalid token
          if (this.currentToken && !this.isTokenValid(this.currentToken)) {
            this.currentToken = null;
          }
        }
      }
    });
  }

  get fetch() {
    return this.client;
  }

  setAuthToken(token: string) {
    this.currentToken = token;
  }

  removeAuthToken() {
    this.currentToken = null;
  }
}

export const createApiClient = (config: ApiClientConfig): ApiClient => {
  return new ApiClient(config);
};
