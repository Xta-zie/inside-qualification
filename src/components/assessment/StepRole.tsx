"use client";

import { useMemo } from "react";
import { User, Lock, Crosshair } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepRoleProps {
  baselines: Array<{
    roleKey: string;
    label: string;
    description: string;
    targets: Record<string, number>;
  }>;
  identity: { name: string; email: string };
  setIdentity: (identity: { name: string; email: string }) => void;
  onSelect: (roleKey: string) => void;
}

export default function StepRole({
  baselines,
  identity,
  setIdentity,
  onSelect,
}: StepRoleProps) {
  const isValid = useMemo(
    () => identity.name.trim().length > 0 && identity.email.trim().length > 0,
    [identity.name, identity.email]
  );

  return (
    <section className="animate-[fadeIn_0.5s_ease-out] mx-auto max-w-5xl px-4 py-8">
      {/* Step title */}
      <h2 className="mb-8 text-center text-3xl tracking-wide text-inside-blue md:text-4xl">
        1. Définition du Rôle Cible
      </h2>

      {/* Identity card */}
      <div className="mb-10 rounded-xl border border-gray-200 border-l-4 border-l-inside-blue bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-inside-blue/10">
            <User className="h-5 w-5 text-inside-blue" />
          </div>
          <h3 className="font-dm-sans text-lg font-semibold text-gray-800">
            Identification
          </h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="candidate-name"
              className="mb-1 block text-sm font-medium text-gray-600"
            >
              Nom Complet
            </label>
            <input
              id="candidate-name"
              type="text"
              placeholder="Jean Dupont"
              value={identity.name}
              onChange={(e) =>
                setIdentity({ ...identity, name: e.target.value })
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-inside-blue focus:outline-none focus:ring-2 focus:ring-inside-blue/20"
            />
          </div>
          <div>
            <label
              htmlFor="candidate-email"
              className="mb-1 block text-sm font-medium text-gray-600"
            >
              Adresse Email
            </label>
            <input
              id="candidate-email"
              type="email"
              placeholder="jean.dupont@exemple.fr"
              value={identity.email}
              onChange={(e) =>
                setIdentity({ ...identity, email: e.target.value })
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-inside-blue focus:outline-none focus:ring-2 focus:ring-inside-blue/20"
            />
          </div>
        </div>
      </div>

      {/* Role selection grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {baselines.map((baseline, index) => {
          const axesCount = Object.keys(baseline.targets).length;

          return (
            <div
              key={baseline.roleKey}
              className="animate-[fadeIn_0.5s_ease-out] relative"
              style={{ animationDelay: `${(index + 1) * 100}ms`, animationFillMode: "both" }}
            >
              <button
                type="button"
                disabled={!isValid}
                onClick={() => isValid && onSelect(baseline.roleKey)}
                className={cn(
                  "group relative w-full rounded-xl border bg-white p-6 text-left transition-all duration-200",
                  isValid
                    ? "cursor-pointer border-gray-200 shadow-sm hover:border-inside-pink hover:shadow-lg"
                    : "cursor-not-allowed border-gray-200 shadow-sm"
                )}
              >
                {/* Card content */}
                <div className="mb-3 flex items-center gap-3">
                  <Crosshair
                    className={cn(
                      "h-5 w-5 transition-colors",
                      isValid
                        ? "text-inside-blue group-hover:text-inside-pink"
                        : "text-gray-400"
                    )}
                  />
                  <h3 className="font-dm-sans text-lg font-bold text-inside-blue">
                    {baseline.label}
                  </h3>
                </div>

                <p className="mb-4 text-sm leading-relaxed text-gray-600">
                  {baseline.description}
                </p>

                <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                  <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-inside-blue/10 px-1.5 text-inside-blue">
                    {axesCount}
                  </span>
                  <span>axes d&apos;évaluation</span>
                </div>

                {/* Locked overlay */}
                {!isValid && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl bg-white/70 backdrop-blur-sm">
                    <Lock className="h-6 w-6 text-gray-400" />
                    <span className="text-xs font-medium text-gray-500">
                      Remplissez votre identité
                    </span>
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
