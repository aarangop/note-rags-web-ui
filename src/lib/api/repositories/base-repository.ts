import type { ApiClient } from "../client";

export abstract class BaseRepository {
  protected client: ApiClient;

  constructor(client: ApiClient) {
    this.client = client;
  }

  protected async handleResponse<T>(
    response: Promise<{
      data?: T;
      error?: unknown;
      response: Response;
    }>
  ): Promise<T> {
    const result = await response;

    if (result.error) {
      const errorMessage = this.extractErrorMessage(result.error);
      throw new Error(errorMessage);
    }

    if (!result.data) {
      throw new Error("No data received from API");
    }

    return result.data;
  }

  setAuthToken(token: string) {
    this.client.setAuthToken(token);
  }
  removeAuthToken() {
    this.client.removeAuthToken();
  }

  private extractErrorMessage(error: unknown): string {
    // Handle validation errors (422)
    if (error && typeof error === "object" && "detail" in error) {
      const errorObj = error as { detail: unknown };
      if (Array.isArray(errorObj.detail)) {
        const messages = errorObj.detail
          .map((item: unknown) => {
            if (
              item &&
              typeof item === "object" &&
              "loc" in item &&
              "msg" in item
            ) {
              const validationItem = item as { loc?: string[]; msg: string };
              return `${validationItem.loc?.join(" -> ") || "Field"}: ${
                validationItem.msg
              }`;
            }
            return String(item);
          })
          .join(", ");
        return `Validation error: ${messages}`;
      }

      // Handle other API errors
      if (typeof errorObj.detail === "string") {
        return errorObj.detail;
      }
    }

    // Handle generic errors
    if (typeof error === "string") {
      return error;
    }

    return "An unexpected error occurred";
  }
}
