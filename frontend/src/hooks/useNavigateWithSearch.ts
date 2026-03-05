import { useCallback } from 'react';
import {
  useNavigate,
  useRouter,
} from '@tanstack/react-router';

/**
 * Custom hook that wraps TanStack Router's navigate to automatically preserve
 * search parameters (like ?view=preview or ?view=diffs) during navigation.
 *
 * This ensures that fullscreen modes and other URL state are maintained when
 * navigating between routes, UNLESS the caller explicitly provides their own
 * search parameters.
 *
 * @example
 * // Current URL: /tasks?view=preview
 *
 * const navigate = useNavigateWithSearch();
 *
 * // Preserves current search params when navigating to new path
 * navigate('/projects/123/tasks');
 * // Result: /projects/123/tasks?view=preview
 *
 * // Caller's search params take precedence
 * navigate('/projects/123?tab=settings');
 * // Result: /projects/123?tab=settings
 *
 * // Preserves search params, adds hash
 * navigate('/projects/123#section');
 * // Result: /projects/123?view=preview#section
 *
 * // Caller's search and hash take precedence
 * navigate('/projects/123?tab=settings#section');
 * // Result: /projects/123?tab=settings#section
 *
 * // Change search params without changing pathname (stays on /tasks)
 * navigate({ search: '?view=diffs' });
 * // Result: /tasks?view=diffs
 *
 * // Object-style navigation with pathname
 * navigate({ pathname: '/projects/123', search: '?tab=settings' });
 * // Result: /projects/123?tab=settings
 *
 * // Numeric navigation (back/forward)
 * navigate(-1); // Goes back
 */
type NavigateLikeOptions = {
  replace?: boolean;
};

type NavigateLikeTo =
  | string
  | number
  | {
      pathname?: string;
      search?: string;
      hash?: string;
    };

function parseSearch(search: string): Record<string, string> {
  const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);
  const out: Record<string, string> = {};
  for (const [k, v] of params.entries()) {
    out[k] = v;
  }
  return out;
}

function parseToString(to: string): {
  pathname: string;
  search?: string;
  hash?: string;
} {
  const [pathAndSearch, rawHash] = to.split('#', 2);
  const [pathname, rawSearch] = pathAndSearch.split('?', 2);
  return {
    pathname: pathname || '/',
    search: rawSearch !== undefined ? `?${rawSearch}` : undefined,
    hash: rawHash !== undefined ? `#${rawHash}` : undefined,
  };
}

export function useNavigateWithSearch() {
  const navigate = useNavigate();
  const router = useRouter();

  return useCallback(
    (to: NavigateLikeTo, options?: NavigateLikeOptions) => {
      // Handle numeric navigation (back/forward)
      if (typeof to === 'number') {
        router.history.go(to);
        return;
      }

      // Handle object-style navigation
      if (typeof to === 'object') {
        const hash =
          to.hash !== undefined ? to.hash.replace(/^#/, '') : undefined;

        const hasSearch = to.search !== undefined;
        const search = hasSearch ? parseSearch(to.search || '') : undefined;

        navigate({
          to: (to.pathname || undefined) as never,
          search: hasSearch
            ? (search as never)
            : ((prev: unknown) => prev) as never,
          hash: hash as never,
          replace: options?.replace,
        } as never);
        return;
      }

      const parsed = parseToString(to);
      const hasSearch = parsed.search !== undefined;
      const search = hasSearch ? parseSearch(parsed.search || '') : undefined;
      const hash =
        parsed.hash !== undefined ? parsed.hash.replace(/^#/, '') : undefined;

      navigate({
        to: parsed.pathname as never,
        search: hasSearch
          ? (search as never)
          : ((prev: unknown) => prev) as never,
        hash: hash as never,
        replace: options?.replace,
      } as never);
    },
    [navigate, router.history]
  );
}
