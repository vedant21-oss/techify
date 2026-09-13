"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { splitGlossary } from "@/lib/features/glossary";

/** Renders spec text with dotted-underlined terms that explain themselves on hover or focus. */
export function GlossaryText({ text }: { text: string }) {
  const segments = splitGlossary(text);
  return (
    <>
      {segments.map((segment, i) =>
        segment.term ? (
          <Tooltip key={i}>
            <TooltipTrigger asChild>
              <span
                tabIndex={0}
                className="cursor-help underline decoration-pink decoration-dotted decoration-2 underline-offset-4"
              >
                {segment.text}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-64 text-balance">
              <strong className="block">{segment.term}</strong>
              {segment.meaning}
            </TooltipContent>
          </Tooltip>
        ) : (
          <span key={i}>{segment.text}</span>
        ),
      )}
    </>
  );
}
