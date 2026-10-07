type PlayerPortalLoadingProps = {
  message?: string;
};

export default function PlayerPortalLoading({
  message = "Getting your court ready...",
}: PlayerPortalLoadingProps) {
  return (
    <main className="min-h-screen bg-[#f1eee5] px-5 py-6 text-[#103f25] dark:bg-zinc-950 dark:text-white sm:px-8">
      <div className="mx-auto flex min-h-[80vh] max-w-6xl items-center justify-center">
        <div className="w-full max-w-md text-center">
          {/* Tennis court */}
          <div className="relative mx-auto mb-8 h-28 w-52 overflow-hidden rounded-xl border-2 border-[#103f25]/20 bg-[#103f25] shadow-xl dark:border-lime-400/20">
            {/* Court lines */}
            <div className="absolute inset-3 rounded-lg border border-white/70" />
            <div className="absolute left-1/2 top-3 bottom-3 w-px -translate-x-1/2 bg-white/70" />
            <div className="absolute left-3 right-3 top-1/2 h-px -translate-y-1/2 bg-white/70" />

            {/* Net */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2 bg-white/40" />

            {/* Animated tennis ball */}
            <div className="absolute left-8 top-1/2 h-5 w-5 -translate-y-1/2 animate-[bounce_1.4s_ease-in-out_infinite] rounded-full bg-lime-400 shadow-lg shadow-lime-400/30">
              <div className="absolute inset-1 rounded-full border border-[#103f25]/30 border-l-0 border-b-0 rotate-[-35deg]" />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
            Getting your court ready
          </h1>

          {/* Current loading step */}
          <p className="mt-3 min-h-5 text-sm font-semibold text-[#103f25]/60 dark:text-white/50">
            {message}
          </p>

          {/* Progress animation */}
          <div className="mx-auto mt-7 h-2 w-full max-w-xs overflow-hidden rounded-full bg-[#103f25]/10 dark:bg-white/10">
            <div className="h-full w-1/2 animate-[loading_1.5s_ease-in-out_infinite] rounded-full bg-[#103f25] dark:bg-lime-400" />
          </div>

          {/* Brand */}
          <p className="mt-6 text-[10px] font-black uppercase tracking-[0.22em] text-[#103f25]/35 dark:text-white/30">
            RallyLedger Player Portal
          </p>
        </div>
      </div>
    </main>
  );
}
