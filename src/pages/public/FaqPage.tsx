const faqs = [
  {
    question: "What is RallyLedger?",
    answer:
      "RallyLedger is a tennis club management platform for organizing participants, sessions, matches, charges, products, and other organization records in one place.",
  },
  {
    question: "Who is RallyLedger for?",
    answer:
      "RallyLedger is designed for tennis clubs, organizations, coaches, and administrators who need to manage recurring tennis activities and the records associated with them.",
  },
  {
    question: "Can RallyLedger manage different participant types?",
    answer:
      "Yes. RallyLedger supports the participant types configured by the organization, including members and non-members or guests.",
  },
  {
    question: "Can I charge participants for products?",
    answer:
      "Yes. Administrators can create products, select a participant, and create a product charge. Product charges are recorded in the participant's ledger.",
  },
  {
    question: "Can I change a product price?",
    answer:
      "Yes. A product's current price can be updated. Existing product charges retain the amount that was recorded when the charge was created, while future charges use the product's current price.",
  },
  {
    question: "Can products be inactive?",
    answer:
      "Yes. Products can be marked inactive. Inactive products remain in the system but cannot be used for new product charges.",
  },
  {
    question: "Does RallyLedger support multiple organizations?",
    answer:
      "Yes. RallyLedger is built around organization-scoped data so each organization can manage its own participants, sessions, financial records, and configuration.",
  },
  {
    question: "Does RallyLedger have administrator roles?",
    answer:
      "Yes. RallyLedger includes organization-level administrative access controls and audit records for important administrative activity.",
  },
  {
    question: "Are the legal and privacy pages final?",
    answer:
      "The public legal pages are being prepared as part of the product's production-readiness work. Their substantive content will be finalized after reviewing RallyLedger's actual data, authentication, storage, tracking, and third-party service behavior.",
  },
  {
    question: "How do I get started?",
    answer:
      "If you already have access to a RallyLedger organization, use the Sign in link to enter the application.",
  },
]

export default function FaqPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
      <section className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
          FAQ
        </p>

        <h1 className="mt-3 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-5xl">
          Frequently asked questions
        </h1>

        <p className="mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          A quick overview of RallyLedger and the workflows currently
          supported by the platform.
        </p>
      </section>

      <section className="mt-12 space-y-4">
        {faqs.map((faq) => (
          <details
            key={faq.question}
            className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <summary className="cursor-pointer list-none pr-8 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {faq.question}
            </summary>

            <p className="mt-4 leading-7 text-zinc-600 dark:text-zinc-400">
              {faq.answer}
            </p>
          </details>
        ))}
      </section>
    </main>
  )
}
