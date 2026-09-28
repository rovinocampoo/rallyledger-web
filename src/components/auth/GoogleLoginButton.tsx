import { useCallback, useEffect, useRef, useState } from "react";

import { loginWithGoogle, type AdminUser } from "../../api/auth";

type GoogleLoginButtonProps = {
  onLoggedIn: (admin: AdminUser) => void;
  onError: (message: string) => void;
};

const GOOGLE_SCRIPT_ID = "google-identity-services";
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

let initializedClientId: string | null = null;

let activeCredentialHandler:
  | ((response: GoogleCredentialResponse) => void)
  | null = null;

function GoogleLoginButton({ onLoggedIn, onError }: GoogleLoginButtonProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const onLoggedInRef = useRef(onLoggedIn);
  const onErrorRef = useRef(onError);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    onLoggedInRef.current = onLoggedIn;
  }, [onLoggedIn]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const handleCredentialResponse = useCallback(
    async (response: GoogleCredentialResponse) => {
      try {
        setLoading(true);
        onErrorRef.current("");

        const admin = await loginWithGoogle(response.credential);

        onLoggedInRef.current(admin);
      } catch (err) {
        console.error(err);

        onErrorRef.current(
          err instanceof Error ? err.message : "Unable to sign in with Google",
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const clientId = GOOGLE_CLIENT_ID;

    if (!clientId) {
      onErrorRef.current("Google login is not configured.");
      return;
    }

    let cancelled = false;

    function clearActiveHandler() {
      if (activeCredentialHandler === handleCredentialResponse) {
        activeCredentialHandler = null;
      }
    }

    function renderGoogleButton() {
      if (cancelled || !window.google || !containerRef.current) {
        return;
      }

      activeCredentialHandler = handleCredentialResponse;

      if (initializedClientId !== clientId) {
        console.log("Google OAuth config", {
          clientId,
          origin: window.location.origin,
          href: window.location.href,
        });

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            activeCredentialHandler?.(response);
          },
        });

        initializedClientId = clientId;
      }

      containerRef.current.replaceChildren();

      window.google.accounts.id.renderButton(containerRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        width: 304,
      });
    }

    if (window.google) {
      renderGoogleButton();

      return () => {
        cancelled = true;
        clearActiveHandler();
      };
    }

    let script = document.getElementById(
      GOOGLE_SCRIPT_ID,
    ) as HTMLScriptElement | null;

    function handleScriptError() {
      if (!cancelled) {
        onErrorRef.current("Unable to load Google login.");
      }
    }

    if (!script) {
      script = document.createElement("script");
      script.id = GOOGLE_SCRIPT_ID;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;

      document.head.appendChild(script);
    }

    script.addEventListener("load", renderGoogleButton);

    script.addEventListener("error", handleScriptError);

    return () => {
      cancelled = true;
      clearActiveHandler();

      script?.removeEventListener("load", renderGoogleButton);

      script?.removeEventListener("error", handleScriptError);
    };
  }, [handleCredentialResponse]);

  return (
    <div className={loading ? "pointer-events-none opacity-50" : ""}>
      <div ref={containerRef} className="flex min-h-10 justify-center" />

      {loading && (
        <p className="mt-2 text-center text-xs text-zinc-500">
          Signing in with Google...
        </p>
      )}
    </div>
  );
}

export default GoogleLoginButton;
