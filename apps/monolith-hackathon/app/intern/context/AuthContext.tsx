// app/intern/context/AuthContext.tsx
'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { UserRole } from '../types/typefully';

interface AuthState {
  isAuthenticated: boolean;
  role: UserRole | null;
  editorPassword: string | null; // For API calls
}

interface AuthContextValue extends AuthState {
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'intern-auth-v2';
const REVIEWER_PASSWORD = process.env.NEXT_PUBLIC_INTERN_REVIEWER_PASSWORD || 'reviewer2026';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    role: null,
    editorPassword: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Check stored auth on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setState({
          isAuthenticated: true,
          role: parsed.role,
          editorPassword: parsed.editorPassword || null,
        });
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (password: string): Promise<boolean> => {
    // Check reviewer password (client-side)
    if (password === REVIEWER_PASSWORD) {
      const newState = {
        isAuthenticated: true,
        role: 'reviewer' as UserRole,
        editorPassword: null,
      };
      setState(newState);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ role: 'reviewer' }));
      return true;
    }

    // Check editor password (server-side validation)
    try {
      const res = await fetch('/api/typefully/drafts', {
        headers: { 'x-intern-auth': password },
      });

      if (res.ok) {
        const newState = {
          isAuthenticated: true,
          role: 'editor' as UserRole,
          editorPassword: password,
        };
        setState(newState);
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ role: 'editor', editorPassword: password })
        );
        return true;
      }
    } catch {
      // Fall through to return false
    }

    return false;
  }, []);

  const logout = useCallback(() => {
    setState({
      isAuthenticated: false,
      role: null,
      editorPassword: null,
    });
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
