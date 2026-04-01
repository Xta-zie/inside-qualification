"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const INSIDE_CYAN = "#6bebf4";
const INSIDE_PINK = "#e31b58";
const GRAY_200 = "#e5e7eb";

interface ScoreGaugeProps {
  score: number;
  label?: string;
  size?: "sm" | "md" | "lg";
}

const SIZE_CONFIG = {
  sm: { height: 140, innerRadius: 40, outerRadius: 55, fontSize: 20 },
  md: { height: 200, innerRadius: 60, outerRadius: 80, fontSize: 28 },
  lg: { height: 280, innerRadius: 85, outerRadius: 110, fontSize: 36 },
} as const;

export default function ScoreGauge({
  score,
  label,
  size = "md",
}: ScoreGaugeProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const config = SIZE_CONFIG[size];

  const gaugeData = [
    { name: "score", value: clamped },
    { name: "remaining", value: 100 - clamped },
  ];

  return (
    <div className="flex flex-col items-center">
      <div style={{ width: "100%", height: config.height, position: "relative" }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={gaugeData}
              cx="50%"
              cy="60%"
              startAngle={210}
              endAngle={-30}
              innerRadius={config.innerRadius}
              outerRadius={config.outerRadius}
              paddingAngle={0}
              dataKey="value"
              stroke="none"
            >
              <Cell fill={INSIDE_CYAN} />
              <Cell fill={GRAY_200} />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ paddingTop: config.height * 0.1 }}
        >
          <span
            style={{
              fontFamily: "var(--font-bebas)",
              fontSize: config.fontSize,
              color: INSIDE_PINK,
              lineHeight: 1,
            }}
          >
            {Math.round(clamped)}%
          </span>
        </div>
      </div>
      {label && (
        <span className="mt-1 text-center text-sm text-gray-600">{label}</span>
      )}
    </div>
  );
}
