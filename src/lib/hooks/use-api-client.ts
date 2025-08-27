import { useRef } from "react";
import { ApiClient, createApiClient } from "../api/client";
import { API_CONFIG } from "../api/config";

interface UseApiClientReturn {
  notesClient: ApiClient;
}
export default function useApiClient(): UseApiClientReturn {
  const notesClientRef = useRef(
    createApiClient({
      baseUrl: API_CONFIG.notes.baseUrl,
    })
  );

  return {
    notesClient: notesClientRef.current,
  };
}
