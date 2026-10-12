import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  GitBranch,
  MapPin,
  Plus,
  Search,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";

import type { AdminUser } from "../api/auth";
import { createTournament, getTournaments } from "../api/tournaments";
import type {
  CreateTournamentInput,
  Tournament,
  TournamentStatus,
} from "../types/tournament";

type TournamentsPageProps = {
  admin: AdminUser;
};

type StatusFilter = "ALL" | TournamentStatus;

const statusOptions: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "All tournaments" },
  { value: "DRAFT", label: "Draft" },
  { value: "REGISTRATION_OPEN", label: "Registration open" },
  { value: "REGISTRATION_CLOSED", label: "Registration closed" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const statusStyles: Record<TournamentStatus, string> = {
  DRAFT:
    "border-zinc-200 bg-zinc-100 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  REGISTRATION_OPEN:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300",
  REGISTRATION_CLOSED:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
  IN_PROGRESS:
    "border-lime-300 bg-lime-100 text-lime-950 dark:border-lime-800 dark:bg-lime-950/50 dark:text-lime-300",
  COMPLETED:
    "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950/50 dark:text-sky-300",
  CANCELLED:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300",
};

function formatDate(date: string): string {
  if (!date) return "Date to be announced";

  const parsed = new Date(`${date.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;

  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

function formatDateRange(startDate: string, endDate: string): string {
  if (!startDate && !endDate) return "Dates to be announced";
  if (!startDate) return `Until ${formatDate(endDate)}`;
  if (!endDate) return `From ${formatDate(startDate)}`;
  if (startDate === endDate) return formatDate(startDate);

  const start = new Date(`${startDate.slice(0, 10)}T12:00:00`);
  const end = new Date(`${endDate.slice(0, 10)}T12:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return `${startDate} – ${endDate}`;
  }

  const sameYear = start.getFullYear() === end.getFullYear();

  if (sameYear && start.getMonth() === end.getMonth()) {
    const month = new Intl.DateTimeFormat("en-PH", {
      month: "short",
    }).format(start);

    return `${month} ${start.getDate()}–${end.getDate()}, ${start.getFullYear()}`;
  }

  if (sameYear) {
    const startLabel = new Intl.DateTimeFormat("en-PH", {
      month: "short",
      day: "numeric",
    }).format(start);
    const endLabel = new Intl.DateTimeFormat("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(end);

    return `${startLabel} – ${endLabel}`;
  }

  return `${formatDate(startDate)} – ${formatDate(endDate)}`;
}

function statusLabel(status: TournamentStatus): string {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/^./, (char) => char.toUpperCase());
}

function isActive(status: TournamentStatus): boolean {
  return (
    status === "REGISTRATION_OPEN" ||
    status === "REGISTRATION_CLOSED" ||
    status === "IN_PROGRESS"
  );
}

function TournamentStatusBadge({ status }: { status: TournamentStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide ${statusStyles[status]}`}
    >
      {status === "IN_PROGRESS" && (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
      )}
      {statusLabel(status)}
    </span>
  );
}

function TournamentCard({
  tournament,
  featured = false,
}: {
  tournament: Tournament;
  featured?: boolean;
}) {
  return (
    <Link
      to={`/tournaments/${tournament.id}`}
      aria-label={`Open ${tournament.name}`}
      className="block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
    >
      <article
        className={`h-full group relative overflow-hidden rounded-2xl border transition duration-300 hover:-translate-y-0.5 hover:shadow-xl ${
          featured
            ? "border-[#254C36] bg-[#14251B] text-white shadow-lg shadow-emerald-950/10"
            : "border-zinc-200 bg-white text-zinc-950 shadow-sm hover:border-emerald-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:hover:border-emerald-900"
        }`}
      >
        {featured && (
          <>
            <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border border-lime-300/10" />
            <div className="pointer-events-none absolute -right-4 -top-12 h-44 w-44 rounded-full border border-lime-300/10" />
            <div className="pointer-events-none absolute right-8 top-8 h-24 w-24 rounded-full bg-lime-300/5 blur-2xl" />
          </>
        )}

        <div className="relative p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                featured
                  ? "border border-lime-300/20 bg-lime-300/10 text-lime-300"
                  : "border border-emerald-100 bg-emerald-50 text-emerald-900 dark:border-emerald-900/70 dark:bg-emerald-950/60 dark:text-emerald-300"
              }`}
            >
              <Trophy className="h-5 w-5" />
            </div>

            <TournamentStatusBadge status={tournament.status} />
          </div>

          <div className="mt-5">
            {featured && (
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-lime-300">
                Featured event
              </p>
            )}

            <h3 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {tournament.name}
            </h3>

            <p
              className={`mt-2 line-clamp-2 min-h-10 text-sm leading-5 ${
                featured ? "text-zinc-300" : "text-zinc-500 dark:text-zinc-400"
              }`}
            >
              {tournament.description || "A new chapter starts on court."}
            </p>
          </div>

          <div
            className={`mt-5 space-y-3 border-t pt-4 text-sm ${
              featured
                ? "border-white/10 text-zinc-300"
                : "border-zinc-100 text-zinc-600 dark:border-zinc-800 dark:text-zinc-400"
            }`}
          >
            <div className="flex items-start gap-2.5">
              <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-lime-500" />
              <span>
                {formatDateRange(tournament.startDate, tournament.endDate)}
              </span>
            </div>

            <div className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-lime-500" />
              <span className="min-w-0 break-words">
                {tournament.venue || "Venue to be announced"}
              </span>
            </div>

            <div className="flex items-start gap-2.5">
              <GitBranch className="mt-0.5 h-4 w-4 shrink-0 text-lime-500" />
              <span>Single elimination · Draw setup available next</span>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <p
              className={`text-xs ${
                featured ? "text-zinc-400" : "text-zinc-400 dark:text-zinc-500"
              }`}
            >
              Tournament #{tournament.id}
            </p>

            <span
              className={`inline-flex items-center gap-2 text-sm font-semibold transition-transform group-hover:translate-x-0.5 ${
                featured
                  ? "text-lime-300"
                  : "text-emerald-800 dark:text-emerald-300"
              }`}
            >
              View details <ArrowUpRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

const initialForm: CreateTournamentInput = {
  name: "",
  description: "",
  venue: "",
  startDate: "",
  endDate: "",
  status: "DRAFT",
};

function TournamentsPage({ admin }: TournamentsPageProps) {
  const canManage = admin.role === "OWNER" || admin.role === "ADMIN";

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CreateTournamentInput>(initialForm);

  async function loadTournaments() {
    setLoadError(null);

    try {
      const items = await getTournaments();
      setTournaments(items);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Couldn't load tournaments.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const items = await getTournaments();
        if (!ignore) setTournaments(items);
      } catch (err) {
        if (!ignore) {
          setLoadError(
            err instanceof Error ? err.message : "Couldn't load tournaments.",
          );
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void load();

    return () => {
      ignore = true;
    };
  }, []);

  const filteredTournaments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return [...tournaments]
      .filter((item) =>
        statusFilter === "ALL" ? true : item.status === statusFilter,
      )
      .filter((item) => {
        if (!normalizedQuery) return true;

        return [
          item.name,
          item.description,
          item.venue,
          statusLabel(item.status),
        ].some((value) => value.toLowerCase().includes(normalizedQuery));
      })
      .sort((a, b) => {
        if (a.startDate && b.startDate) {
          return a.startDate.localeCompare(b.startDate);
        }
        if (a.startDate) return -1;
        if (b.startDate) return 1;
        return b.id - a.id;
      });
  }, [tournaments, query, statusFilter]);

  const featuredTournament = useMemo(
    () =>
      tournaments.find((item) => isActive(item.status)) ??
      tournaments.find((item) => item.status === "DRAFT") ??
      tournaments.find((item) => item.status !== "CANCELLED") ??
      null,
    [tournaments],
  );

  const activeCount = tournaments.filter((item) =>
    isActive(item.status),
  ).length;
  const completedCount = tournaments.filter(
    (item) => item.status === "COMPLETED",
  ).length;

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionError(null);

    if (form.endDate && form.startDate && form.endDate < form.startDate) {
      setActionError("The end date cannot be before the start date.");
      return;
    }

    setSaving(true);

    try {
      const created = await createTournament(form);
      setTournaments((current) => [created, ...current]);
      setForm(initialForm);
      setCreateOpen(false);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Couldn't create the tournament.",
      );
    } finally {
      setSaving(false);
    }
  }

  function updateForm<K extends keyof CreateTournamentInput>(
    field: K,
    value: CreateTournamentInput[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  const inputClass =
    "mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:focus:border-lime-400 dark:focus:ring-lime-400/10";

  return (
    <div className="mx-auto w-full max-w-[1440px] pb-8">
      {/* Page header */}
      <header className="mb-7 flex flex-col gap-4 sm:mb-9 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.13em] text-emerald-900 dark:border-emerald-900/70 dark:bg-emerald-950/50 dark:text-emerald-300">
            <Sparkles className="h-3.5 w-3.5 text-lime-600 dark:text-lime-300" />
            Competition management
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
            Tournaments
            <span className="text-lime-600 dark:text-lime-400">.</span>
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 dark:text-zinc-400 sm:text-base">
            Set the stage, bring players together, and let every match move the
            draw forward.
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={() => {
              setActionError(null);
              setCreateOpen(true);
            }}
            className="primary-action inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Create tournament
          </button>
        )}
      </header>

      {/* Summary strip */}
      <section className="mb-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-300">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Total tournaments
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
              {loading ? "—" : tournaments.length}
            </p>
          </div>
          <div className="ml-auto text-zinc-300 dark:text-zinc-700">
            <ArrowUpRight className="h-5 w-5" />
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-lime-100 text-emerald-950 dark:bg-lime-300/15 dark:text-lime-300">
            <Clock3 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Active events
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
              {loading ? "—" : activeCount}
            </p>
          </div>
          <div className="ml-auto text-zinc-300 dark:text-zinc-700">
            <ArrowDownRight className="h-5 w-5" />
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300">
            <Check className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Completed
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
              {loading ? "—" : completedCount}
            </p>
          </div>
          <div className="ml-auto text-zinc-300 dark:text-zinc-700">
            <Trophy className="h-5 w-5" />
          </div>
        </div>
      </section>

      {/* Featured tournament banner */}
      {!loading && featuredTournament && (
        <section className="relative mb-8 overflow-hidden rounded-2xl bg-[#14251B] text-white shadow-xl shadow-emerald-950/10 dark:border dark:border-emerald-900/60">
          <div className="pointer-events-none absolute -right-10 -top-24 h-72 w-72 rounded-full border border-lime-300/10 sm:right-12 sm:top-[-9rem]" />
          <div className="pointer-events-none absolute right-8 top-0 h-56 w-56 rounded-full border border-lime-300/10 sm:right-48" />
          <div className="pointer-events-none absolute right-24 top-10 h-32 w-32 rounded-full bg-lime-300/10 blur-3xl" />

          <div className="relative grid gap-6 p-5 sm:p-7 md:grid-cols-[1fr_auto] md:items-center md:p-9">
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-lime-300/25 bg-lime-300/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-lime-300">
                  <Sparkles className="h-3 w-3" /> In the spotlight
                </span>
                <TournamentStatusBadge status={featuredTournament.status} />
              </div>

              <h2 className="max-w-2xl text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
                {featuredTournament.name}
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-300">
                {featuredTournament.description ||
                  "Your next tournament starts here. Set up the draw, register entries, and get ready to compete."}
              </p>

              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3 text-xs text-zinc-300 sm:text-sm">
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-lime-300" />
                  {formatDateRange(
                    featuredTournament.startDate,
                    featuredTournament.endDate,
                  )}
                </span>
                <span className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-lime-300" />
                  {featuredTournament.venue || "Venue TBA"}
                </span>
              </div>
            </div>

            <div className="relative flex items-center justify-start md:justify-end">
              <div className="hidden h-28 w-28 items-center justify-center rounded-full border border-lime-300/20 bg-white/[0.03] md:flex">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border border-lime-300/30 bg-lime-300/10">
                  <GitBranch className="h-9 w-9 text-lime-300" />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Search and filters */}
      <section className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-zinc-950 dark:text-white">
            All tournaments
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Browse events and manage upcoming competition.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="relative block sm:w-64">
            <span className="sr-only">Search tournaments</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search events..."
              className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-lime-400"
            />
          </label>

          <label className="relative block sm:w-52">
            <span className="sr-only">Filter by status</span>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
              className="w-full appearance-none rounded-xl border border-zinc-200 bg-white py-2.5 pl-3 pr-9 text-sm text-zinc-700 outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:focus:border-lime-400"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          </label>
        </div>
      </section>

      {loadError && (
        <div
          role="alert"
          className="mb-5 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300 sm:flex-row sm:items-center sm:justify-between"
        >
          <span>{loadError}</span>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              void loadTournaments();
            }}
            className="font-semibold underline underline-offset-4"
          >
            Try again
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="animate-pulse rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="h-11 w-11 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
              <div className="mt-5 h-5 w-2/3 rounded bg-zinc-100 dark:bg-zinc-800" />
              <div className="mt-3 h-4 w-full rounded bg-zinc-100 dark:bg-zinc-800" />
              <div className="mt-2 h-4 w-4/5 rounded bg-zinc-100 dark:bg-zinc-800" />
              <div className="mt-8 h-px bg-zinc-100 dark:bg-zinc-800" />
              <div className="mt-5 h-4 w-1/2 rounded bg-zinc-100 dark:bg-zinc-800" />
            </div>
          ))}
        </div>
      ) : filteredTournaments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-5 py-14 text-center dark:border-zinc-700 dark:bg-zinc-900/60 sm:py-20">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-lime-300">
            {query || statusFilter !== "ALL" ? (
              <Search className="h-6 w-6" />
            ) : (
              <Trophy className="h-6 w-6" />
            )}
          </div>

          <h3 className="mt-5 text-lg font-semibold text-zinc-950 dark:text-white">
            {query || statusFilter !== "ALL"
              ? "No matching tournaments"
              : "Your next tournament starts here"}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500 dark:text-zinc-400">
            {query || statusFilter !== "ALL"
              ? "Try another search or choose a different status filter."
              : "Create an event, choose its dates and venue, then start organizing divisions and player entries."}
          </p>

          {canManage && !query && statusFilter === "ALL" && (
            <button
              type="button"
              onClick={() => {
                setActionError(null);
                setCreateOpen(true);
              }}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#183E2A] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#215437] active:scale-[0.98] dark:bg-lime-300 dark:text-[#15251A] dark:hover:bg-lime-200"
            >
              <Plus className="h-4 w-4" /> Create your first tournament
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredTournaments.map((tournament) => (
            <TournamentCard
              key={tournament.id}
              tournament={tournament}
              featured={featuredTournament?.id === tournament.id}
            />
          ))}
        </div>
      )}

      {!loading && tournaments.length > 0 && (
        <p className="mt-5 text-xs text-zinc-400 dark:text-zinc-500">
          Showing {filteredTournaments.length} of {tournaments.length}{" "}
          tournaments
        </p>
      )}

      {/* Create tournament dialog */}
      {createOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-zinc-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setCreateOpen(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-tournament-title"
            className="max-h-[94dvh] w-full overflow-y-auto rounded-t-3xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 sm:max-w-2xl sm:rounded-2xl"
          >
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-zinc-100 bg-white/95 p-5 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-900 dark:bg-lime-300/10 dark:text-lime-300">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <h2
                    id="create-tournament-title"
                    className="text-lg font-bold tracking-tight text-zinc-950 dark:text-white sm:text-xl"
                  >
                    Create tournament
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    Start with the event essentials. You can configure divisions
                    next.
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={() => setCreateOpen(false)}
                aria-label="Close dialog"
                className="rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-950 disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 sm:p-6">
              {actionError && (
                <div
                  role="alert"
                  className="mb-5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
                >
                  {actionError}
                </div>
              )}

              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    Tournament name <span className="text-red-500">*</span>
                  </span>
                  <input
                    autoFocus
                    required
                    maxLength={160}
                    value={form.name}
                    onChange={(event) => updateForm("name", event.target.value)}
                    placeholder="e.g. MMSU Open 2026"
                    className={inputClass}
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                      Start date
                    </span>
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={(event) =>
                        updateForm("startDate", event.target.value)
                      }
                      className={inputClass}
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                      End date
                    </span>
                    <input
                      type="date"
                      min={form.startDate || undefined}
                      value={form.endDate}
                      onChange={(event) =>
                        updateForm("endDate", event.target.value)
                      }
                      className={inputClass}
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    Venue
                  </span>
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <input
                      value={form.venue}
                      onChange={(event) =>
                        updateForm("venue", event.target.value)
                      }
                      placeholder="e.g. MMSU Tennis Courts"
                      className={`${inputClass} pl-9`}
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    Description{" "}
                    <span className="font-normal text-zinc-400">
                      (optional)
                    </span>
                  </span>
                  <textarea
                    rows={3}
                    maxLength={2000}
                    value={form.description}
                    onChange={(event) =>
                      updateForm("description", event.target.value)
                    }
                    placeholder="What is this tournament about?"
                    className={`${inputClass} resize-y`}
                  />
                </label>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 border-t border-zinc-100 pt-5 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-5 text-zinc-400 dark:text-zinc-500">
                  The tournament will be saved as a draft.
                </p>

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setCreateOpen(false)}
                    className="flex-1 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 sm:flex-none"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#183E2A] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#215437] focus:outline-none focus:ring-4 focus:ring-emerald-700/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-lime-300 dark:text-[#15251A] dark:hover:bg-lime-200 sm:flex-none"
                  >
                    {saving ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white dark:border-emerald-950/30 dark:border-t-emerald-950" />
                        Creating...
                      </>
                    ) : (
                      <>
                        Create tournament <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default TournamentsPage;
