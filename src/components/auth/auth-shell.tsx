import { PlateHeadline } from "@/components/plate-headline";

/** Split layout shared by the login, sign-up and password pages: headline left, form card right. */
export function AuthShell({
  id,
  lines,
  lede,
  children,
  footer,
}: {
  id: string;
  lines: string[];
  lede: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="bg-columns border-b-[3px] border-ink">
      <div className="mx-auto grid max-w-6xl items-start gap-10 px-(--gutter) pt-10 pb-16 lg:grid-cols-[1fr_27rem] lg:gap-16 lg:pt-16 lg:pb-24">
        <div className="min-w-0">
          <PlateHeadline id={id} lines={lines} className="text-[clamp(4rem,15vw,9rem)]" />
          <p className="mt-8 max-w-[44ch] text-lg leading-relaxed">{lede}</p>
        </div>
        <div className="min-w-0">
          <div className="border-[3px] border-ink bg-paper shadow-hard-pink">{children}</div>
          {footer && <div className="mt-5 text-sm">{footer}</div>}
        </div>
      </div>
    </section>
  );
}
