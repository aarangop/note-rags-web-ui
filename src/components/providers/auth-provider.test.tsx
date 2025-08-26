import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSession } from 'next-auth/react';
import AuthProvider, { useAuth } from './auth-provider';
import { RepositoryProvider } from './repository-provider';
import { createMockNotesRepository, createMockSession } from '@/test-utils';
import type { Session } from 'next-auth';

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}));

const mockUseSession = vi.mocked(useSession);

// Test component to access the auth context
function TestAuthComponent() {
  const { token, isAuthenticated, isLoading } = useAuth();
  
  return (
    <div>
      <span data-testid="token">{token || 'null'}</span>
      <span data-testid="is-authenticated">{isAuthenticated.toString()}</span>
      <span data-testid="is-loading">{isLoading.toString()}</span>
    </div>
  );
}

// Test component that should fail when used outside provider
function TestComponentOutsideProvider() {
  const { isAuthenticated } = useAuth();
  return <div>{isAuthenticated.toString()}</div>;
}

// Component that tests repository integration
function TestRepositoryIntegrationComponent() {
  const { isAuthenticated } = useAuth();
  return <div data-testid="integration-status">{isAuthenticated.toString()}</div>;
}

describe('AuthProvider', () => {
  let mockNotesRepository: ReturnType<typeof createMockNotesRepository>;

  beforeEach(() => {
    mockNotesRepository = createMockNotesRepository();
    vi.clearAllMocks();
  });

  describe('Authentication states', () => {
    it('should provide unauthenticated state when no session', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: vi.fn(),
      });

      const { getByTestId } = render(
        <RepositoryProvider repositories={{ notesRepository: mockNotesRepository }}>
          <AuthProvider>
            <TestAuthComponent />
          </AuthProvider>
        </RepositoryProvider>
      );

      expect(getByTestId('token')).toHaveTextContent('null');
      expect(getByTestId('is-authenticated')).toHaveTextContent('false');
      expect(getByTestId('is-loading')).toHaveTextContent('false');
    });

    it('should provide authenticated state when session exists', () => {
      const mockSession = createMockSession();
      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
        update: vi.fn(),
      });

      const { getByTestId } = render(
        <RepositoryProvider repositories={{ notesRepository: mockNotesRepository }}>
          <AuthProvider>
            <TestAuthComponent />
          </AuthProvider>
        </RepositoryProvider>
      );

      expect(getByTestId('token')).toHaveTextContent(mockSession.accessToken);
      expect(getByTestId('is-authenticated')).toHaveTextContent('true');
      expect(getByTestId('is-loading')).toHaveTextContent('false');
    });

    it('should provide loading state when session is loading', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
        update: vi.fn(),
      });

      const { getByTestId } = render(
        <RepositoryProvider repositories={{ notesRepository: mockNotesRepository }}>
          <AuthProvider>
            <TestAuthComponent />
          </AuthProvider>
        </RepositoryProvider>
      );

      expect(getByTestId('token')).toHaveTextContent('null');
      expect(getByTestId('is-authenticated')).toHaveTextContent('false');
      expect(getByTestId('is-loading')).toHaveTextContent('true');
    });
  });

  describe('Repository integration', () => {
    it('should set auth token in repository when session has token', async () => {
      const mockSession = createMockSession();
      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
        update: vi.fn(),
      });

      render(
        <RepositoryProvider repositories={{ notesRepository: mockNotesRepository }}>
          <AuthProvider>
            <TestRepositoryIntegrationComponent />
          </AuthProvider>
        </RepositoryProvider>
      );

      await waitFor(() => {
        expect(mockNotesRepository.setAuthToken).toHaveBeenCalledWith(mockSession.accessToken);
      });
    });

    it('should remove auth token from repository when session is null', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: vi.fn(),
      });

      render(
        <RepositoryProvider repositories={{ notesRepository: mockNotesRepository }}>
          <AuthProvider>
            <TestRepositoryIntegrationComponent />
          </AuthProvider>
        </RepositoryProvider>
      );

      await waitFor(() => {
        expect(mockNotesRepository.removeAuthToken).toHaveBeenCalled();
      });
    });

    it('should update repository token when session changes', async () => {
      const initialSession = createMockSession({ accessToken: 'initial-token' });
      const updatedSession = createMockSession({ accessToken: 'updated-token' });
      
      // Start with initial session
      mockUseSession.mockReturnValue({
        data: initialSession,
        status: 'authenticated',
        update: vi.fn(),
      });

      const { rerender } = render(
        <RepositoryProvider repositories={{ notesRepository: mockNotesRepository }}>
          <AuthProvider>
            <TestRepositoryIntegrationComponent />
          </AuthProvider>
        </RepositoryProvider>
      );

      await waitFor(() => {
        expect(mockNotesRepository.setAuthToken).toHaveBeenCalledWith('initial-token');
      });

      // Update to new session
      mockUseSession.mockReturnValue({
        data: updatedSession,
        status: 'authenticated',
        update: vi.fn(),
      });

      rerender(
        <RepositoryProvider repositories={{ notesRepository: mockNotesRepository }}>
          <AuthProvider>
            <TestRepositoryIntegrationComponent />
          </AuthProvider>
        </RepositoryProvider>
      );

      await waitFor(() => {
        expect(mockNotesRepository.setAuthToken).toHaveBeenCalledWith('updated-token');
      });
    });

    it('should remove token when session becomes null', async () => {
      const initialSession = createMockSession();
      
      // Start with authenticated session
      mockUseSession.mockReturnValue({
        data: initialSession,
        status: 'authenticated',
        update: vi.fn(),
      });

      const { rerender } = render(
        <RepositoryProvider repositories={{ notesRepository: mockNotesRepository }}>
          <AuthProvider>
            <TestRepositoryIntegrationComponent />
          </AuthProvider>
        </RepositoryProvider>
      );

      await waitFor(() => {
        expect(mockNotesRepository.setAuthToken).toHaveBeenCalledWith(initialSession.accessToken);
      });

      // Clear the session
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: vi.fn(),
      });

      rerender(
        <RepositoryProvider repositories={{ notesRepository: mockNotesRepository }}>
          <AuthProvider>
            <TestRepositoryIntegrationComponent />
          </AuthProvider>
        </RepositoryProvider>
      );

      await waitFor(() => {
        expect(mockNotesRepository.removeAuthToken).toHaveBeenCalled();
      });
    });
  });

  describe('Context behavior', () => {
    it('should provide the same auth context to multiple children', () => {
      const mockSession = createMockSession();
      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
        update: vi.fn(),
      });

      let firstAuthContext: ReturnType<typeof useAuth>;
      let secondAuthContext: ReturnType<typeof useAuth>;

      function FirstChild() {
        firstAuthContext = useAuth();
        return <div data-testid="first-child">First</div>;
      }

      function SecondChild() {
        secondAuthContext = useAuth();
        return <div data-testid="second-child">Second</div>;
      }

      render(
        <RepositoryProvider repositories={{ notesRepository: mockNotesRepository }}>
          <AuthProvider>
            <FirstChild />
            <SecondChild />
          </AuthProvider>
        </RepositoryProvider>
      );

      expect(firstAuthContext!.token).toBe(secondAuthContext!.token);
      expect(firstAuthContext!.isAuthenticated).toBe(secondAuthContext!.isAuthenticated);
      expect(firstAuthContext!.isLoading).toBe(secondAuthContext!.isLoading);
    });
  });

  describe('Error handling', () => {
    it('should throw error when useAuth is used outside AuthProvider', () => {
      // Suppress console.error for this test since we expect an error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponentOutsideProvider />);
      }).toThrow('useAuth hook must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('Session edge cases', () => {
    it('should handle session without accessToken', async () => {
      const sessionWithoutToken = {
        user: { id: 'test', email: 'test@example.com' },
        expires: '2024-12-31',
      } as Session;

      mockUseSession.mockReturnValue({
        data: sessionWithoutToken,
        status: 'authenticated',
        update: vi.fn(),
      });

      const { getByTestId } = render(
        <RepositoryProvider repositories={{ notesRepository: mockNotesRepository }}>
          <AuthProvider>
            <TestAuthComponent />
          </AuthProvider>
        </RepositoryProvider>
      );

      expect(getByTestId('token')).toHaveTextContent('null');
      expect(getByTestId('is-authenticated')).toHaveTextContent('false');

      await waitFor(() => {
        expect(mockNotesRepository.removeAuthToken).toHaveBeenCalled();
      });
    });

    it('should handle session with empty string token', async () => {
      const sessionWithEmptyToken = createMockSession({ accessToken: '' });
      
      mockUseSession.mockReturnValue({
        data: sessionWithEmptyToken,
        status: 'authenticated',
        update: vi.fn(),
      });

      const { getByTestId } = render(
        <RepositoryProvider repositories={{ notesRepository: mockNotesRepository }}>
          <AuthProvider>
            <TestAuthComponent />
          </AuthProvider>
        </RepositoryProvider>
      );

      expect(getByTestId('token')).toHaveTextContent('null');
      expect(getByTestId('is-authenticated')).toHaveTextContent('false');

      await waitFor(() => {
        expect(mockNotesRepository.removeAuthToken).toHaveBeenCalled();
      });
    });
  });

  describe('Provider composition', () => {
    it('should work when nested within other providers', () => {
      const mockSession = createMockSession();
      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
        update: vi.fn(),
      });

      function OuterProvider({ children }: { children: React.ReactNode }) {
        return <div data-testid="outer-provider">{children}</div>;
      }

      const { getByTestId } = render(
        <OuterProvider>
          <RepositoryProvider repositories={{ notesRepository: mockNotesRepository }}>
            <AuthProvider>
              <TestAuthComponent />
            </AuthProvider>
          </RepositoryProvider>
        </OuterProvider>
      );

      expect(getByTestId('outer-provider')).toBeInTheDocument();
      expect(getByTestId('is-authenticated')).toHaveTextContent('true');
    });

    it('should require RepositoryProvider to be available', () => {
      const mockSession = createMockSession();
      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
        update: vi.fn(),
      });

      // Suppress console.error for this test since we expect an error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(
          <AuthProvider>
            <TestAuthComponent />
          </AuthProvider>
        );
      }).toThrow('useRepository must be used within a RepositoryProvider');

      consoleSpy.mockRestore();
    });
  });
});