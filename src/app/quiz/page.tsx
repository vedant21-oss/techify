import type { Metadata } from "next";
import { PlateHeadline } from "@/components/plate-headline";
import { getMessages } from "@/lib/i18n/server";
import { QuizFlow } from "./quiz-flow";

export const metadata: Metadata = {
  title: "Help me choose",
  description: "Answer six quick questions and get laptops or phones ranked for exactly how you'll use them.",
};

export default async function QuizPage() {
  const t = await getMessages();
  return (
    <div className="pb-24">
      <section aria-labelledby="quiz-title" className="bg-columns border-b-[3px] border-ink">
        <div className="mx-auto grid max-w-6xl items-end gap-8 px-(--gutter) pt-10 pb-12 lg:grid-cols-[1fr_24rem]">
          <PlateHeadline id="quiz-title" lines={t.quiz.lines} className="text-[clamp(4rem,17vw,10rem)]" />
          <p className="max-w-[44ch] text-lg leading-relaxed lg:pb-2">
            {t.quiz.lede}
          </p>
        </div>
      </section>
      <div className="px-(--gutter) pt-14">
        <QuizFlow />
      </div>
    </div>
  );
}
