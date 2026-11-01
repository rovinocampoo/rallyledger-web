import { useEffect, useRef, useState } from "react";

type DemoView = "players" | "sessions" | "balance" | "sales" | "products" | "reports";

const participants = [
  { id: 1, name: "Maya Santos", nickname: "May", group: "Adult · Intermediate", email: "maya@example.test", sessions: 8, balance: "₱0.00", status: "ACTIVE" },
  { id: 2, name: "Ethan Reyes", nickname: "EJ", group: "Junior · Development", email: "ethan@example.test", sessions: 6, balance: "₱450.00", status: "ACTIVE" },
  { id: 3, name: "Sofia Cruz", nickname: "Sofi", group: "Adult · Beginner", email: "sofia@example.test", sessions: 5, balance: "₱0.00", status: "ACTIVE" },
];

const demoNavigation: { section: string; items: { id: DemoView; label: string }[] }[] = [
  { section: "Play", items: [{ id: "sessions", label: "Sessions" }, { id: "players", label: "Players" }] },
  { section: "Finance", items: [{ id: "balance", label: "Balance" }, { id: "sales", label: "Sales" }, { id: "products", label: "Products" }, { id: "reports", label: "Financial Report" }] },
];

function DemoWorkspace() {
  const [view, setView] = useState<DemoView>("players");
  const [selectedParticipant, setSelectedParticipant] = useState(1);
  const [search, setSearch] = useState("");
  const selected = participants.find((participant) => participant.id === selectedParticipant) ?? participants[0];
  const visibleParticipants = participants.filter((participant) =>
    `${participant.name} ${participant.nickname} ${participant.group}`.toLowerCase().includes(search.toLowerCase()),
  );
  const pageTitle = demoNavigation.flatMap((section) => section.items).find((item) => item.id === view)?.label ?? "Players";

  const renderPlayers = () => (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h3 className="text-2xl font-semibold text-zinc-950 dark:text-white">Players</h3><p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Manage club members and guests.</p></div>
        <button type="button" disabled title="Actions are disabled in this read-only demo" className="primary-action rounded-lg px-4 py-2 text-sm font-medium opacity-60">Add Participant</button>
      </div>
      <label className="mb-4 block max-w-md"><span className="sr-only">Search players</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search players..." className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" /></label>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,.8fr)]">
        <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="hidden grid-cols-[130px_minmax(0,1fr)_minmax(0,.8fr)_auto] gap-4 bg-zinc-50 px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 md:grid"><span>Membership</span><span>Full name</span><span>Nickname</span><span>Actions</span></div>
          <div className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-900">
            {visibleParticipants.map((person) => <div key={person.id} className={`grid gap-3 p-4 transition-colors md:grid-cols-[130px_minmax(0,1fr)_minmax(0,.8fr)_auto] md:items-center ${selectedParticipant === person.id ? "bg-emerald-50/50 dark:bg-emerald-950/10" : ""}`}>
              <div className="flex items-center gap-2"><span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">Active</span><span className="hidden rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 sm:inline">{person.group.split(" · ")[0]}</span></div>
              <button type="button" onClick={() => setSelectedParticipant(person.id)} className="text-left text-sm font-medium text-zinc-900 hover:underline dark:text-white">{person.name}<span className="ml-2 text-xs text-zinc-500 md:hidden">{person.group}</span></button>
              <span className="hidden text-sm text-zinc-600 dark:text-zinc-400 md:block">{person.nickname}</span>
              <button type="button" onClick={() => setSelectedParticipant(person.id)} aria-pressed={selectedParticipant === person.id} className="w-fit rounded-lg border border-zinc-300 px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">View Ledger</button>
            </div>)}
            {visibleParticipants.length === 0 && <p className="px-4 py-8 text-center text-sm text-zinc-500">No players found.</p>}
          </div>
        </div>
        <aside className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-start justify-between gap-3"><div><p className="text-xs text-zinc-500">Participant ledger · demo</p><h4 className="mt-1 text-lg font-semibold text-zinc-950 dark:text-white">{selected.name}</h4><p className="text-sm text-zinc-500">{selected.group}</p></div><span className="rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">{selected.nickname}</span></div>
          <div className="mt-4 grid grid-cols-2 gap-3 border-y border-zinc-200 py-3 text-sm dark:border-zinc-800"><div><p className="text-xs text-zinc-500">Outstanding</p><p className="mt-1 font-semibold">{selected.balance}</p></div><div><p className="text-xs text-zinc-500">Sessions</p><p className="mt-1 font-semibold">{selected.sessions} this month</p></div></div>
          <h5 className="mt-4 text-sm font-semibold">Recent activity</h5>
          <div className="mt-2 divide-y divide-zinc-200 text-sm dark:divide-zinc-800"><div className="flex justify-between gap-2 py-2"><span><span className="block font-medium">Open Play</span><span className="text-xs text-zinc-500">Oct 12 · Session fee</span></span><span className="text-right"><span className="block">₱350.00</span><span className="text-xs text-emerald-700 dark:text-emerald-300">Paid</span></span></div><div className="flex justify-between gap-2 py-2"><span><span className="block font-medium">Club shirt</span><span className="text-xs text-zinc-500">Oct 08 · Product sale</span></span><span className="text-right"><span className="block">₱850.00</span><span className="text-xs text-emerald-700 dark:text-emerald-300">Paid</span></span></div></div>
          <button type="button" disabled title="Payments are not processed in the demo" className="secondary-action mt-3 w-full rounded-lg px-3 py-2 text-sm opacity-60">Record Payment</button>
        </aside>
      </div>
    </>
  );

  const renderSummaryCards = (items: [string, string][]) => <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{items.map(([label, value]) => <div key={label} className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"><p className="text-xs text-zinc-500">{label}</p><p className="mt-2 text-xl font-semibold tabular-nums text-zinc-950 dark:text-white">{value}</p></div>)}</div>;

  const renderView = () => {
    if (view === "players") return renderPlayers();
    if (view === "sessions") return <><div className="mb-5"><h3 className="text-2xl font-semibold text-zinc-950 dark:text-white">Sessions</h3><p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Review scheduled club activity and participation.</p></div><div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"><div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 bg-zinc-50 px-4 py-3 text-xs font-medium uppercase text-zinc-500 dark:bg-zinc-900"><span>Session</span><span>Participants</span></div>{[["Saturday Open Play","Oct 17 · 8:00–11:00 AM","18 / 24","Regular Play"],["Junior Development","Oct 18 · 3:00–5:00 PM","12 / 16","Training"],["Wednesday Doubles","Oct 21 · 6:00–9:00 PM","14 / 20","Regular Play"]].map(([name,date,count,type])=><div key={name} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-zinc-200 px-4 py-4 text-sm dark:border-zinc-800"><span><span className="block font-medium text-zinc-900 dark:text-white">{name}</span><span className="text-xs text-zinc-500">{date} · {type}</span></span><span className="text-right text-zinc-600 dark:text-zinc-300">{count}</span></div>)}</div></>;
    if (view === "balance") return <><div className="mb-5"><h3 className="text-2xl font-semibold text-zinc-950 dark:text-white">Outstanding Balance</h3><p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Review participant balances and account status.</p></div>{renderSummaryCards([["Outstanding Balance","₱4,450.00"],["Outstanding Participants","8"],["Credit Balance","₱1,200.00"],["Net Outstanding","₱3,250.00"]])}<div className="mt-5 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">{participants.map((person) => <div key={person.id} className="flex items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3 last:border-0 dark:border-zinc-800"><div><p className="text-sm font-medium">{person.name}</p><p className="text-xs text-zinc-500">{person.group}</p></div><span className="text-sm font-semibold tabular-nums">{person.balance}</span></div>)}</div></>;
    if (view === "sales") return <><div className="mb-5"><h3 className="text-2xl font-semibold text-zinc-950 dark:text-white">Sales</h3><p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Recorded product sales and club services.</p></div>{renderSummaryCards([["Sales this month","₱12,600.00"],["Transactions","39"],["Products","3"],["Outstanding","₱450.00"]])}<div className="mt-5 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">{[["Club shirt","Maya Santos","Oct 12","₱850.00","Paid"],["Overgrip pack","Ethan Reyes","Oct 11","₱220.00","Outstanding"],["Court booking","Sofia Cruz","Oct 09","₱500.00","Paid"]].map(([item,person,date,total,status])=><div key={item} className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 px-4 py-3 last:border-0 dark:border-zinc-800"><div><p className="text-sm font-medium">{item}</p><p className="text-xs text-zinc-500">{person} · {date}</p></div><div className="text-right"><p className="text-sm font-medium">{total}</p><p className="text-xs text-zinc-500">{status}</p></div></div>)}</div></>;
    if (view === "products") return <><div className="mb-5 flex items-center justify-between gap-3"><div><h3 className="text-2xl font-semibold text-zinc-950 dark:text-white">Products</h3><p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Manage products available for club sales.</p></div><button type="button" disabled className="primary-action rounded-lg px-4 py-2 text-sm opacity-60">Add Product</button></div><div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">{[["Club shirt","Apparel","₱850.00","12 in stock"],["Overgrip pack","Accessories","₱220.00","34 in stock"],["Court booking","Services","₱500.00","Active"]].map(([name,category,price,stock])=><div key={name} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-zinc-200 px-4 py-4 last:border-0 dark:border-zinc-800"><div><p className="text-sm font-medium">{name}</p><p className="text-xs text-zinc-500">{category} · {stock}</p></div><span className="text-sm font-medium tabular-nums">{price}</span></div>)}</div></>;
    return <><div className="mb-5 flex items-end justify-between gap-3"><div><h3 className="text-2xl font-semibold text-zinc-950 dark:text-white">Financial Report</h3><p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Period activity and balances.</p></div><button type="button" disabled className="secondary-action rounded-lg px-4 py-2 text-sm opacity-60">Export CSV</button></div><div className="mb-5 flex flex-wrap gap-2 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">{["All Time","Daily","Weekly","Monthly","Custom"].map((period,index)=><button key={period} type="button" disabled={index>0} className={`rounded-lg px-3 py-2 text-sm ${index===0?"bg-zinc-950 text-white dark:bg-white dark:text-black":"bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"}`}>{period}</button>)}</div>{renderSummaryCards([["Charges","₱42,800.00"],["Payments","₱37,250.00"],["Outstanding","₱5,550.00"],["Credit Balance","₱1,200.00"]])}<div className="mt-5 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"><h4 className="font-semibold">Financial Activity</h4><div className="mt-5 flex h-36 items-end gap-3 border-b border-zinc-200 dark:border-zinc-700">{[["May",38],["Jun",56],["Jul",46],["Aug",72],["Sep",62],["Oct",88]].map(([month,height])=><div key={month} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><div className="w-full max-w-12 rounded-t bg-emerald-700 dark:bg-lime-300" style={{height:`${height}%`}}/><span className="text-[10px] text-zinc-500">{month}</span></div>)}</div></div></>;
  };

  return <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
    <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950 sm:px-5"><div className="flex items-center gap-3"><img src="/branding/login-light-horizontal.png" alt="RallyLedger" className="h-5 w-auto dark:hidden"/><img src="/branding/login-dark-horizontal.png" alt="RallyLedger" className="hidden h-5 w-auto dark:block"/><span className="hidden border-l border-zinc-200 pl-3 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400 sm:block">Demo Club</span></div><span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">Sample data · read only</span></div>
    <div className="grid md:grid-cols-[210px_minmax(0,1fr)]">
      <aside className="hidden border-r border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950 md:block"><div className="mb-4 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"><p className="text-[10px] uppercase tracking-wide text-zinc-500">Organization</p><p className="mt-1 truncate text-sm font-medium">Demo Racket Sports Club</p></div><button type="button" disabled className="primary-action flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium opacity-60">+ <span>Quick Add</span></button><nav aria-label="Demo navigation" className="mt-5 space-y-5">{demoNavigation.map((group)=><div key={group.section}><p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[.14em] text-zinc-400">{group.section}</p><div className="space-y-1">{group.items.map((item)=><button key={item.id} type="button" onClick={()=>setView(item.id)} aria-current={view===item.id?"page":undefined} className={`w-full rounded-lg px-3 py-2 text-left text-sm ${view===item.id?"bg-zinc-200 font-medium text-zinc-950 dark:bg-zinc-800 dark:text-white":"text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"}`}>{item.label}</button>)}</div></div>)}</nav></aside>
      <div className="min-w-0"><nav aria-label="Demo navigation" className="flex gap-1 overflow-x-auto border-b border-zinc-200 bg-white p-2 md:hidden dark:border-zinc-800 dark:bg-zinc-950">{demoNavigation.flatMap((group)=>group.items).map((item)=><button key={item.id} type="button" onClick={()=>setView(item.id)} aria-current={view===item.id?"page":undefined} className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium ${view===item.id?"bg-zinc-200 text-zinc-950 dark:bg-zinc-800 dark:text-white":"text-zinc-600 dark:text-zinc-400"}`}>{item.label}</button>)}</nav><div className="p-4 sm:p-6 lg:p-8"><div className="mb-4 flex items-center justify-between border-b border-zinc-200 pb-3 text-xs text-zinc-500 dark:border-zinc-800"><span>Demo Club <span className="mx-1">/</span> {pageTitle}</span><span>Administrator</span></div>{renderView()}<p className="mt-6 border-t border-zinc-200 pt-3 text-[11px] text-zinc-500 dark:border-zinc-800">Illustrative sample data. Demo actions do not write to an account or process payments.</p></div></div>
    </div>
  </div>;
}

const bookingSubject = "RallyLedger Product Demo Request";
const bookingBody = "Hello,\n\nI'm interested in seeing a RallyLedger demo for our racket sports club.\n\nClub name:\nNumber of participants:\nPreferred demo schedule:\n\nThank you.";
const mailto = `mailto:rovinocampoo@gmail.com?subject=${encodeURIComponent(bookingSubject)}&body=${encodeURIComponent(bookingBody.replaceAll("\n", "\r\n"))}`;

const capabilities = [
  { n: "01", title: "Participants", text: "Keep participant profiles, categories, contact details, and account history together." },
  { n: "02", title: "Sessions", text: "Organize attendance, court sessions, matches, training, and related club activity." },
  { n: "03", title: "Fees & payments", text: "Record charges and payments, review balances, and follow outstanding amounts." },
  { n: "04", title: "Products & sales", text: "Maintain a product list and record sales connected to participant accounts." },
  { n: "05", title: "Reports", text: "Review financial summaries and trends across your organization." },
];

function ForClubsPage() {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState("");
  const bookingDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = bookingDialogRef.current;
    if (!dialog) return;
    if (bookingOpen && !dialog.open) dialog.showModal();
    if (!bookingOpen && dialog.open) dialog.close();
  }, [bookingOpen]);

  async function copyBookingRequest() {
    const content = `To: rovinocampoo@gmail.com\nSubject: ${bookingSubject}\n\n${bookingBody}`;
    try {
      await navigator.clipboard.writeText(content);
      setCopyFeedback("Demo request copied. Paste it into your email app.");
    } catch {
      setCopyFeedback("Copy isn’t available here. Select and copy the email address and message below.");
    }
  }

  return (
    <main className="overflow-hidden bg-[#f1eee5] text-[#103f25] dark:bg-zinc-950 dark:text-zinc-100">
      <section className="relative border-b-2 border-[#103f25] dark:border-zinc-800">
        <div aria-hidden="true" className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#dfff28]/25 blur-3xl" />
        <div className="relative mx-auto grid w-[min(1180px,calc(100%-40px))] gap-10 py-16 lg:grid-cols-[1fr_.9fr] lg:items-center lg:py-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border-2 border-[#103f25] px-3 py-2 text-xs font-black uppercase tracking-widest dark:border-zinc-300"><span className="h-2.5 w-2.5 rounded-full bg-[#dfff28]" /> Built for racket sports</p>
            <h1 className="mt-6 max-w-3xl text-[clamp(44px,6.2vw,78px)] font-black leading-[.93] tracking-[-.065em]">Spend less time tracking payments. <span className="bg-[#dfff28] px-1 text-[#103f25]">Run your club.</span></h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#103f25]/75 dark:text-zinc-300">RallyLedger helps racket sports clubs organize participants, manage fees, track payments, record sales, and understand their finances in one place.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button type="button" onClick={() => { setCopyFeedback(""); setBookingOpen(true); }} className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-[#103f25] bg-[#103f25] px-5 font-bold text-white shadow-[4px_4px_0_#dfff28] transition hover:-translate-y-0.5 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950">Book a demo</button>
              <a href="#demo" className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-[#103f25] px-5 font-bold transition hover:bg-white/60 dark:border-zinc-300 dark:hover:bg-zinc-900">Explore the demo</a>
            </div>
            <p className="mt-4 text-xs text-[#103f25]/55 dark:text-zinc-500">A guided preview with fictional sample data. No account needed.</p>
          </div>

          <div className="rounded-[26px] border-2 border-[#103f25] bg-[#fffdf5] p-4 shadow-[8px_8px_0_#dfff28] dark:border-zinc-700 dark:bg-zinc-900 sm:p-6">
            <div className="flex items-center justify-between border-b border-[#103f25]/10 pb-4 dark:border-zinc-700"><div><p className="text-xs font-bold uppercase tracking-widest text-[#103f25]/50 dark:text-zinc-400">Club snapshot</p><h2 className="mt-1 text-xl font-black">A clearer view of the day</h2></div><span className="rounded-full bg-[#dfff28] px-3 py-1 text-xs font-bold text-[#103f25]">Sample</span></div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {[["Participants", "128"], ["Open balances", "₱8,450"], ["This month", "24 sessions"], ["Recorded sales", "₱12,600"]].map(([label, value]) => <div key={label} className="rounded-xl bg-[#f1eee5] p-4 dark:bg-zinc-800"><p className="text-xs text-[#103f25]/60 dark:text-zinc-400">{label}</p><p className="mt-2 text-xl font-black tabular-nums">{value}</p></div>)}
            </div>
            <div className="mt-3 flex items-center gap-3 rounded-xl border border-[#103f25]/10 p-4 dark:border-zinc-700"><div className="grid h-10 w-10 place-items-center rounded-full bg-[#dfff28] font-black">RL</div><div className="min-w-0 flex-1"><p className="font-bold">Weekend Open Play</p><p className="text-xs text-[#103f25]/60 dark:text-zinc-400">Saturday · 18 participants · Courts 1–3</p></div><span className="text-sm font-bold">Today</span></div>
            <p className="mt-3 text-[11px] text-[#103f25]/50 dark:text-zinc-500">Illustrative figures only — not customer or production data.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-[min(1180px,calc(100%-40px))] gap-10 py-16 md:grid-cols-2 md:py-20">
        <div><p className="text-xs font-black uppercase tracking-[.16em] text-[#103f25]/55 dark:text-zinc-400">The familiar admin tangle</p><h2 className="mt-3 text-4xl font-black leading-tight tracking-[-.05em]">Club operations shouldn’t live in five places.</h2></div>
        <div className="grid gap-3 sm:grid-cols-2">{["Attendance in one spreadsheet", "Payments in chat threads", "Manual balance checks", "Limited financial visibility"].map((item) => <div key={item} className="flex gap-3 rounded-xl border border-[#103f25]/15 bg-[#fffdf5]/60 p-4 dark:border-zinc-700 dark:bg-zinc-900"><span className="font-black text-[#9f8d37]">—</span><p className="font-semibold">{item}</p></div>)}</div>
      </section>

      <section className="bg-[#103f25] py-16 text-[#f1eee5] dark:bg-[#101b14] md:py-20">
        <div className="mx-auto grid w-[min(1180px,calc(100%-40px))] gap-8 md:grid-cols-[.8fr_1.2fr] md:items-end">
          <div><p className="text-xs font-black uppercase tracking-[.16em] text-[#dfff28]">One connected workspace</p><h2 className="mt-3 text-4xl font-black leading-tight tracking-[-.05em]">Keep the work around your club connected.</h2></div>
          <p className="max-w-2xl text-lg leading-8 text-white/75">RallyLedger brings participant records, sessions, club charges, payments, product sales, and financial reporting into one organization workspace. Follow activity from the court through to the ledger.</p>
        </div>
      </section>

      <section className="mx-auto w-[min(1180px,calc(100%-40px))] py-16 md:py-20">
        <div className="mb-8 max-w-2xl"><p className="text-xs font-black uppercase tracking-[.16em] text-[#103f25]/55 dark:text-zinc-400">What you can manage</p><h2 className="mt-3 text-4xl font-black tracking-[-.05em]">The everyday tools, in one place.</h2></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{capabilities.map((item) => <article key={item.n} className="rounded-2xl border border-[#103f25]/15 bg-[#fffdf5]/65 p-5 dark:border-zinc-700 dark:bg-zinc-900"><p className="text-xs font-black text-[#9f8d37]">{item.n}</p><h3 className="mt-5 text-xl font-black">{item.title}</h3><p className="mt-2 text-sm leading-6 text-[#103f25]/70 dark:text-zinc-400">{item.text}</p></article>)}</div>
      </section>

      <section id="demo" className="scroll-mt-8 border-y border-zinc-200 bg-zinc-100 py-14 dark:border-zinc-800 dark:bg-zinc-900/50 md:py-16">
        <div className="mx-auto w-[min(1180px,calc(100%-40px))]">
          <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Interactive product demo</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-950 dark:text-white md:text-4xl">Explore RallyLedger</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">Click through sample Players, Sessions, Balance, Sales, Products, and Financial Report screens. The layout follows the admin workspace; all records are fictional and read-only.</p>
            </div>
            <span className="w-fit rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">Demo · sample data only</span>
          </div>
          <DemoWorkspace />
        </div>
      </section>
      <section className="mx-auto grid w-[min(1180px,calc(100%-40px))] gap-8 py-16 md:grid-cols-2 md:py-20">
        <div><p className="text-xs font-black uppercase tracking-[.16em] text-[#103f25]/55 dark:text-zinc-400">Made for the people running play</p><h2 className="mt-3 text-4xl font-black tracking-[-.05em]">For clubs of different sizes and styles.</h2></div>
        <div className="grid gap-3">{[["Racket sports clubs","Coordinate recurring play, participant accounts, and club operations."],["Racket sports academies","Keep program participants, sessions, fees, and records connected."],["Independent organizers","Organize racket sports activities and the administration around them."]].map(([title,text])=><div key={title} className="flex gap-4 border-b border-[#103f25]/15 py-4 dark:border-zinc-800"><span className="mt-1 text-[#9f8d37]">◆</span><div><h3 className="font-black">{title}</h3><p className="mt-1 text-sm text-[#103f25]/65 dark:text-zinc-400">{text}</p></div></div>)}</div>
      </section>

      <section className="bg-[#dfff28] px-5 py-14 text-[#103f25] md:py-16"><div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center"><div><p className="text-xs font-black uppercase tracking-[.16em]">Early access</p><h2 className="mt-2 text-3xl font-black tracking-[-.04em] md:text-4xl">Explore whether RallyLedger fits your club.</h2><p className="mt-2 max-w-2xl text-[#103f25]/75">We’re inviting clubs to discuss an early access pilot and share what their day-to-day operations need.</p></div><button type="button" onClick={() => { setCopyFeedback(""); setBookingOpen(true); }} className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl border-2 border-[#103f25] bg-[#103f25] px-5 font-bold text-white transition hover:bg-[#174d30]">Discuss a pilot</button></div></section>

      <section className="px-5 py-16 text-center md:py-20"><p className="text-xs font-black uppercase tracking-[.16em] text-[#103f25]/55 dark:text-zinc-400">See it with your club in mind</p><h2 className="mx-auto mt-3 max-w-3xl text-4xl font-black tracking-[-.05em] md:text-5xl">Let’s walk through your club’s workflow.</h2><p className="mx-auto mt-4 max-w-xl text-[#103f25]/70 dark:text-zinc-400">Tell us a little about your club and we’ll arrange a product demo.</p><button type="button" onClick={() => { setCopyFeedback(""); setBookingOpen(true); }} className="mt-7 inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-[#103f25] bg-[#103f25] px-6 font-bold text-white shadow-[4px_4px_0_#dfff28] dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950">Book a demo</button></section>

      <dialog ref={bookingDialogRef} onClose={() => setBookingOpen(false)} aria-labelledby="booking-dialog-title" className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-zinc-200 bg-white p-5 text-zinc-900 shadow-2xl backdrop:bg-black/50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white sm:p-6">
          <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">RallyLedger demo</p><h2 id="booking-dialog-title" className="mt-1 text-2xl font-bold">Let’s set up a walkthrough</h2></div><button type="button" autoFocus onClick={() => setBookingOpen(false)} aria-label="Close booking options" className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">Close</button></div>
          <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">Choose how you’d like to send the inquiry. If your device has no email app configured, copy the prepared request and send it from any email service.</p>
          <div className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-700 dark:bg-zinc-950"><p><span className="font-semibold">To:</span> rovinocampoo@gmail.com</p><p className="mt-1"><span className="font-semibold">Subject:</span> {bookingSubject}</p><pre className="mt-3 whitespace-pre-wrap font-sans text-zinc-600 dark:text-zinc-300">{bookingBody}</pre></div>
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => void copyBookingRequest()} className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">Copy prepared inquiry</button><a href={mailto} onClick={() => setBookingOpen(false)} className="rounded-lg bg-[#103f25] px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-[#174d30]">Open email app</a></div>
          {copyFeedback && <p role="status" className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">{copyFeedback}</p>}
      </dialog>
    </main>
  );
}

export default ForClubsPage;
