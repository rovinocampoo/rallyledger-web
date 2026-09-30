import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PaymentMethodSummary } from "../../types/report";
import { formatCurrency, formatLabel } from "../../utils/format";

type PaymentMethodChartProps = {
  data: PaymentMethodSummary[];
};

function PaymentMethodChart({ data }: PaymentMethodChartProps) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No payments recorded for this period.
      </p>
    );
  }

  const chartData = data.map((item) => ({
    name: formatLabel(item.paymentMethod),
    amount: item.totalAmount,
  }));

  return (
    <div className="h-[280px]">
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
            tickFormatter={(value) => formatCurrency(Number(value))}
            className="fill-zinc-400"
          />

          <YAxis
            type="category"
            dataKey="name"
            width={110}
            className="fill-zinc-400"
          />

          <Tooltip
            formatter={(value) => [formatCurrency(Number(value)), "Collected"]}
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
            dataKey="amount"
            name="Collected"
            fill="#355e3b"
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default PaymentMethodChart;
