import { useState, type SubmitEvent } from "react";
import { useNavigate } from "react-router-dom";
import { login, type AdminUser } from "../api/auth";
import GoogleLoginButton from "../components/auth/GoogleLoginButton";

type LoginPageProps = {
  onLoggedIn: (admin: AdminUser) => void;
};

function LoginPage({ onLoggedIn }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setLoading(true);
      setError(null);

      const admin = await login({
        email,
        password,
      });

      onLoggedIn(admin);
    } catch (err) {
      console.error(err);

      setError(err instanceof Error ? err.message : "Unable to login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-zinc-50 px-4 text-zinc-900 dark:bg-zinc-950 dark:text-white">
      <button
        type="button"
        onClick={() => navigate("/")}
        className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-600 transition hover:bg-zinc-200 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
      >
        <span aria-hidden="true">←</span>
        Back
      </button>
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-6 flex justify-center">
            <img
              src="/branding/login-light.png"
              alt="RallyLedger"
              className="h-50 w-auto object-contain dark:hidden sm:h-70"
            />

            <img
              src="/branding/login-dark.png"
              alt="RallyLedger"
              className="hidden h-50 w-auto object-contain dark:block sm:h-70"
            />
          </div>

          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Sign in to manage your tennis club.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6"
        >
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400"
            >
              Email
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-zinc-900 dark:text-white outline-none focus:border-zinc-500"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-zinc-900 dark:text-white outline-none focus:border-zinc-500"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-red-900/50 bg-red-950/20 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="primary-action w-full rounded-lg px-4 py-2.5 font-medium disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
          <div className="flex items-center gap-3 py-1">
            <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />

            <span className="text-xs uppercase text-zinc-500">Or</span>

            <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
          </div>

          <GoogleLoginButton
            onLoggedIn={onLoggedIn}
            onError={(message) => {
              setError(message || null);
            }}
          />
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
