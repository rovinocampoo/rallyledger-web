import { useState, type SubmitEvent } from "react";
import { useNavigate } from "react-router-dom";

import { login, type AdminUser } from "../api/auth";
import GoogleLoginButton from "../components/auth/GoogleLoginButton";

type LoginPageProps = {
  onLoggedIn: (admin: AdminUser) => void;
};

function LoginPage({ onLoggedIn }: LoginPageProps) {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <main className="relative min-h-screen overflow-hidden bg-[#f1eee5] text-[#103f25] dark:bg-zinc-950 dark:text-white">
      {/* Background accents */}
      <div
        aria-hidden="true"
        className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-[#dfff28]/25 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-[#dfff28]/15 blur-3xl"
      />

      {/* Back */}
      <button
        type="button"
        onClick={() => navigate("/")}
        className="absolute left-5 top-5 z-20 inline-flex items-center gap-2 rounded-xl border-2 border-transparent px-3 py-2 text-sm font-bold text-[#103f25]/75 transition hover:-translate-x-0.5 hover:bg-[#fffdf5] hover:text-[#103f25] hover:shadow-[4px_4px_0_#dfff28] dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white"
      >
        <span aria-hidden="true">←</span>
        Back
      </button>

      <div className="relative mx-auto flex min-h-screen w-[min(1100px,calc(100%-32px))] items-center justify-center py-20">
        <div className="grid w-full overflow-hidden rounded-[30px] border-[3px] border-[#103f25] bg-[#fffdf5] shadow-[14px_14px_0_#103f25] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-[14px_14px_0_#dfff28] lg:grid-cols-[0.95fr_1.05fr]">
          {/* Brand / visual side */}
          <section className="relative hidden overflow-hidden bg-[#103f25] p-10 text-[#f1eee5] lg:flex lg:min-h-[620px] lg:flex-col lg:justify-between">
            <div
              aria-hidden="true"
              className="absolute right-[-70px] top-[-70px] h-64 w-64 rounded-full border-[30px] border-[#dfff28]/20"
            />

            <div
              aria-hidden="true"
              className="absolute bottom-[-100px] left-[-80px] h-72 w-72 rounded-full border-[30px] border-[#dfff28]/10"
            />

            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#f1eee5]/25 bg-white/[0.04] px-3 py-2 text-xs font-black uppercase tracking-[0.14em]">
                <span className="h-2 w-2 rounded-full bg-[#dfff28]" />
                Club administration
              </div>

              <h1 className="mt-8 max-w-md text-[clamp(48px,5vw,72px)] font-black leading-[0.9] tracking-[-0.07em]">
                Your club.
                <br />
                <span className="inline-block rotate-[-1deg] bg-[#dfff28] px-2 text-[#103f25]">
                  One ledger.
                </span>
              </h1>

              <p className="mt-6 max-w-md text-base leading-[1.6] text-[#f1eee5]/70">
                Manage participants, sessions, matches, charges, products,
                payments, and club records in one place.
              </p>
            </div>

            {/* Simple interactive tennis visual */}
            <div className="relative flex flex-1 items-center justify-center py-10">
              <div className="relative h-64 w-64 rotate-[3deg] rounded-[42%_58%_50%_50%/48%_45%_55%_52%] border-[3px] border-[#f1eee5] bg-[#fffdf5] shadow-[12px_12px_0_#dfff28] transition duration-300 hover:rotate-[-2deg] hover:scale-[1.02]">
                <div className="absolute inset-5 rounded-[inherit] border-2 border-dashed border-[#103f25]/25" />

                <div className="absolute left-[16%] right-[16%] top-[24%] h-[42%] border-[4px] border-[#103f25] bg-[#dfff28]">
                  <div className="absolute left-1/4 top-[12%] bottom-[12%] w-1 bg-[#103f25]" />
                  <div className="absolute right-1/4 top-[12%] bottom-[12%] w-1 bg-[#103f25]" />
                  <div className="absolute inset-x-0 top-1/2 h-1 bg-[#103f25]" />

                  <div className="absolute -left-2 -right-2 top-1/2 h-5 border-y-2 border-[#103f25] bg-[repeating-linear-gradient(90deg,#103f25_0_3px,transparent_3px_10px)]" />
                </div>

                <div className="absolute right-[12%] top-[12%] h-12 w-12 rounded-full border-4 border-[#103f25] bg-[#dfff28] transition-transform duration-300 group-hover:rotate-12" />

                <div className="absolute bottom-[11%] left-[13%] rounded-lg border-2 border-[#103f25] bg-[#f1eee5] px-3 py-2 text-sm font-black text-[#103f25]">
                  40 — 15
                </div>

                <div className="absolute bottom-[8%] right-[8%] text-3xl font-black text-[#103f25]">
                  ↗
                </div>
              </div>
            </div>

            <div className="relative flex items-center gap-2 text-xs font-medium text-[#f1eee5]/55">
              <span className="text-base text-[#dfff28]" aria-hidden="true">
                ✓
              </span>
              Secure administrator access
            </div>
          </section>

          {/* Login side */}
          <section className="p-6 sm:p-9 lg:p-12">
            <div className="mx-auto max-w-md">
              <div className="mb-8 lg:hidden">
                <img
                  src="/branding/login-light-horizontal.png"
                  alt="RallyLedger"
                  className="h-10 w-auto dark:hidden"
                />

                <img
                  src="/branding/login-dark-horizontal.png"
                  alt="RallyLedger"
                  className="hidden h-10 w-auto dark:block"
                />
              </div>

              <div className="mb-8">
                <div className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-[#103f25]/55 dark:text-zinc-500">
                  Welcome back
                </div>

                <h2 className="text-4xl font-black tracking-[-0.06em] sm:text-5xl">
                  Sign in.
                </h2>

                <p className="mt-3 text-sm leading-6 text-[#103f25]/65 dark:text-zinc-400">
                  Sign in to manage your tennis club.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-bold"
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
                    className="w-full rounded-xl border-2 border-[#103f25]/20 bg-[#f1eee5] px-4 py-3 text-[#103f25] outline-none transition placeholder:text-[#103f25]/35 focus:border-[#103f25] focus:bg-[#fffdf5] focus:shadow-[4px_4px_0_#dfff28] dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:placeholder:text-zinc-600 dark:focus:border-zinc-300 dark:focus:bg-zinc-950 dark:focus:shadow-[4px_4px_0_#dfff28]"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label htmlFor="password" className="text-sm font-bold">
                      Password
                    </label>
                  </div>

                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete="current-password"
                      required
                      className="w-full rounded-xl border-2 border-[#103f25]/20 bg-[#f1eee5] px-4 py-3 pr-12 text-[#103f25] outline-none transition placeholder:text-[#103f25]/35 focus:border-[#103f25] focus:bg-[#fffdf5] focus:shadow-[4px_4px_0_#dfff28] dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:placeholder:text-zinc-600 dark:focus:border-zinc-300 dark:focus:shadow-[4px_4px_0_#dfff28]"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[#103f25]/55 transition hover:bg-[#dfff28] hover:text-[#103f25] dark:text-zinc-500 dark:hover:text-zinc-950"
                    >
                      {showPassword ? "◉" : "○"}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl border-2 border-red-900/20 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl border-2 border-[#103f25] bg-[#103f25] px-4 py-3 font-black text-[#f1eee5] shadow-[5px_5px_0_#dfff28] transition hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>

                <div className="flex items-center gap-3 py-1">
                  <div className="h-px flex-1 bg-[#103f25]/15 dark:bg-zinc-800" />

                  <span className="text-[11px] font-black uppercase tracking-[0.14em] text-[#103f25]/45 dark:text-zinc-600">
                    Or
                  </span>

                  <div className="h-px flex-1 bg-[#103f25]/15 dark:bg-zinc-800" />
                </div>

                <GoogleLoginButton
                  onLoggedIn={onLoggedIn}
                  onError={(message) => {
                    setError(message || null);
                  }}
                />
              </form>

              <p className="mt-8 text-center text-xs leading-5 text-[#103f25]/45 dark:text-zinc-600">
                RallyLedger is for authorized club administrators.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default LoginPage;
