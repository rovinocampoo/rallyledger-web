import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { FinancialTrendPoint } from "../../types/report";
import { formatCurrency } from "../../utils/format";

type FinancialTrendChartProps = {
  data: FinancialTrendPoint[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function FinancialTrendChart({ data }: FinancialTrendChartProps) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No financial activity recorded for this period.
      </p>
    );
  }

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-zinc-200 dark:stroke-zinc-800"
          />

          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            className="fill-zinc-400"
          />

          <YAxis
            tickFormatter={(value) => formatCurrency(Number(value))}
            className="fill-zinc-400"
            width={80}
          />

          <Tooltip
            labelFormatter={(value) => formatDate(String(value))}
            formatter={(value, name) => [
              formatCurrency(Number(value)),
              String(name),
            ]}
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

          <Legend />

          <Line
            type="monotone"
            dataKey="charges"
            name="Charges"
            stroke="#7f8f00"
            strokeWidth={2}
            dot={false}
          />

          <Line
            type="monotone"
            dataKey="payments"
            name="Payments"
            stroke="#166534"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default FinancialTrendChart;
