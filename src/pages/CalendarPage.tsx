import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import classicThemePlugin from "@fullcalendar/react/themes/classic";

import "@fullcalendar/react/skeleton.css";
import "@fullcalendar/react/themes/classic/theme.css";
import "@fullcalendar/react/themes/classic/palette.css";

import { getSessions } from "../api/sessions";
import { getSessionMatches } from "../api/matches";

import type { Session } from "../types/session";
import type { Match } from "../types/match";
import { getParticipants } from "../api/participants";
import { getMatchParticipants } from "../api/matchParticipants";

type CalendarPageProps = {
  onSessionSelected: (session: Session) => void;
  onMatchSelected: (match: Match) => void;
};

type CalendarMatch = {
  match: Match;
  teamA: string[];
  teamB: string[];
};

type CalendarData = {
  session: Session;
  matches: CalendarMatch[];
};

function formatSessionType(type: Session["sessionType"]) {
  switch (type) {
    case "TRAINING":
      return "Training";
    case "OUTSIDER_PLAY":
      return "Outsider";
    case "EVENT":
      return "Event";
    default:
      return "Regular Play";
  }
}

function getSessionClass(type: Session["sessionType"]) {
  switch (type) {
    case "TRAINING":
      return "rl-calendar-training";
    case "OUTSIDER_PLAY":
      return "rl-calendar-outsider";
    case "EVENT":
      return "rl-calendar-event";
    default:
      return "rl-calendar-regular";
  }
}

function addMinutesToTime(time: string, minutesToAdd: number) {
  const [hours, minutes] = time.split(":").map(Number);

  const totalMinutes = hours * 60 + minutes + minutesToAdd;

  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMinutes = totalMinutes % 60;

  return `${String(newHours).padStart(2, "0")}:${String(newMinutes).padStart(
    2,
    "0",
  )}:00`;
}

function CalendarPage({
  onSessionSelected,
  onMatchSelected,
}: CalendarPageProps) {
  const [calendarData, setCalendarData] = useState<CalendarData[]>([]);
  const [calendarView, setCalendarView] = useState("dayGridMonth");
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.classList.contains("dark"),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    let cancelled = false;

    async function loadCalendar() {
      try {
        setLoading(true);
        setError(null);

        const sessions = await getSessions();
        const participants = await getParticipants();

        const participantById = new Map(
          participants.map((participant) => [
            participant.id,
            participant.nickname,
          ]),
        );

        const results = await Promise.all(
          sessions.map(async (session) => {
            try {
              const matches = await getSessionMatches(session.id);

              const matchesWithParticipants = await Promise.all(
                matches.map(async (match) => {
                  const matchParticipants = await getMatchParticipants(
                    match.id,
                  );

                  const teamA = matchParticipants
                    .filter((participant) => participant.teamSide === "A")
                    .map((participant) =>
                      participantById.get(participant.participantId),
                    )
                    .filter((nickname): nickname is string =>
                      Boolean(nickname),
                    );

                  const teamB = matchParticipants
                    .filter((participant) => participant.teamSide === "B")
                    .map((participant) =>
                      participantById.get(participant.participantId),
                    )
                    .filter((nickname): nickname is string =>
                      Boolean(nickname),
                    );

                  return {
                    match,
                    teamA,
                    teamB,
                  };
                }),
              );

              return {
                session,
                matches: matchesWithParticipants,
              };
            } catch (err) {
              console.error(
                `Failed to load matches for session ${session.id}`,
                err,
              );

              return {
                session,
                matches: [],
              };
            }
          }),
        );

        if (!cancelled) {
          setCalendarData(results);
        }
      } catch (err) {
        console.error(err);

        if (!cancelled) {
          setError("Failed to load calendar.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadCalendar();

    return () => {
      cancelled = true;
    };
  }, []);
  const totalSessions = calendarData.length;
  const totalMatches = calendarData.reduce(
    (total, item) => total + item.matches.length,
    0,
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500">Loading calendar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Club Schedule
          </p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
            Calendar
          </h1>

          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Sessions and matches in one view.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex">
          <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Sessions
            </p>
            <p className="mt-1 text-lg font-semibold text-zinc-950 dark:text-white">
              {totalSessions}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Matches
            </p>
            <p className="mt-1 text-lg font-semibold text-zinc-950 dark:text-white">
              {totalMatches}
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-200 px-4 py-4 dark:border-zinc-800 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-zinc-950 dark:text-white">
                Schedule
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">
                Click a session or match to open it.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-zinc-800 dark:bg-zinc-300" />
                Regular
              </span>

              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-zinc-500" />
                Training
              </span>

              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-zinc-400" />
                Other
              </span>
            </div>
          </div>
        </div>

        <div className="p-3 sm:p-5">
          <FullCalendar
            plugins={[classicThemePlugin, dayGridPlugin, timeGridPlugin]}
            initialView="dayGridMonth"
            colorScheme={isDarkMode ? "dark" : "light"}
            headerToolbar={{
              start: "prev,next",
              center: "title",
              end: "today dayGridMonth,timeGridWeek,timeGridDay",
            }}
            buttons={{
              today: { text: "Today" },
              dayGridMonth: { text: "Month" },
              timeGridWeek: { text: "Week" },
              timeGridDay: { text: "Day" },
            }}
            events={(_, successCallback) => {
              const showMatches =
                calendarView === "timeGridWeek" ||
                calendarView === "timeGridDay";

              const calendarEvents = calendarData.flatMap(
                ({ session, matches }) => {
                  const sessionEvent = {
                    id: `session-${session.id}`,
                    title: session.name,
                    start: `${session.sessionDate}T${session.startTime}`,
                    end: `${session.sessionDate}T${session.endTime}`,
                    className: `rl-calendar-session ${getSessionClass(session.sessionType)}`,
                    extendedProps: {
                      kind: "session",
                      session,
                      matches,
                    },
                  };

                  if (!showMatches) {
                    return [sessionEvent];
                  }
                  const matchEvents = matches.map((matchData, index) => {
                    const matchNumber = matches.length - index;
                    const chronologicalIndex = matchNumber - 1;

                    const slotIndex = Math.floor(chronologicalIndex / 2);
                    const startOffset = slotIndex * 30;

                    const matchStart = addMinutesToTime(
                      session.startTime,
                      startOffset,
                    );

                    const matchEnd = addMinutesToTime(
                      session.startTime,
                      startOffset + 30,
                    );

                    return {
                      id: `match-${matchData.match.id}`,
                      title: `Match ${matchNumber}`,
                      start: `${session.sessionDate}T${matchStart}`,
                      end: `${session.sessionDate}T${matchEnd}`,
                      className: "rl-calendar-match",
                      extendedProps: {
                        kind: "match",
                        match: matchData.match,
                        session,
                        teamA: matchData.teamA,
                        teamB: matchData.teamB,
                      },
                    };
                  });

                  return [sessionEvent, ...matchEvents];
                },
              );

              successCallback(calendarEvents);
            }}
            datesSet={(info) => {
              setCalendarView(info.view.type);
            }}
            nowIndicator
            allDaySlot={false}
            dayMaxEvents={4}
            height="auto"
            slotMinTime="05:00:00"
            slotMaxTime="23:00:00"
            scrollTime="06:00:00"
            eventClick={(info) => {
              const kind = info.event.extendedProps.kind;

              if (kind === "match") {
                const match = info.event.extendedProps.match as Match;
                onMatchSelected(match);
                return;
              }

              const session = info.event.extendedProps.session as Session;
              onSessionSelected(session);
            }}
            eventContent={(info) => {
              const kind = info.event.extendedProps.kind;

              if (kind === "match") {
                const teamA = info.event.extendedProps.teamA as string[];
                const teamB = info.event.extendedProps.teamB as string[];

                return (
                  <div className="rl-calendar-match-content">
                    <span className="rl-calendar-match-dot" />

                    <div className="min-w-0">
                      <div className="font-semibold">{info.event.title}</div>

                      <div className="truncate text-[9px] opacity-70">
                        {teamA.join(" / ")} vs {teamB.join(" / ")}
                      </div>
                    </div>
                  </div>
                );
              }

              const session = info.event.extendedProps.session as Session;

              return (
                <div className="rl-calendar-session-content">
                  <div className="rl-calendar-session-top">
                    <span className="rl-calendar-time">
                      {session.startTime}
                    </span>

                    <span className="rl-calendar-session-name">
                      {session.name}
                    </span>
                  </div>

                  <div className="rl-calendar-session-type">
                    {formatSessionType(session.sessionType)}
                  </div>
                </div>
              );
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default CalendarPage;
