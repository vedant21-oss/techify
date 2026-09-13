"use client";

import { ArrowLeft, ArrowRight, Laptop, Smartphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMessages } from "@/components/lang-provider";
import { formatBudgetShort, type Category } from "@/lib/engine";
import { QUIZZES, scoreQuiz } from "@/lib/features/quiz";
import { finderHref } from "@/lib/url";
import { cn } from "@/lib/utils";

type Step = { kind: "category" } | { kind: "question"; index: number } | { kind: "budget" };

export function QuizFlow() {
  const router = useRouter();
  const t = useMessages();
  const [category, setCategory] = useState<Category | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [step, setStep] = useState<Step>({ kind: "category" });

  const quiz = category ? QUIZZES[category] : null;
  const text = category ? t.quiz.text[category] : {};
  const total = quiz ? quiz.questions.length + 2 : 7;
  const position = step.kind === "category" ? 0 : step.kind === "question" ? step.index + 1 : total - 1;

  function back() {
    if (step.kind === "budget") setStep({ kind: "question", index: quiz!.questions.length - 1 });
    else if (step.kind === "question") setStep(step.index === 0 ? { kind: "category" } : { kind: "question", index: step.index - 1 });
  }

  function finish(budget: number) {
    if (!category) return;
    const result = scoreQuiz(category, answers, budget);
    router.push(`${finderHref({ category, useCase: result.useCase, budget, weights: result.points })}#results`);
  }

  const option = "flex w-full items-center justify-between gap-4 border-[3px] border-ink bg-paper px-5 py-4 text-left text-lg font-medium transition-[transform,box-shadow,background-color] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-pink-tint hover:shadow-[6px_6px_0_var(--ink)]";

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center gap-4">
        <div className="h-3 flex-1 border-2 border-ink bg-paper" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={position}>
          <div className="h-full bg-pink transition-[width] duration-500" style={{ width: `${(position / total) * 100}%` }} />
        </div>
        <span className="label-mono tabular text-ink-soft">
          {position + 1}/{total}
        </span>
      </div>

      <div key={`${step.kind}-${"index" in step ? step.index : ""}`} className="mt-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {step.kind === "category" && (
          <>
            <h2 className="text-5xl sm:text-6xl">{t.quiz.shoppingFor}</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {([
                ["phone", t.quiz.aPhone, Smartphone],
                ["laptop", t.quiz.aLaptop, Laptop],
              ] as const).map(([id, label, Icon]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setCategory(id);
                    setAnswers({});
                    setStep({ kind: "question", index: 0 });
                  }}
                  className={cn(option, "flex-col items-start py-8")}
                >
                  <Icon className="size-8 text-pink" aria-hidden />
                  <span className="font-heading text-5xl font-black uppercase">{label}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {step.kind === "question" && quiz && (
          <>
            <h2 className="text-5xl sm:text-6xl">
              {text[quiz.questions[step.index].id]?.question ?? quiz.questions[step.index].question}
            </h2>
            <div className="mt-8 flex flex-col gap-3">
              {quiz.questions[step.index].options.map((o) => {
                const q = quiz.questions[step.index];
                const chosen = answers[q.id] === o.id;
                return (
                  <button
                    key={o.id}
                    type="button"
                    aria-pressed={chosen}
                    onClick={() => {
                      setAnswers((a) => ({ ...a, [q.id]: o.id }));
                      setStep(step.index + 1 < quiz.questions.length ? { kind: "question", index: step.index + 1 } : { kind: "budget" });
                    }}
                    className={cn(option, chosen && "bg-ink text-paper hover:bg-ink")}
                  >
                    {text[q.id]?.options[o.id] ?? o.label}
                    <ArrowRight className="size-5 shrink-0" aria-hidden />
                  </button>
                );
              })}
            </div>
          </>
        )}

        {step.kind === "budget" && quiz && (
          <>
            <h2 className="text-5xl sm:text-6xl">{t.quiz.spend}</h2>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {quiz.budgets.map((b) => (
                <button key={b} type="button" onClick={() => finish(b)} className={cn(option, "justify-center font-heading text-4xl font-black")}>
                  {formatBudgetShort(b)}
                </button>
              ))}
            </div>
            <p className="mt-6 text-ink-soft">{t.quiz.landNote}</p>
          </>
        )}
      </div>

      {step.kind !== "category" && (
        <button type="button" onClick={back} className="mt-10 flex items-center gap-2 label-mono hover:bg-pink-tint">
          <ArrowLeft className="size-4" aria-hidden /> {t.quiz.back}
        </button>
      )}
    </div>
  );
}
