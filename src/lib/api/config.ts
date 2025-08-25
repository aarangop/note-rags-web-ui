export const API_CONFIG = {
  notes: {
    baseUrl: process.env.NEXT_PUBLIC_NOTES_API_URL || 'http://localhost:8003',
  },
  genai: {
    baseUrl: process.env.NEXT_PUBLIC_GENAI_API_URL || 'http://localhost:8002',
  },
} as const;