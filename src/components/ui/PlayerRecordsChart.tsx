import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PlayerRecord } from "../../types/record";

type PlayerRecordsChartProps = {
  data: PlayerRecord[];
};

function PlayerRecordsChart({ data }: PlayerRecordsChartProps) {
  const chartData = [...data]
    .filter((player) => player.overallMatches > 0)
    .sort((a, b) => b.overallMatches - a.overallMatches)
    .slice(0, 8)
    .map((player) => ({
      name: player.nickname || player.fullName,
      matches: player.overallMatches,
      wins: player.overallWins,
      losses: player.overallLosses,
      draws: player.overallDraws,
    }));

  if (chartData.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No completed matches recorded for this period.
      </p>
    );
  }

  return (
    <div className="h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 8, right: 16, left: 16, bottom: 8 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-zinc-200 dark:stroke-zinc-800"
          />

          <XAxis
            type="number"
            allowDecimals={false}
            className="fill-zinc-400"
          />

          <YAxis
            type="category"
            dataKey="name"
            width={120}
            className="fill-zinc-400"
          />

          <Tooltip
            formatter={(value, name) => [value, String(name)]}
            contentStyle={{
              backgroundColor: "var(--report-tooltip-bg)",
              border: "1px solid var(--report-tooltip-border)",
              borderRadius: "8px",
              color: "var(--report-tooltip-text)",
            }}
            labelStyle={{
              color: "var(--report-tooltip-text)",
              fontWeight: 600,
            }}
            itemStyle={{
              color: "var(--report-tooltip-text)",
            }}
          />

          <Bar
            dataKey="matches"
            name="Matches"
            fill="#355e3b"
            radius={[0, 4, 4, 0]}
          />

          <Bar
            dataKey="wins"
            name="Wins"
            fill="#7f8f00"
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default PlayerRecordsChart;
