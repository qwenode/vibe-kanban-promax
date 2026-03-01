import type { ReviewResult } from "./types/review";
import {
  getAccessToken,
  getRefreshToken,
  storeTokens,
  clearTokens,
} from "./auth";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type ProviderProfile = {
  provider: string;
  username: string | null;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
};

export type ProfileResponse = {
  user_id: string;
  username: string | null;
  email: string;
  providers: ProviderProfile[];
};

export type OAuthProvider = "github" | "google";

export type HandoffInitResponse = {
  handoff_id: string;
  authorize_url: string;
};

export type HandoffRedeemResponse = {
  access_token: string;
  refresh_token: string;
};

export async function initOAuth(
  provider: OAuthProvider,
  returnTo: string,
  appChallenge: string,
): Promise<HandoffInitResponse> {
  const res = await fetch(`${API_BASE}/v1/oauth/web/init`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      provider,
      return_to: returnTo,
      app_challenge: appChallenge,
    }),
  });
  if (!res.ok) {
    throw new Error(`OAuth init failed (${res.status})`);
  }
  return res.json();
}

export async function redeemOAuth(
  handoffId: string,
  appCode: string,
  appVerifier: string,
): Promise<HandoffRedeemResponse> {
  const res = await fetch(`${API_BASE}/v1/oauth/web/redeem`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      handoff_id: handoffId,
      app_code: appCode,
      app_verifier: appVerifier,
    }),
  });
  if (!res.ok) {
    throw new Error(`OAuth redeem failed (${res.status})`);
  }
  return res.json();
}

export async function getReview(reviewId: string): Promise<ReviewResult> {
  const res = await fetch(`${API_BASE}/v1/review/${reviewId}`);
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error("Review not found");
    }
    throw new Error(`Failed to fetch review (${res.status})`);
  }
  return res.json();
}

export async function getFileContent(
  reviewId: string,
  fileHash: string,
): Promise<string> {
  const res = await fetch(`${API_BASE}/v1/review/${reviewId}/file/${fileHash}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch file (${res.status})`);
  }
  return res.text();
}

export async function getDiff(reviewId: string): Promise<string> {
  const res = await fetch(`${API_BASE}/v1/review/${reviewId}/diff`);
  if (!res.ok) {
    if (res.status === 404) {
      return "";
    }
    throw new Error(`Failed to fetch diff (${res.status})`);
  }
  return res.text();
}

export interface ReviewMetadata {
  gh_pr_url: string;
  pr_title: string;
}

export async function getReviewMetadata(
  reviewId: string,
): Promise<ReviewMetadata> {
  const res = await fetch(`${API_BASE}/v1/review/${reviewId}/metadata`);
  if (!res.ok) {
    throw new Error(`Failed to fetch review metadata (${res.status})`);
  }
  return res.json();
}

// Token refresh
export async function refreshTokens(
  refreshToken: string,
): Promise<{ access_token: string; refresh_token: string }> {
  const res = await fetch(`${API_BASE}/v1/tokens/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!res.ok) {
    throw new Error(`Token refresh failed (${res.status})`);
  }
  return res.json();
}

// Authenticated fetch wrapper with automatic token refresh
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

async function getValidAccessToken(): Promise<string> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error("Not authenticated");
  }
  return accessToken;
}

async function handleTokenRefresh(): Promise<string> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearTokens();
    throw new Error("No refresh token available");
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const tokens = await refreshTokens(refreshToken);
      storeTokens(tokens.access_token, tokens.refresh_token);
      return tokens.access_token;
    } catch {
      clearTokens();
      throw new Error("Session expired");
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function authenticatedFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const accessToken = await getValidAccessToken();

  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (res.status === 401) {
    // Try to refresh the token
    const newAccessToken = await handleTokenRefresh();
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${newAccessToken}`,
      },
    });
  }

  return res;
}

// Profile APIs
export async function getProfile(): Promise<ProfileResponse> {
  const res = await authenticatedFetch(`${API_BASE}/v1/profile`);
  if (!res.ok) {
    throw new Error(`Failed to fetch profile (${res.status})`);
  }
  return res.json();
}

export async function logout(): Promise<void> {
  try {
    await authenticatedFetch(`${API_BASE}/v1/oauth/logout`, {
      method: "POST",
    });
  } finally {
    clearTokens();
  }
}



