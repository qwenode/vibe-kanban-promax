import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { isLoggedIn } from "../auth";
import {
  initOAuth,
  type OAuthProvider,
} from "../api";
import { generateVerifier, generateChallenge, storeVerifier } from "../pkce";

const UPGRADE_RETURN_KEY = "upgrade_return";

type Step = "plan-selection" | "sign-in";

export default function UpgradePage() {
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState<Step>("plan-selection");
  const [error, setError] = useState<string | null>(null);
  const [oauthLoading, setOauthLoading] = useState(false);

  useEffect(() => {
    // Check if returning from OAuth
    const returning = sessionStorage.getItem(UPGRADE_RETURN_KEY);
    if (returning && isLoggedIn()) {
      sessionStorage.removeItem(UPGRADE_RETURN_KEY);
    }
  }, [searchParams]);

  const handleSubscribe = async () => {
    if (isLoggedIn()) {
      // Already signed in - nothing more to do for now
      return;
    } else {
      setStep("sign-in");
    }
  };

  const handleOAuthLogin = async (provider: OAuthProvider) => {
    setOauthLoading(true);
    setError(null);
    try {
      const verifier = generateVerifier();
      const challenge = await generateChallenge(verifier);
      storeVerifier(verifier);

      // Mark that we're in the upgrade flow
      sessionStorage.setItem(UPGRADE_RETURN_KEY, "true");

      const appBase =
        import.meta.env.VITE_APP_BASE_URL || window.location.origin;
      const returnTo = `${appBase}/upgrade/complete`;

      const result = await initOAuth(provider, returnTo, challenge);
      window.location.assign(result.authorize_url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "OAuth init failed");
      setOauthLoading(false);
    }
  };

  const handleContactUs = () => {
    window.location.href =
      "mailto:sales@example.com?subject=Enterprise%20Plan%20Inquiry";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 pt-8">
          <img
            src="/vibe-kanban-logo.svg"
            alt="Vibe Kanban"
            className="h-10 mx-auto mb-6"
          />
          <h1 className="text-3xl font-bold text-gray-900">Choose Your Plan</h1>
          <p className="text-gray-600 mt-2">
            Select the plan that best fits your team's needs
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-xs text-red-500 hover:text-red-700 mt-1"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Step: Plan Selection */}
        {step === "plan-selection" && (
          <div className="grid md:grid-cols-3 gap-6">
            {/* Basic Plan */}
            <PlanCard
              name="Basic"
              price="Free"
              description="For individual users"
              features={[
                "1 user included",
                "Core features",
                "Community support",
              ]}
            />

            {/* Pro Plan */}
            <PlanCard
              name="Pro"
              price="$30"
              priceUnit="/user/month"
              description="For teams of 2-49"
              features={[
                "2-49 users",
                "All Basic features",
                "99.5% SLA",
                "Discord support",
              ]}
              popular
              cta="Subscribe"
              onCta={handleSubscribe}
            />

            {/* Enterprise Plan */}
            <PlanCard
              name="Enterprise"
              price="Custom"
              description="For large teams"
              features={[
                "50+ users",
                "All Pro features",
                "SSO / SAML",
                "99.9% SLA",
                "Dedicated Slack channel",
              ]}
              cta="Contact Us"
              onCta={handleContactUs}
            />
          </div>
        )}

        {/* Step: Sign In */}
        {step === "sign-in" && (
          <div className="max-w-md mx-auto">
            <div className="bg-white shadow rounded-lg p-6 space-y-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Sign In</h2>
                <p className="text-gray-600 mt-1">
                  Sign in to continue with your subscription
                </p>
              </div>

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

              <button
                onClick={() => setStep("plan-selection")}
                className="w-full text-sm text-gray-600 hover:text-gray-900 pt-2"
              >
                Back to plans
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PlanCard({
  name,
  price,
  priceUnit,
  description,
  features,
  popular,
  cta,
  onCta,
}: {
  name: string;
  price: string;
  priceUnit?: string;
  description: string;
  features: string[];
  popular?: boolean;
  cta?: string;
  onCta?: () => void;
}) {
  return (
    <div
      className={`bg-white shadow rounded-lg p-6 relative ${
        popular ? "ring-2 ring-gray-900" : ""
      }`}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-gray-900 text-white text-xs font-medium px-3 py-1 rounded-full">
            Most Popular
          </span>
        </div>
      )}

      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
        <div className="mt-2">
          <span className="text-3xl font-bold text-gray-900">{price}</span>
          {priceUnit && (
            <span className="text-gray-500 text-sm">{priceUnit}</span>
          )}
        </div>
        <p className="text-gray-600 text-sm mt-1">{description}</p>
      </div>

      <ul className="space-y-2 mb-6">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center text-sm text-gray-600">
            <svg
              className="w-4 h-4 text-green-500 mr-2 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            {feature}
          </li>
        ))}
      </ul>

      {cta && onCta ? (
        <button
          onClick={onCta}
          className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
            popular
              ? "bg-gray-900 text-white hover:bg-gray-800"
              : "bg-gray-100 text-gray-900 hover:bg-gray-200"
          }`}
        >
          {cta}
        </button>
      ) : (
        <div className="w-full py-2 px-4 text-center text-sm text-gray-500">
          Current plan
        </div>
      )}
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
