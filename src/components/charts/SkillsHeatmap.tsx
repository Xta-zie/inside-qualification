"use client";

const INSIDE_BLUE = "#00548c";

const LEVEL_COLORS: Record<number, string> = {
  0: "#f3f4f6", // gray-100
  1: "#fef08a", // yellow-200
  2: "#facc15", // yellow-400
  3: "#67e8f9", // cyan-300
  4: INSIDE_BLUE,
};

const LEVEL_TEXT_COLORS: Record<number, string> = {
  0: "#9ca3af",
  1: "#713f12",
  2: "#713f12",
  3: "#164e63",
  4: "#ffffff",
};

function getCellColor(value: number): string {
  if (value <= 0) return LEVEL_COLORS[0];
  if (value >= 4) return LEVEL_COLORS[4];
  return LEVEL_COLORS[Math.round(value)] ?? LEVEL_COLORS[0];
}

function getCellTextColor(value: number): string {
  if (value <= 0) return LEVEL_TEXT_COLORS[0];
  if (value >= 4) return LEVEL_TEXT_COLORS[4];
  return LEVEL_TEXT_COLORS[Math.round(value)] ?? LEVEL_TEXT_COLORS[0];
}

interface HeatmapRow {
  candidateName: string;
  scores: Record<string, number>;
}

interface SkillsHeatmapProps {
  data: HeatmapRow[];
  questionKeys: string[];
  labels: Record<string, string>;
}

export default function SkillsHeatmap({
  data,
  questionKeys,
  labels,
}: SkillsHeatmapProps) {
  if (!data || data.length === 0 || !questionKeys || questionKeys.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-gray-400">
        Aucune donnée disponible
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <div
        className="grid gap-px bg-gray-200"
        style={{
          gridTemplateColumns: `minmax(140px, 1fr) repeat(${questionKeys.length}, minmax(60px, 1fr))`,
        }}
      >
        {/* Header row */}
        <div className="bg-white p-2 text-xs font-semibold text-gray-600">
          Candidat
        </div>
        {questionKeys.map((key) => (
          <div
            key={key}
            className="bg-white p-2 text-center text-xs font-semibold text-gray-600"
            title={labels[key] ?? key}
          >
            <span className="line-clamp-2">{labels[key] ?? key}</span>
          </div>
        ))}

        {/* Data rows */}
        {data.map((row) => (
          <>
            <div
              key={`name-${row.candidateName}`}
              className="flex items-center bg-white p-2 text-sm font-medium text-gray-800"
            >
              {row.candidateName}
            </div>
            {questionKeys.map((key) => {
              const value = row.scores[key] ?? 0;
              return (
                <div
                  key={`${row.candidateName}-${key}`}
                  className="flex items-center justify-center p-2 text-sm font-semibold"
                  style={{
                    backgroundColor: getCellColor(value),
                    color: getCellTextColor(value),
                  }}
                  title={`${labels[key] ?? key}: ${value}`}
                >
                  {value}
                </div>
              );
            })}
          </>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
        <span className="font-medium">Niveaux :</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <span key={level} className="flex items-center gap-1">
            <span
              className="inline-block h-4 w-4 rounded-sm border border-gray-300"
              style={{ backgroundColor: LEVEL_COLORS[level] }}
            />
            {level}
          </span>
        ))}
      </div>
    </div>
  );
}
