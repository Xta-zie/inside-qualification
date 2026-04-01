"use client";

import React, { useCallback, useRef } from "react";
import { PieChart } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepQuizProps {
  questions: Array<{
    id: number;
    key: string;
    category: string;
    levels: string[];
    sortOrder: number;
  }>;
  answers: Record<string, number>;
  setAnswers: (answers: Record<string, number>) => void;
  onFinish: () => void;
}

const SECTION_BREAK_INDEX = 5;

export default function StepQuiz({
  questions,
  answers,
  setAnswers,
  onFinish,
}: StepQuizProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = questions.length;
  const progress = totalQuestions > 0
    ? Math.round((answeredCount / totalQuestions) * 100)
    : 0;
  const allAnswered = answeredCount >= totalQuestions && totalQuestions > 0;

  const handleSelect = useCallback(
    (questionKey: string, level: number, currentIndex: number) => {
      setAnswers({ ...answers, [questionKey]: level });

      // Auto-scroll to next question
      const nextIndex = currentIndex + 1;
      if (nextIndex < totalQuestions) {
        setTimeout(() => {
          const nextElement = document.getElementById(`q-${nextIndex}`);
          if (nextElement) {
            nextElement.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 150);
      }
    },
    [answers, setAnswers, totalQuestions]
  );

  return (
    <div ref={containerRef} className="relative pb-24">
      {/* Sticky header with progress bar */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bebas text-xl md:text-2xl text-inside-blue tracking-wide">
              2. Evaluation des Competences ({progress}%)
            </h2>
            <span className="text-sm font-medium text-gray-500">
              {answeredCount}/{totalQuestions}
            </span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-inside-cyan rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {questions.map((question, idx) => {
          const isPart1 = idx < SECTION_BREAK_INDEX;
          const accentColor = isPart1 ? "inside-pink" : "inside-blue";
          const selectedLevel = answers[question.key];

          return (
            <React.Fragment key={question.id}>
              {/* Section headers */}
              {idx === 0 && (
                <div className="border-l-4 border-inside-pink pl-4 py-2 mb-4">
                  <h3 className="font-bebas text-lg md:text-xl text-gray-800 tracking-wide">
                    Partie 1 : Prerequis Techniques
                  </h3>
                </div>
              )}
              {idx === SECTION_BREAK_INDEX && (
                <div className="border-l-4 border-inside-blue pl-4 py-2 mb-4 mt-8">
                  <h3 className="font-bebas text-lg md:text-xl text-gray-800 tracking-wide">
                    Partie 2 : Connaissances OpenStack
                  </h3>
                </div>
              )}

              {/* Question card */}
              <div
                id={`q-${idx}`}
                className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md"
              >
                {/* Question header */}
                <div className="flex items-center gap-3 p-4 md:p-5 border-b border-gray-100">
                  <div
                    className={cn(
                      "flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold",
                      isPart1 ? "bg-inside-pink" : "bg-inside-blue"
                    )}
                  >
                    {idx + 1}
                  </div>
                  <h4 className="font-semibold text-gray-800 text-sm md:text-base">
                    {question.category}
                  </h4>
                </div>

                {/* Level options */}
                <div className="p-3 md:p-4 space-y-2">
                  {question.levels.map((levelText, levelIdx) => {
                    const levelValue = levelIdx + 1;
                    const isSelected = selectedLevel === levelValue;

                    return (
                      <button
                        key={levelIdx}
                        type="button"
                        onClick={() =>
                          handleSelect(question.key, levelValue, idx)
                        }
                        className={cn(
                          "w-full flex items-start gap-3 p-3 md:p-4 rounded-lg border-2 text-left transition-all duration-200 cursor-pointer group",
                          isSelected
                            ? "bg-inside-cyan/10 border-inside-cyan"
                            : "bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                        )}
                      >
                        {/* Radio circle */}
                        <div
                          className={cn(
                            "flex-shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors duration-200",
                            isSelected
                              ? "border-inside-cyan"
                              : "border-gray-300 group-hover:border-gray-400"
                          )}
                        >
                          {isSelected && (
                            <div className="w-2.5 h-2.5 rounded-full bg-inside-cyan" />
                          )}
                        </div>

                        {/* Level label + description */}
                        <div className="flex-1 min-w-0">
                          <span
                            className={cn(
                              "text-xs font-bold uppercase tracking-wider",
                              isSelected
                                ? "text-inside-blue"
                                : "text-gray-400"
                            )}
                          >
                            Niveau {levelValue}
                          </span>
                          <p
                            className={cn(
                              "text-sm mt-0.5 leading-relaxed",
                              isSelected ? "text-gray-800" : "text-gray-600"
                            )}
                          >
                            {levelText}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Sticky bottom button */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            type="button"
            onClick={onFinish}
            disabled={!allAnswered}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-3 px-6 rounded-lg text-white font-semibold text-base transition-all duration-300",
              allAnswered
                ? "bg-inside-pink hover:bg-inside-pink/90 shadow-lg hover:shadow-xl cursor-pointer"
                : "bg-gray-300 cursor-not-allowed"
            )}
          >
            <PieChart className="w-5 h-5" />
            Generer le rapport
          </button>
        </div>
      </div>
    </div>
  );
}
