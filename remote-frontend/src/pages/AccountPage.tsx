import { useEffect, useState } from "react";
import { isLoggedIn } from "../auth";
import {
  initOAuth,
  getProfile,
  logout,
  type OAuthProvider,
  type ProfileResponse,
} from "../api";
import { generateVerifier, generateChallenge, storeVerifier } from "../pkce";

export default function AccountPage() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [oauthLoading, setOauthLoading] = useState(false);

  useEffect(() => {
    if (isLoggedIn()) {
      setAuthenticated(true);
      loadData();
    } else {
      setLoading(false);
    }
  }, []);

  async function loadData() {
    try {
      const profileData = await getProfile();
      setProfile(profileData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }

  const handleOAuthLogin = async (provider: OAuthProvider) => {
    setOauthLoading(true);
    try {
      const verifier = generateVerifier();
      const challenge = await generateChallenge(verifier);
      storeVerifier(verifier);

      const appBase =
        import.meta.env.VITE_APP_BASE_URL || window.location.origin;
      const returnTo = `${appBase}/account/complete`;

      const result = await initOAuth(provider, returnTo, challenge);
      window.location.assign(result.authorize_url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "OAuth init failed");
      setOauthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setAuthenticated(false);
      setProfile(null);
    } catch {
      setAuthenticated(false);
    }
  };

  if (loading) {
    return <LoadingCard text="Loading..." />;
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md bg-white shadow rounded-lg p-6 space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sign In</h1>
            <p className="text-gray-600 mt-1">
              Sign in to manage your account
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="border-t border-gray-200 pt-4 space-y-3">
            <OAuthButton
              label="Continue with GitHub"
              onClick={() => handleOAuthLogin("github")}
              disabled={oauthLoading}
            />
            <OAuthButton
              label="Continue with Google"
              onClick={() => handleOAuthLogin("google")}
              disabled={oauthLoading}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile Card */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              {profile?.providers[0]?.avatar_url && (
                <img
                  src={profile.providers[0].avatar_url}
                  alt="Avatar"
                  className="w-16 h-16 rounded-full"
                />
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {profile?.providers[0]?.display_name ||
                    profile?.username ||
                    "User"}
                </h1>
                <p className="text-gray-600">{profile?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Sign out
            </button>
          </div>

          {profile && profile.providers.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Connected accounts:</p>
              <div className="flex flex-wrap gap-2">
                {profile.providers.map((p) => (
                  <span
                    key={p.provider}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                  >
                    {p.provider}
                    {p.username && ` (${p.username})`}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OAuthButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full py-3 px-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {label}
    </button>
  );
}

function LoadingCard({ text }: { text: string }) {
  return (
    <div className="min-h-screen grid place-items-center bg-gray-50">
      <div className="text-gray-600">{text}</div>
    </div>
  );
}
