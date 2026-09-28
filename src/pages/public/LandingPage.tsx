import { Link } from "react-router-dom";

function LandingPage() {
  return (
    <main className="overflow-x-hidden bg-[#f1eee5] text-[#103f25] dark:bg-zinc-950 dark:text-zinc-100">
      {/* Hero */}
      <section
        id="top"
        className="relative overflow-hidden border-b-2 border-[#103f25] bg-[#f1eee5] dark:border-zinc-800 dark:bg-zinc-950"
      >
        <div
          aria-hidden="true"
          className="absolute -right-24 -top-24 h-[360px] w-[360px] rounded-full bg-[#dfff28]/40 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="absolute -bottom-32 -left-32 h-[360px] w-[360px] rounded-full bg-[#dfff28]/15 blur-3xl"
        />

        <div className="relative mx-auto grid w-[min(1180px,calc(100%-40px))] grid-cols-1 items-center gap-10 py-16 lg:grid-cols-[1.05fr_.95fr] lg:gap-9 lg:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex rotate-[-1.5deg] items-center gap-2 rounded-full border-2 border-[#103f25] bg-[#f1eee5] px-3 py-2 text-xs font-black uppercase tracking-[0.08em] dark:border-zinc-300 dark:bg-zinc-950 dark:text-zinc-100">
              <span className="h-2.5 w-2.5 rounded-full border-2 border-[#103f25] bg-[#dfff28] dark:border-zinc-300" />
              Club management, simplified
            </div>

            <h1 className="mt-6 max-w-[780px] text-[clamp(56px,7.4vw,104px)] font-black leading-[0.88] tracking-[-0.075em] text-[#103f25] dark:text-white">
              Run your club without the{" "}
              <span className="inline-block rotate-[-1.8deg] bg-[#dfff28] px-[0.09em] pb-[0.05em] text-[#103f25] dark:text-zinc-950">
                spreadsheet chaos.
              </span>
            </h1>

            <p className="mt-7 max-w-[610px] text-[19px] leading-[1.55] text-[#103f25]/80 dark:text-zinc-300">
              RallyLedger brings participants, sessions, matches, charges,
              products, and club records into one place, so your team can spend
              less time chasing admin and more time on the court.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/login"
                className="inline-flex min-w-[130px] items-center justify-center rounded-xl border-2 border-[#103f25] bg-[#103f25] px-5 py-3.5 font-black text-[#f1eee5] shadow-[5px_5px_0_#dfff28] transition hover:-translate-x-0.5 hover:-translate-y-0.5 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950 dark:shadow-[5px_5px_0_#dfff28]"
              >
                Sign in
              </Link>

              <Link
                to="/walkthrough"
                className="inline-flex min-w-[160px] items-center justify-center rounded-xl border-2 border-[#103f25] px-5 py-3.5 font-black text-[#103f25] transition hover:-translate-x-0.5 hover:-translate-y-0.5 dark:border-zinc-300 dark:text-zinc-100"
              >
                See how it works →
              </Link>
            </div>
          </div>

          {/* Hero illustration */}
          <div
            aria-hidden="true"
            className="relative grid min-h-[410px] place-items-center sm:min-h-[500px]"
          >
            <div className="relative aspect-[1/1.08] w-[min(470px,94%)] rotate-[2.5deg] overflow-hidden rounded-[44%_56%_50%_50%/43%_43%_57%_57%] border-[3px] border-[#103f25] bg-[#fffdf5] shadow-[16px_16px_0_#dfff28] transition duration-300 hover:rotate-[-2deg] hover:scale-[1.02] dark:border-zinc-200 dark:bg-zinc-900">
              <div className="absolute inset-5 rounded-[inherit] border-2 border-dashed border-[#103f25]/30 dark:border-zinc-400/30" />

              <div className="absolute left-[9%] top-[11%] z-10 rotate-[-9deg] border-[3px] border-[#103f25] bg-[#dfff28] px-3 py-2 text-sm font-black dark:border-zinc-950 dark:text-zinc-950">
                ONE CLUB. ONE LEDGER.
              </div>

              <div className="absolute left-[14%] right-[14%] top-[23%] h-[43%] rotate-[-1deg] border-[4px] border-[#103f25] bg-[#dfff28] shadow-[0_8px_0_rgba(16,63,37,0.1)] [transform:perspective(500px)_rotateX(13deg)_rotate(-1deg)] dark:border-zinc-950">
                {/* service box vertical*/}
                <div className="absolute left-[20%] top-[10%] bottom-[10%] w-[2px] bg-[#103f25] dark:bg-zinc-950" />
                <div className="absolute right-[20%] top-[10%] bottom-[10%] w-[2px] bg-[#103f25] dark:bg-zinc-950" />

                {/* service box horizontal */}
                <div className="absolute inset-x-0 left-[20%] right-[20%] top-[49%] h-[2px] bg-[#103f25] dark:bg-zinc-950" />

                {/* middle line */}
                <div className="absolute left-[50%] top-[10%] bottom-[10%] w-[2px] bg-[#103f25] dark:bg-zinc-950" />

                {/* Baseline center marks */}
                <div className="absolute left-[0%] top-[49%] h-[2px] w-[5px] bg-[#103f25] dark:bg-zinc-950" />
                <div className="absolute right-[0%] top-[49%] h-[2px] w-[5px] bg-[#103f25] dark:bg-zinc-950" />

                {/* singles outside */}
                <div className="absolute left-[0%] right-[0%] top-[10%] border-t-2 border-[#103f25] dark:border-zinc-950" />
                <div className="absolute left-[0%] right-[0%] bottom-[10%] border-t-2 border-[#103f25] dark:border-zinc-950" />

                {/* racket strings */}
                <div className="absolute top-[-2%] bottom-[-2%] left-[45%] w-[34px] border-x-4 border-[#103f25] bg-[repeating-linear-gradient(45deg,transparent_0_7px,rgba(16,63,37,.7)_7px_9px),repeating-linear-gradient(-45deg,transparent_0_7px,rgba(16,63,37,.7)_7px_9px)] dark:border-zinc-950 dark:bg-[repeating-linear-gradient(22deg,transparent_0_7px,rgba(9,9,11,.7)_7px_9px),repeating-linear-gradient(110deg,transparent_0_7px,rgba(9,9,11,.7)_7px_9px)],repeating-linear-gradient(-45deg,transparent_0_7px,rgba(9,9,11,.7)_7px_9px)]" />
              </div>
              {/* top right ball */}
              <div className="absolute right-[12%] top-[9%] h-[74px] w-[74px] rotate-[14deg] rounded-full border-[5px] border-[#103f25] bg-[#dfff28] dark:border-zinc-950">
                <div className="absolute left-[3px] top-[4px] h-8 w-[52px] rotate-[30deg] rounded-[50%] border-[3px] border-[#103f25] border-b-transparent border-l-transparent border-r-transparent dark:border-zinc-950 dark:border-b-transparent dark:border-l-transparent dark:border-r-transparent" />
                <div className="absolute bottom-[4px] right-[1px] h-8 w-[52px] rotate-[210deg] rounded-[50%] border-[3px] border-[#103f25] border-b-transparent border-l-transparent border-r-transparent dark:border-zinc-950 dark:border-b-transparent dark:border-l-transparent dark:border-r-transparent" />
              </div>

              <div className="absolute bottom-[12%] left-[9%] h-[54px] w-[54px] rounded-full border-[5px] border-[#103f25] bg-[#dfff28] dark:border-zinc-950">
                <div className="absolute left-[1px] top-[3px] h-6 w-9 rotate-[30deg] rounded-[50%] border-[3px] border-[#103f25] border-b-transparent border-l-transparent border-r-transparent dark:border-zinc-950 dark:border-b-transparent dark:border-l-transparent dark:border-r-transparent" />
              </div>

              <div className="absolute bottom-[7%] right-[12%] h-[280px] w-[145px] rotate-[20deg]">
                <div
                  className="relative mx-auto h-[145px] w-[108px] rounded-[50%] border-[8px] border-[#103f25] 
                bg-[repeating-linear-gradient(22deg,transparent_0_7px,rgba(16,63,37,.7)_7px_9px),repeating-linear-gradient(110deg,transparent_0_7px,rgba(16,63,37,.7)_7px_9px)] 
                dark:border-zinc-950 
                dark:bg-[repeating-linear-gradient(22deg,transparent_0_7px,rgba(9,9,11,.75)_7px_9px),repeating-linear-gradient(110deg,transparent_0_7px,rgba(9,9,11,.75)_7px_9px)]"
                >
                  <div className="absolute inset-[11px] rounded-[50%] border-2 border-[#103f25] dark:border-zinc-950" />
                </div>

                <div className="mx-auto h-12 w-6 bg-[#103f25] dark:bg-zinc-950" />

                <div className="mx-auto h-[95px] w-[23px] rounded-b-xl bg-[#103f25] dark:bg-zinc-950" />
              </div>

              <div className="absolute right-[6%] top-[67%] rotate-[4deg] border-[3px] border-[#103f25] bg-[#f1eee5] px-3 py-2 text-[17px] font-black dark:border-zinc-950 dark:bg-zinc-100 dark:text-zinc-950">
                40 — 15
              </div>

              <div className="absolute bottom-[7%] left-[3%] rotate-[-7deg] text-[38px] font-black leading-[0.7] tracking-[-0.15em]">
                ↗ ↗
                <br />↗
              </div>
            </div>
          </div>

          <svg
            className="absolute left-[2%] top-[24%] hidden h-[150px] w-[120px] lg:block"
            viewBox="0 0 120 150"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M15 25c25-25 52 5 77-8M18 53c22-18 36 15 75 0M10 83c27 19 52-12 93 7M22 119c18-12 43 12 78-3"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>

          <svg
            className="absolute bottom-[7%] right-[3%] hidden h-[120px] w-[150px] lg:block"
            viewBox="0 0 150 120"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M8 96l42-30 18 16 30-42 43 23M103 12l9 14 16-3"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </section>

      {/* Tools */}
      <section
        id="tools"
        className="bg-[#f1eee5] py-20 dark:bg-zinc-950 lg:py-26"
      >
        <div className="mx-auto w-[min(1180px,calc(100%-40px))]">
          <div className="mb-12 max-w-3xl">
            <div className="text-xs font-black uppercase tracking-[0.14em] opacity-70">
              Built for club operations
            </div>

            <h2 className="mt-3 max-w-[720px] text-[clamp(40px,5vw,66px)] font-black leading-[0.95] tracking-[-0.065em]">
              The tools your club uses every week.
            </h2>

            <p className="mt-5 max-w-[650px] text-lg leading-[1.55] text-[#103f25]/75 dark:text-zinc-400">
              Keep the moving parts of your club connected. RallyLedger gives
              administrators one clear place to manage the people, play, and
              money behind every session.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                number: "01",
                title: "Participants",
                text: "Keep player records organized and accessible to your club administrators.",
              },
              {
                number: "02",
                title: "Sessions",
                text: "Manage regular play, training, outsiders, attendance, and session activity.",
                tilt: "rotate-[0.7deg]",
              },
              {
                number: "03",
                title: "Matches",
                text: "Record match participants, results, and related session activity.",
              },
              {
                number: "04",
                title: "Charges",
                text: "Track session, match, product, and other club charges in one ledger.",
                tilt: "rotate-[-0.7deg]",
              },
              {
                number: "05",
                title: "Products",
                text: "Manage club products and charge participants directly from RallyLedger.",
              },
              {
                number: "06",
                title: "Club records",
                text: "Keep outstanding balances, payments, and operational records organized.",
              },
            ].map((feature) => (
              <article
                key={feature.number}
                className={`group relative min-h-[230px] overflow-hidden rounded-[26px] border-2 border-[#103f25] bg-[#fffdf5]/60 p-6 transition hover:-translate-y-1 hover:shadow-[8px_8px_0_#dfff28] dark:border-zinc-700 dark:bg-zinc-900/70 ${
                  feature.tilt ?? ""
                }`}
              >
                <div className="mb-7 grid h-[46px] w-[46px] place-items-center rounded-xl border-2 border-[#103f25] bg-[#dfff28] text-lg font-black dark:border-zinc-950 dark:text-zinc-950">
                  {feature.number}
                </div>

                <h3 className="mb-2 text-[22px] font-black tracking-[-0.035em]">
                  {feature.title}
                </h3>

                <p className="leading-[1.55] text-[#103f25]/70 dark:text-zinc-400">
                  {feature.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section
        id="workflow"
        className="overflow-hidden border-y-[3px] border-[#103f25] bg-[#103f25] py-20 text-[#f1eee5] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 lg:py-26"
      >
        <div className="mx-auto w-[min(1180px,calc(100%-40px))]">
          <div className="mb-12 max-w-3xl">
            <div className="text-xs font-black uppercase tracking-[0.14em] opacity-70">
              The workflow
            </div>

            <h2 className="mt-3 text-[clamp(40px,5vw,66px)] font-black leading-[0.95] tracking-[-0.065em]">
              From first setup to a clean ledger.
            </h2>

            <p className="mt-5 max-w-[650px] text-lg leading-[1.55] text-[#f1eee5]/70 dark:text-zinc-400">
              RallyLedger follows the way a club actually works, connecting
              daily activity to the records you need at the end of the week.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-[18px] md:grid-cols-3">
            {[
              {
                number: "01",
                title: "Set up your organization",
                text: "Create your club workspace and configure the people and courts you manage.",
              },
              {
                number: "02",
                title: "Run your sessions",
                text: "Record participants, attendance, matches, results, and session activity.",
              },
              {
                number: "03",
                title: "Keep the ledger organized",
                text: "Track charges, products, payments, and outstanding balances.",
              },
            ].map((step) => (
              <article
                key={step.number}
                className="min-h-[250px] rounded-3xl border border-[#f1eee5]/25 bg-white/[0.025] p-7"
              >
                <div className="text-[13px] font-black tracking-[0.1em] text-[#dfff28]">
                  {step.number}
                </div>

                <h3 className="mt-12 text-[28px] font-black leading-tight tracking-[-0.05em]">
                  {step.title}
                </h3>

                <p className="mt-2.5 leading-[1.55] text-[#f1eee5]/70 dark:text-zinc-400">
                  {step.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Ledger */}
      <section className="bg-[#f1eee5] py-20 dark:bg-zinc-950 lg:py-26">
        <div className="mx-auto grid w-[min(1180px,calc(100%-40px))] grid-cols-1 items-center gap-12 lg:grid-cols-[.9fr_1.1fr]">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.14em] opacity-70">
              One source of truth
            </div>

            <h2 className="mt-3 text-[clamp(40px,5vw,66px)] font-black leading-[0.95] tracking-[-0.065em]">
              Less admin. More rally.
            </h2>

            <p className="mt-5 max-w-[650px] text-lg leading-[1.55] text-[#103f25]/75 dark:text-zinc-400">
              Replace scattered spreadsheets, handwritten notes, and separate
              charge lists with a club workflow that keeps everything connected.
            </p>

            <Link
              to="/walkthrough"
              className="mt-7 inline-flex min-w-[130px] items-center justify-center rounded-xl border-2 border-[#103f25] bg-[#103f25] px-5 py-3.5 font-black text-[#f1eee5] shadow-[5px_5px_0_#dfff28] transition hover:-translate-x-0.5 hover:-translate-y-0.5 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950"
            >
              Explore the workflow →
            </Link>
          </div>

          <div
            aria-label="Illustration of a club ledger"
            className="min-h-[400px] rotate-[-1.5deg] rounded-[30px] border-[3px] border-[#103f25] bg-[#fffdf5] p-6 shadow-[12px_12px_0_#dfff28] dark:border-zinc-200 dark:bg-zinc-900"
          >
            <div className="flex items-center justify-between gap-4 border-b-2 border-[#103f25] pb-4 dark:border-zinc-700">
              <div className="text-[22px] font-black">Club ledger</div>

              <div className="rounded-full border-2 border-[#103f25] bg-[#dfff28] px-2.5 py-1 text-[11px] font-black dark:border-zinc-950 dark:text-zinc-950">
                LIVE RECORD
              </div>
            </div>

            <div className="mt-[18px] grid gap-2.5">
              {[
                ["short", "", "₱ 1,240"],
                ["", "short", "₱ 980"],
                ["short", "short", "₱ 760"],
                ["", "", "₱ 540"],
                ["short", "", "₱ 420"],
              ].map(([first, second, amount], index) => (
                <div
                  key={index}
                  className="grid grid-cols-[1.4fr_.8fr_.7fr] items-center gap-2.5"
                >
                  <div
                    className={`h-[30px] rounded-lg border-2 border-[#103f25] bg-[#f1eee5] dark:border-zinc-700 dark:bg-zinc-800 ${
                      first === "short" ? "bg-[#dfff28] dark:bg-[#dfff28]" : ""
                    }`}
                  />

                  <div
                    className={`h-[30px] rounded-lg border-2 border-[#103f25] bg-[#f1eee5] dark:border-zinc-700 dark:bg-zinc-800 ${
                      second === "short" ? "bg-[#dfff28] dark:bg-[#dfff28]" : ""
                    }`}
                  />

                  <div className="text-right font-black">{amount}</div>
                </div>
              ))}
            </div>

            <div className="mt-[22px] flex items-center justify-between gap-4 border-t-2 border-dashed border-[#103f25] pt-[18px] font-black dark:border-zinc-700">
              <span>Outstanding</span>
              <span>₱ 3,940</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="overflow-hidden bg-[#f1eee5] px-0 pb-24 pt-20 text-center dark:bg-zinc-950 lg:pb-28 lg:pt-24">
        <div className="mx-auto w-[min(1180px,calc(100%-40px))]">
          <div className="mx-auto max-w-[900px] -rotate-[0.6deg] rounded-[34px] border-[3px] border-[#103f25] bg-[#dfff28] px-6 py-14 shadow-[14px_14px_0_#103f25] dark:border-zinc-950 dark:shadow-[14px_14px_0_#dfff28] sm:px-9 sm:py-[72px]">
            <div className="text-xs font-black uppercase tracking-[0.14em] text-[#103f25]/70">
              Want to see RallyLedger in action?
            </div>

            <h2 className="mx-auto mt-3 max-w-[750px] text-[clamp(40px,5vw,66px)] font-black leading-[0.95] tracking-[-0.065em] text-[#103f25]">
              Walk through the club workflow.
            </h2>

            <p className="mx-auto mt-5 max-w-[600px] text-lg leading-[1.55] text-[#103f25]/75">
              See how participants, sessions, matches, charges, and products fit
              together from setup to the final ledger.
            </p>

            <Link
              to="/walkthrough"
              className="mt-7 inline-flex min-w-[130px] items-center justify-center rounded-xl border-2 border-[#103f25] bg-[#103f25] px-5 py-3.5 font-black text-[#f1eee5] shadow-[5px_5px_0_#fffdf5] transition hover:-translate-x-0.5 hover:-translate-y-0.5"
            >
              View walkthrough →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export default LandingPage;
