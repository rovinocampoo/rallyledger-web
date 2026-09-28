import { Link } from "react-router-dom";

function FaqPage() {
  const faqs = [
    {
      question: "What is RallyLedger?",
      answer:
        "RallyLedger is a club operations and financial ledger platform for tennis organizations. It connects participants, sessions, matches, charges, products, payments, balances, and administrative records.",
    },
    {
      question: "Who is RallyLedger for?",
      answer:
        "RallyLedger is designed for club administrators and organizations that need one place to manage recurring tennis operations and the financial records connected to them.",
    },
    {
      question: "Can RallyLedger manage different participant types?",
      answer:
        "Yes. RallyLedger supports organization-defined participant categories, membership status, temporary guests, and category-aware fee rules.",
    },
    {
      question: "Can I charge participants for products?",
      answer:
        "Yes. Products can be created and managed by administrators, and any participant type can be charged for a product.",
    },
    {
      question: "Can I change a product price later?",
      answer:
        "Yes. Product prices can be updated. Existing charges retain the amount that was recorded when the charge was created, so historical records do not change when a product price is updated.",
    },
    {
      question: "Can products be inactive?",
      answer:
        "Yes. Products can be marked active or inactive. This allows administrators to keep historical product records while preventing an inactive product from being used for new charges.",
    },
    {
      question: "Does RallyLedger support multiple organizations?",
      answer:
        "Yes. Administrators can have access to multiple organizations and switch between them through the authenticated application. Organization-scoped records stay separated.",
    },
    {
      question: "Does RallyLedger have administrator roles?",
      answer:
        "Yes. RallyLedger includes role-aware administrator access, password management, organization access management, and organization audit history.",
    },
    {
      question: "Can RallyLedger track payments and outstanding balances?",
      answer:
        "Yes. Payments are recorded against participants, and the application provides participant balances, outstanding-balance views, and financial history.",
    },
    {
      question: "Are the privacy, terms, and cookie pages final?",
      answer:
        "The current public site contains the initial page structure. The substantive legal content will be finalized after the application's actual storage, cookie, third-party, payment, and data-retention behavior is reviewed.",
    },
    {
      question: "How do I get started?",
      answer:
        "Use the Sign in link to access RallyLedger with an approved administrator account.",
    },
  ];

  return (
    <main className="overflow-x-hidden bg-[#f1eee5] text-[#103f25] dark:bg-zinc-950 dark:text-zinc-100">
      {/* Hero */}
      <section className="relative overflow-hidden border-b-2 border-[#103f25] bg-[#f1eee5] dark:border-zinc-800 dark:bg-zinc-950">
        <div
          aria-hidden="true"
          className="absolute right-[-100px] top-[-120px] h-[340px] w-[340px] rounded-full bg-[#dfff28]/35 blur-3xl"
        />

        <div className="relative mx-auto w-[min(1180px,calc(100%-40px))] py-20 lg:py-28">
          <div className="max-w-4xl">
            <div className="inline-flex rotate-1 items-center gap-2 rounded-full border-2 border-[#103f25] bg-[#f1eee5] px-3 py-2 text-xs font-black uppercase tracking-[0.08em] dark:border-zinc-300 dark:bg-zinc-950">
              <span className="h-2.5 w-2.5 rounded-full border-2 border-[#103f25] bg-[#dfff28] dark:border-zinc-300" />
              Frequently asked
            </div>

            <h1 className="mt-6 max-w-[900px] text-[clamp(52px,7vw,94px)] font-black leading-[0.9] tracking-[-0.075em]">
              Questions before you{" "}
                 <span className="inline-block rotate-[-1.8deg] bg-[#dfff28] px-[0.09em] pb-[0.05em] text-[#00000] dark:text-zinc-950">
               get on court.
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-[1.6] text-[#103f25]/75 dark:text-zinc-400 lg:text-xl">
              A quick look at how RallyLedger handles the people, activity, and
              financial records behind a club.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-[#f1eee5] py-20 dark:bg-zinc-950 lg:py-26">
        <div className="mx-auto grid w-[min(1180px,calc(100%-40px))] grid-cols-1 gap-10 lg:grid-cols-[0.65fr_1.35fr] lg:gap-16">
          <div className="lg:sticky lg:top-8 lg:self-start">
            <div className="text-xs font-black uppercase tracking-[0.14em] opacity-70">
              RallyLedger FAQ
            </div>

            <h2 className="mt-3 text-[clamp(40px,5vw,62px)] font-black leading-[0.95] tracking-[-0.065em]">
              The stuff clubs usually ask first.
            </h2>

            <p className="mt-5 max-w-md text-lg leading-[1.55] text-[#103f25]/72 dark:text-zinc-400">
              We keep the answers practical so you can understand the workflow
              before using the application.
            </p>
          </div>

          <div className="grid gap-3">
            {faqs.map((faq, index) => (
              <details
                key={faq.question}
                className={`group rounded-[22px] border-2 border-[#103f25] bg-[#fffdf5]/65 transition open:shadow-[8px_8px_0_#dfff28] dark:border-zinc-700 dark:bg-zinc-900/70 ${
                  index % 5 === 1
                    ? "rotate-[0.45deg] open:rotate-0"
                    : index % 5 === 3
                      ? "rotate-[-0.45deg] open:rotate-0"
                      : ""
                }`}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 px-5 py-5 font-black marker:hidden [&::-webkit-details-marker]:hidden">
                  <span className="flex items-start gap-4">
                    <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg border-2 border-[#103f25] bg-[#dfff28] text-xs font-black dark:border-zinc-950 dark:text-zinc-950">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <span className="pt-1 text-base leading-tight sm:text-lg">
                      {faq.question}
                    </span>
                  </span>

                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-[#103f25] text-lg leading-none transition-transform group-open:rotate-45 dark:border-zinc-500">
                    +
                  </span>
                </summary>

                <div className="border-t border-[#103f25]/15 px-5 pb-5 pt-4 pl-[76px] text-[15px] leading-[1.65] text-[#103f25]/72 dark:border-zinc-700 dark:text-zinc-400">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#f1eee5] px-0 pb-24 pt-16 text-center dark:bg-zinc-950">
        <div className="mx-auto w-[min(1180px,calc(100%-40px))]">
          <div className="mx-auto max-w-[850px] -rotate-[0.6deg] rounded-[34px] border-[3px] border-[#103f25] bg-[#103f25] px-6 py-12 text-[#f1eee5] shadow-[12px_12px_0_#dfff28] dark:border-zinc-800 sm:px-9 sm:py-16">
            <div className="text-xs font-black uppercase tracking-[0.14em] text-[#dfff28]">
              Still curious?
            </div>

            <h2 className="mx-auto mt-3 max-w-2xl text-[clamp(40px,5vw,60px)] font-black leading-[0.95] tracking-[-0.065em]">
              See how the workflow fits together.
            </h2>

            <p className="mx-auto mt-5 max-w-xl text-lg leading-[1.55] text-[#f1eee5]/70 dark:text-zinc-400">
              Walk through RallyLedger from organization setup to the final
              ledger.
            </p>

            <Link
              to="/walkthrough"
              className="mt-7 inline-flex min-w-[130px] items-center justify-center rounded-xl border-2 border-[#f1eee5] bg-[#dfff28] px-5 py-3.5 font-black text-[#103f25] transition hover:-translate-x-0.5 hover:-translate-y-0.5"
            >
              See the walkthrough →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export default FaqPage;
