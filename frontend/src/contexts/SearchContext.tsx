import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from 'react';
import { useRouterState } from '@tanstack/react-router';

interface SearchState {
  query: string;
  setQuery: (query: string) => void;
  active: boolean;
  clear: () => void;
  focusInput: () => void;
  registerInputRef: (ref: HTMLInputElement | null) => void;
}

const SearchContext = createContext<SearchState | null>(null);

interface SearchProviderProps {
  children: ReactNode;
}

export function SearchProvider({ children }: SearchProviderProps) {
  const [query, setQuery] = useState('');
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const projectId = useRouterState({
    select: (s) => {
      for (const match of s.matches as Array<{ params?: Record<string, unknown> }>) {
        const value = match.params?.projectId;
        if (typeof value === 'string' && value.length > 0) return value;
      }
      return undefined;
    },
  });
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Check if we're on a tasks route
  const isTasksRoute = /^\/local-projects\/[^/]+\/tasks/.test(pathname);

  // Clear search when leaving tasks pages
  useEffect(() => {
    if (!isTasksRoute && query !== '') {
      setQuery('');
    }
  }, [isTasksRoute, query]);

  // Clear search when project changes
  useEffect(() => {
    setQuery('');
  }, [projectId]);

  const clear = () => setQuery('');

  const focusInput = () => {
    if (inputRef.current && isTasksRoute) {
      inputRef.current.focus();
    }
  };

  const registerInputRef = useCallback((ref: HTMLInputElement | null) => {
    inputRef.current = ref;
  }, []);

  const value: SearchState = {
    query,
    setQuery,
    active: isTasksRoute,
    clear,
    focusInput,
    registerInputRef,
  };

  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  );
}

export function useSearch(): SearchState {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}
