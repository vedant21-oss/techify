import { PlateHeadline } from "@/components/plate-headline";

/** The standard page opening: plate headline on the left, one paragraph of lede on the right. */
export function PageHero({
  id,
  lines,
  lede,
  size = "md",
  /** Let a long single-line title wrap rather than run off the page. */
  wrap = false,
}: {
  id: string;
  lines: string[];
  lede: React.ReactNode;
  size?: "md" | "sm";
  wrap?: boolean;
}) {
  return (
    <section aria-labelledby={id} className="bg-columns border-b-[3px] border-ink">
      <div className="mx-auto grid max-w-6xl items-end gap-8 px-(--gutter) pt-10 pb-12 lg:grid-cols-[1fr_24rem]">
        <PlateHeadline
          id={id}
          lines={lines}
          className={`${size === "sm" ? "text-[clamp(2.5rem,7vw,4.75rem)]" : "text-[clamp(4rem,15vw,9.5rem)]"} ${wrap ? "plate-wrap" : ""}`}
        />
        <p className="max-w-[44ch] text-lg leading-relaxed lg:pb-2">{lede}</p>
      </div>
    </section>
  );
}
