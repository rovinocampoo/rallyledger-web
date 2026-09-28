import { Link } from "react-router-dom";

function LandingPage() {
  return (
    <div>
      <section className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:py-28">
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Rallyledger: club management
            </p>

            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-950 sm:text-6xl dark:text-white">
              Run your club without the spreadsheet chaos.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
              RallyLedger brings participants, sessions, matches, charges,
              products, and club records into one place.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/login"
                className="primary-action inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium"
              >
                Sign In
              </Link>

              <Link
                to="/walkthrough"
                className="secondary-action inline-flex items-center justify-center rounded-lg px-5 py-3 text-sm font-medium"
              >
                See how it works
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl px-5 py-16">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Built for club operations
            </p>

            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              The tools your club uses every week.
            </h2>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Participants",
                description:
                  "Keep player records organized and accessible to your club administrators.",
              },
              {
                title: "Sessions",
                description:
                  "Manage regular play, training, outsiders, attendance, and session activity.",
              },
              {
                title: "Matches",
                description:
                  "Record match participants, results, and related session activity.",
              },
              {
                title: "Charges",
                description:
                  "Track session, match, product, and other club charges in one ledger.",
              },
              {
                title: "Products",
                description:
                  "Manage club products and charge participants directly from RallyLedger.",
              },
              {
                title: "Club records",
                description:
                  "Keep outstanding balances, payments, and operational records organized.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <h3 className="font-semibold">{feature.title}</h3>

                <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              [
                "01",
                "Set up your organization",
                "Create your club workspace and configure the people and courts you manage.",
              ],
              [
                "02",
                "Run your sessions",
                "Record participants, attendance, matches, results, and session activity.",
              ],
              [
                "03",
                "Keep the ledger organized",
                "Track charges, products, payments, and outstanding balances.",
              ],
            ].map(([number, title, description]) => (
              <div key={number}>
                <span className="text-xs font-semibold text-zinc-400">
                  {number}
                </span>

                <h3 className="mt-3 font-semibold">{title}</h3>

                <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl px-5 py-16 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">
            Want to see how RallyLedger works?
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">
            Walk through the core club workflow from participants to sessions,
            matches, charges, and products.
          </p>

          <Link
            to="/walkthrough"
            className="secondary-action mt-6 inline-flex rounded-lg px-5 py-3 text-sm font-medium"
          >
            View walkthrough
          </Link>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;
