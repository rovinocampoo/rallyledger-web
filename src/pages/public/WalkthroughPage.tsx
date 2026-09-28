import { Link } from "react-router-dom";

function WalkthroughPage() {
  const steps = [
    {
      number: "01",
      title: "Set up your organization",
      text: "Create your club workspace and configure the people, categories, courts, and access you manage.",
    },
    {
      number: "02",
      title: "Run your sessions",
      text: "Record attendance, session activity, matches, results, training, outsiders, and rentals in one workflow.",
    },
    {
      number: "03",
      title: "Manage matches and training",
      text: "Assign players, record results, and keep the activity that happens on court connected to the session.",
    },
    {
      number: "04",
      title: "Manage products",
      text: "Create club products, keep pricing organized, and charge participants without maintaining a separate list.",
    },
    {
      number: "05",
      title: "Track the ledger",
      text: "Keep charges, payments, balances, outstanding amounts, and participant history connected.",
    },
    {
      number: "06",
      title: "Keep the organization controlled",
      text: "Use organization-scoped access, administrator roles, password management, and audit history.",
    },
  ];

  return (
    <main className="overflow-x-hidden bg-[#f1eee5] text-[#103f25] dark:bg-zinc-950 dark:text-zinc-100">
      {/* Hero */}
      <section className="relative overflow-hidden border-b-2 border-[#103f25] bg-[#f1eee5] dark:border-zinc-800 dark:bg-zinc-950">
        <div
          aria-hidden="true"
          className="absolute -right-28 -top-28 h-[360px] w-[360px] rounded-full bg-[#dfff28]/35 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="absolute -bottom-32 -left-28 h-[320px] w-[320px] rounded-full bg-[#dfff28]/15 blur-3xl"
        />

        <div className="relative mx-auto w-[min(1180px,calc(100%-40px))] py-20 lg:py-28">
          <div className="max-w-4xl">
            <div className="inline-flex -rotate-1.5 items-center gap-2 rounded-full border-2 border-[#103f25] bg-[#f1eee5] px-3 py-2 text-xs font-black uppercase tracking-[0.08em] dark:border-zinc-300 dark:bg-zinc-950">
              <span className="h-2.5 w-2.5 rounded-full border-2 border-[#103f25] bg-[#dfff28] dark:border-zinc-300" />
              The RallyLedger workflow
            </div>

            <h1 className="mt-6 max-w-[900px] text-[clamp(52px,7vw,94px)] font-black leading-[0.9] tracking-[-0.075em]">
              From{" "}
              <span className="inline-block rotate-[-1.8deg] bg-[#dfff28] px-[0.09em] pb-[0.05em] text-[#00000] dark:text-zinc-950">
               setup 
              </span>{" "}
              to a clean club ledger.
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-[1.6] text-[#103f25]/75 dark:text-zinc-400 lg:text-xl">
              RallyLedger connects the everyday work of a tennis club, from
              participants and sessions to matches, charges, products, payments,
              and administrative records.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/login"
                className="inline-flex min-w-[130px] items-center justify-center rounded-xl border-2 border-[#103f25] bg-[#103f25] px-5 py-3.5 font-black text-[#f1eee5] shadow-[5px_5px_0_#dfff28] transition hover:-translate-x-0.5 hover:-translate-y-0.5 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950"
              >
                Sign in
              </Link>

              <Link
                to="/"
                className="inline-flex items-center justify-center rounded-xl border-2 border-[#103f25] px-5 py-3.5 font-black transition hover:-translate-x-0.5 hover:-translate-y-0.5 dark:border-zinc-300"
              >
                Back to home
              </Link>
            </div>
          </div>

          <div
            aria-hidden="true"
            className="absolute right-4 top-12 hidden rotate-6 text-5xl font-black tracking-[-0.12em] text-[#103f25]/10 lg:block"
          >
            RALLY
            <br />
            LEDGER
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="bg-[#f1eee5] py-20 dark:bg-zinc-950 lg:py-26">
        <div className="mx-auto w-[min(1180px,calc(100%-40px))]">
          <div className="mb-12 max-w-3xl">
            <div className="text-xs font-black uppercase tracking-[0.14em] opacity-70">
              How it works
            </div>

            <h2 className="mt-3 text-[clamp(40px,5vw,66px)] font-black leading-[0.95] tracking-[-0.065em]">
              Six parts. One connected workflow.
            </h2>

            <p className="mt-5 max-w-2xl text-lg leading-[1.55] text-[#103f25]/75 dark:text-zinc-400">
              Each part of RallyLedger is designed around the way club
              administrators actually operate.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {steps.map((step, index) => (
              <article
                key={step.number}
                className={`group relative min-h-[280px] overflow-hidden rounded-[26px] border-2 border-[#103f25] bg-[#fffdf5]/65 p-6 transition hover:-translate-y-1.5 hover:shadow-[10px_10px_0_#dfff28] dark:border-zinc-700 dark:bg-zinc-900/70 ${
                  index === 1
                    ? "rotate-[0.7deg] hover:rotate-0"
                    : index === 3
                      ? "rotate-[-0.7deg] hover:rotate-0"
                      : ""
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="grid h-11 w-11 place-items-center rounded-xl border-2 border-[#103f25] bg-[#dfff28] text-sm font-black dark:border-zinc-950 dark:text-zinc-950">
                    {step.number}
                  </div>

                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#103f25]/45 dark:text-zinc-500">
                    RallyLedger
                  </div>
                </div>

                <h3 className="mt-12 max-w-[300px] text-[28px] font-black leading-[0.98] tracking-[-0.05em]">
                  {step.title}
                </h3>

                <p className="mt-4 max-w-[330px] leading-[1.55] text-[#103f25]/70 dark:text-zinc-400">
                  {step.text}
                </p>

                <div
                  aria-hidden="true"
                  className="absolute -bottom-8 -right-5 text-7xl font-black tracking-[-0.12em] text-[#103f25]/5 dark:text-white/5"
                >
                  {step.number}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Dark section */}
      <section className="border-y-[3px] border-[#103f25] bg-[#103f25] py-20 text-[#f1eee5] dark:border-zinc-800 dark:bg-zinc-900 lg:py-26">
        <div className="mx-auto grid w-[min(1180px,calc(100%-40px))] grid-cols-1 items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.14em] text-[#f1eee5]/65">
              The idea
            </div>

            <h2 className="mt-3 max-w-2xl text-[clamp(42px,5vw,68px)] font-black leading-[0.94] tracking-[-0.065em]">
              Keep the{" "}
              <span className="inline-block rotate-[-1deg] bg-[#dfff28] px-[0.08em] text-[#103f25]">
                people, play,
              </span>{" "}
              and money connected.
            </h2>

            <p className="mt-6 max-w-xl text-lg leading-[1.6] text-[#f1eee5]/72 dark:text-zinc-400">
              A participant joins a session. A session creates matches and
              activity. That activity creates charges. Payments then affect the
              participant's balance. RallyLedger keeps those relationships in
              one system.
            </p>
          </div>

          <div className="grid gap-3">
            {[
              "Participants → sessions",
              "Sessions → matches",
              "Matches → charges",
              "Products → participant charges",
              "Charges → ledger",
              "Payments → balances",
            ].map((item, index) => (
              <div
                key={item}
                className="flex items-center justify-between gap-4 rounded-2xl border border-[#f1eee5]/20 bg-white/[0.035] px-5 py-4"
              >
                <span className="font-bold">{item}</span>
                <span className="text-sm font-black text-[#dfff28]">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#f1eee5] px-0 py-20 text-center dark:bg-zinc-950 lg:py-24">
        <div className="mx-auto w-[min(1180px,calc(100%-40px))]">
          <div className="mx-auto max-w-[900px] -rotate-[0.6deg] rounded-[34px] border-[3px] border-[#103f25] bg-[#dfff28] px-6 py-14 shadow-[14px_14px_0_#103f25] dark:border-zinc-950 dark:shadow-[14px_14px_0_#dfff28] sm:px-10 sm:py-[72px]">
            <div className="text-xs font-black uppercase tracking-[0.14em] text-[#103f25]/70">
              Ready when your club is
            </div>

            <h2 className="mx-auto mt-3 max-w-3xl text-[clamp(40px,5vw,66px)] font-black leading-[0.95] tracking-[-0.065em] text-[#103f25]">
              Put your club workflow in one place.
            </h2>

            <p className="mx-auto mt-5 max-w-xl text-lg leading-[1.55] text-[#103f25]/75">
              Start with the people and sessions you already manage, then build
              the rest of your club records around them.
            </p>

            <Link
              to="/login"
              className="mt-7 inline-flex min-w-[130px] items-center justify-center rounded-xl border-2 border-[#103f25] bg-[#103f25] px-5 py-3.5 font-black text-[#f1eee5] shadow-[5px_5px_0_#fffdf5] transition hover:-translate-x-0.5 hover:-translate-y-0.5"
            >
              Sign in →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export default WalkthroughPage;
