import { Link } from "react-router-dom";

const steps = [
  {
    number: "01",
    title: "Set up your organization",
    description:
      "Create your organization structure, add participants, configure courts and fee rules, and define the products your club offers.",
  },
  {
    number: "02",
    title: "Run your sessions",
    description:
      "Create sessions, add participants, organize matches or training activities, and keep the session records connected to the club ledger.",
  },
  {
    number: "03",
    title: "Manage matches and training",
    description:
      "Record match and training activity while keeping the related participant and session information together.",
  },
  {
    number: "04",
    title: "Manage products",
    description:
      "Create products, set their prices, activate or deactivate them, and charge products directly to participants.",
  },
  {
    number: "05",
    title: "Track the ledger",
    description:
      "Review participant charges, outstanding balances, payments, and other financial activity from the same organization.",
  },
  {
    number: "06",
    title: "Keep the organization controlled",
    description:
      "Use organization-scoped administration and audit records to keep important club activity organized and accountable.",
  },
];

export default function WalkthroughPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
      <section className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Walkthrough
        </p>

        <h1 className="mt-3 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-5xl">
          How RallyLedger works
        </h1>

        <p className="mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          RallyLedger connects the day-to-day operations of a tennis
          organization, including participants, sessions, matches, charges,
          products, and club records, into one workflow.
        </p>
      </section>

      <section className="mt-16 grid gap-6 md:grid-cols-2">
        {steps.map((step) => (
          <article
            key={step.number}
            className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <span className="text-sm font-semibold text-zinc-500">
              {step.number}
            </span>

            <h2 className="mt-3 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              {step.title}
            </h2>

            <p className="mt-3 leading-7 text-zinc-600 dark:text-zinc-400">
              {step.description}
            </p>
          </article>
        ))}
      </section>

      <section className="mt-16 rounded-2xl border border-zinc-200 bg-zinc-100 p-8 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Ready to use RallyLedger?
        </h2>

        <p className="mt-3 max-w-2xl leading-7 text-zinc-600 dark:text-zinc-400">
          Sign in to manage your organization, or explore the FAQ if you want to
          learn more about how RallyLedger works.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/login"
            className="primary-action inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium"
          >
            Sign in
          </Link>

          <Link
            to="/faq"
            className="secondary-action inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium"
          >
            Read the FAQ
          </Link>
        </div>
      </section>
    </main>
  );
}
