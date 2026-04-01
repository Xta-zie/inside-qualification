"use client";

import {
  BarChart,
  XAxis,
  YAxis,
  Bar,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const INSIDE_BLUE = "#00548c";
const INSIDE_PINK = "#e31b58";

interface GapDataPoint {
  name: string;
  current: number;
  target: number;
  gap: number;
}

interface GapBarChartProps {
  data: GapDataPoint[];
}

export default function GapBarChart({ data }: GapBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-gray-400">
        Aucune donnée disponible
      </div>
    );
  }

  const maxTarget = Math.max(...data.map((d) => d.target), 4);

  return (
    <ResponsiveContainer width="100%" height={Math.max(300, data.length * 50)}>
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 8, right: 32, left: 16, bottom: 8 }}
      >
        <XAxis
          type="number"
          domain={[0, maxTarget]}
          tick={{ fill: "#6b7280", fontSize: 12 }}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={140}
          tick={{ fill: "#374151", fontSize: 12 }}
        />
        <Tooltip
          formatter={(value: number, name: string) => [
            value,
            name === "current" ? "Niveau actuel" : "Écart",
          ]}
          contentStyle={{ fontSize: 12 }}
        />
        <Legend
          formatter={(value: string) =>
            value === "current" ? "Niveau actuel" : "Écart"
          }
          wrapperStyle={{ fontSize: 12 }}
        />
        <Bar dataKey="current" stackId="a" name="current" barSize={20}>
          {data.map((_, index) => (
            <Cell key={`current-${index}`} fill={INSIDE_BLUE} />
          ))}
        </Bar>
        <Bar dataKey="gap" stackId="a" name="gap" barSize={20}>
          {data.map((_, index) => (
            <Cell key={`gap-${index}`} fill={INSIDE_PINK} opacity={0.7} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
