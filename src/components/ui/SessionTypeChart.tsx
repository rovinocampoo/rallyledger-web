import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SessionTypeSummary } from "../../types/report";
import { formatLabel } from "../../utils/format";

type SessionTypeChartProps = {
  data: SessionTypeSummary[];
};

function SessionTypeChart({ data }: SessionTypeChartProps) {
  const chartData = data.map((item) => ({
    name: formatLabel(item.sessionType),
    sessions: item.sessionCount,
  }));

  if (chartData.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No sessions recorded for this period.
      </p>
    );
  }

  return (
    <div className="h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-zinc-200 dark:stroke-zinc-800"
          />

          <XAxis dataKey="name" className="fill-zinc-400" />

          <YAxis allowDecimals={false} className="fill-zinc-400" />

          <Tooltip
            formatter={(value) => [value, "Sessions"]}
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
            dataKey="sessions"
            name="Sessions"
            fill="#355e3b"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default SessionTypeChart;
