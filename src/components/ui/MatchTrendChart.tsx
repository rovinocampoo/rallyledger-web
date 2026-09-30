import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MatchTrendPoint } from "../../types/report";

type MatchTrendChartProps = {
  data: MatchTrendPoint[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function MatchTrendChart({ data }: MatchTrendChartProps) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No matches recorded for this period.
      </p>
    );
  }

  return (
    <div className="h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-zinc-200 dark:stroke-zinc-800"
          />

          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            className="fill-zinc-400"
          />

          <YAxis allowDecimals={false} className="fill-zinc-400" />

          <Tooltip
            labelFormatter={(value) => formatDate(String(value))}
            formatter={(value) => [value, "Matches"]}
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

          <Line
            type="monotone"
            dataKey="matchCount"
            name="Matches"
            stroke="#7f8f00"
            strokeWidth={3}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default MatchTrendChart;
