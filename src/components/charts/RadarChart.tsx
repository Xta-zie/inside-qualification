"use client";

import {
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
} from "recharts";

const INSIDE_BLUE = "#00548c";
const INSIDE_PINK = "#e31b58";

interface RadarDataPoint {
  subject: string;
  current: number;
  target: number;
}

interface RadarChartProps {
  data: RadarDataPoint[];
  maxValue?: number;
}

export default function RadarChart({ data, maxValue = 4 }: RadarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-gray-400">
        Aucune donnée disponible
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <RechartsRadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fill: "#374151", fontSize: 12 }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, maxValue]}
          tick={{ fill: "#9ca3af", fontSize: 10 }}
          tickCount={maxValue + 1}
        />
        <Radar
          name="Niveau actuel"
          dataKey="current"
          stroke={INSIDE_BLUE}
          fill={INSIDE_BLUE}
          fillOpacity={0.6}
        />
        <Radar
          name="Cible"
          dataKey="target"
          stroke={INSIDE_PINK}
          fill={INSIDE_PINK}
          fillOpacity={0.3}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 16 }}
        />
      </RechartsRadarChart>
    </ResponsiveContainer>
  );
}
