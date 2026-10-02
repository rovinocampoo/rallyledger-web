import { AuthView, NeonAuthUIProvider } from "@neondatabase/auth-ui";
import {
  Link as RouterLink,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import type { AnchorHTMLAttributes } from "react";

import { neonAuth } from "../auth/neon";

const PLAYER_AUTH_PATHS = new Set([
  "sign-in",
  "sign-up",
  "forgot-password",
  "reset-password",
  "magic-link",
  "two-factor",
  "callback",
  "sign-out",
]);

function toPlayerAuthPath(path: string) {
  if (path.startsWith("/auth/")) {
    return `/player/${path.slice("/auth/".length)}`;
  }

  if (path.startsWith("auth/")) {
    return `/player/${path.slice("auth/".length)}`;
  }

  return path;
}

function PlayerAuthLink({
  href,
  ...props
}: {
  href: string;
} & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <RouterLink to={toPlayerAuthPath(href)} {...props} />;
}

export default function PlayerLoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { authPath = "sign-in" } = useParams();

  const inviteToken = searchParams.get("invite");

  const path = PLAYER_AUTH_PATHS.has(authPath) ? authPath : "sign-in";

  const isSignUp = path === "sign-up";

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
          <section className="relative flex min-h-[320px] overflow-hidden bg-[#103f25] p-8 text-[#f1eee5] sm:min-h-[420px] sm:p-10 lg:min-h-[620px] lg:flex-col lg:justify-between">
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
                Player portal
              </div>

              <h1 className="mt-8 max-w-md text-[clamp(48px,5vw,72px)] font-black leading-[0.9] tracking-[-0.07em]">
                Your game.
                <br />
                <span className="inline-block rotate-[-1deg] bg-[#dfff28] px-2 text-[#103f25]">
                  Your records.
                </span>
              </h1>

              <p className="mt-6 max-w-md text-base leading-[1.6] text-[#f1eee5]/70">
                View your balance, charges, payments, sessions, matches, and
                player records from one account.
              </p>
            </div>
            {/* Tennis visual */}
            <div className="relative flex flex-1 items-center justify-center py-10">
              <div className="relative h-64 w-64 rotate-[3deg] rounded-[42%_58%_50%_50%/48%_45%_55%_52%] border-[3px] border-[#f1eee5] bg-[#fffdf5] shadow-[12px_12px_0_#dfff28] transition duration-300 hover:rotate-[-2deg] hover:scale-[1.02]">
                <div className="absolute inset-5 rounded-[inherit] border-2 border-dashed border-[#103f25]/25" />

                {/* Tennis court */}
                <div className="absolute left-[12%] right-[12%] top-[25%] h-[42%] rotate-[-1deg] border-[3px] border-[#103f25] bg-[#dfff28] [transform:perspective(500px)_rotateX(10deg)_rotate(-1deg)]">
                  <div className="absolute left-[20%] top-[10%] bottom-[10%] w-[2px] bg-[#103f25]" />
                  <div className="absolute right-[20%] top-[10%] bottom-[10%] w-[2px] bg-[#103f25]" />

                  <div className="absolute left-[20%] right-[20%] top-[49%] h-[2px] bg-[#103f25]" />

                  <div className="absolute left-[50%] top-[10%] bottom-[10%] w-[2px] -translate-x-1/2 bg-[#103f25]" />

                  <div className="absolute left-0 top-[49%] h-[2px] w-[5px] bg-[#103f25]" />
                  <div className="absolute right-0 top-[49%] h-[2px] w-[5px] bg-[#103f25]" />

                  <div className="absolute left-0 right-0 top-[10%] border-t-2 border-[#103f25]" />
                  <div className="absolute left-0 right-0 bottom-[10%] border-t-2 border-[#103f25]" />

                  <div className="absolute top-[-4%] bottom-[-4%] left-[45%] w-[18px] border-x-2 border-[#103f25] bg-[repeating-linear-gradient(45deg,transparent_0_5px,rgba(16,63,37,.55)_5px_7px),repeating-linear-gradient(-45deg,transparent_0_5px,rgba(16,63,37,.55)_5px_7px)]" />
                </div>

                {/* Tennis ball */}
                <div className="absolute right-[12%] top-[12%] h-12 w-12 rounded-full border-4 border-[#103f25] bg-[#dfff28]">
                  <div className="absolute left-[2px] top-[3px] h-5 w-8 rotate-[30deg] rounded-[50%] border-2 border-[#103f25] border-b-transparent border-l-transparent border-r-transparent" />
                </div>

                {/* Score */}
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
              Secure player access
            </div>
          </section>

          {/* Auth side */}
          <section className="p-6 sm:p-9 lg:p-12">
            <div className="mx-auto max-w-md">
              {/* Mobile logo */}
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

              {/* Page intro */}
              <div className="mb-8">
                <div className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-[#103f25]/55 dark:text-zinc-500">
                  {isSignUp ? "Player account" : "Welcome back"}
                </div>

                <h2 className="text-4xl font-black tracking-[-0.06em] sm:text-5xl">
                  {isSignUp ? "Join RallyLedger." : "Player sign in."}
                </h2>

                <p className="mt-3 text-sm leading-6 text-[#103f25]/65 dark:text-zinc-400">
                  {isSignUp
                    ? "Create your player account to access your tennis records."
                    : "Sign in to access your RallyLedger player account."}
                </p>
              </div>

              <NeonAuthUIProvider
                authClient={neonAuth}
                navigate={(nextPath) => {
                  navigate(toPlayerAuthPath(nextPath));
                }}
                replace={(nextPath) => {
                  navigate(toPlayerAuthPath(nextPath), {
                    replace: true,
                  });
                }}
                Link={PlayerAuthLink}
                redirectTo={
                  inviteToken ? `/player/invite/${inviteToken}` : "/player"
                }
                social={{
                  providers: ["google"],
                }}
              >
                <AuthView path={path} />
              </NeonAuthUIProvider>
              <p className="mt-8 text-center text-xs leading-5 text-[#103f25]/45 dark:text-zinc-600">
                RallyLedger player accounts are securely managed by Neon Auth.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
