import { ArrowRight, BadgeCheck, BellRing, Crown, Heart, KeyRound, LogOut, Rocket } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { logoutAction, stopAlertAction, stopLaunchAction } from "@/app/auth-actions";
import { ChangePasswordForm, ResendVerificationButton } from "@/components/auth/auth-forms";
import { PlateHeadline } from "@/components/plate-headline";
import { formatPrice } from "@/lib/engine";
import { LOCALE } from "@/lib/i18n/config";
import { getLang } from "@/lib/i18n/server";
import { MESSAGES } from "@/lib/i18n/messages";
import { accountOverview } from "@/lib/server/account";
import { requireUser } from "@/lib/server/auth";

export const metadata: Metadata = { title: "Your account", robots: { index: false } };

function Panel({ id, title, icon, children }: { id: string; title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="border-[3px] border-ink bg-paper">
      <h2 id={id} className="flex items-center gap-3 border-b-[3px] border-ink px-5 py-4 text-3xl">
        {icon}
        {title}
      </h2>
      <div className="p-5">{children}</div>
    </section>
  );
}

const stopButton = "border-2 border-ink px-3 py-1.5 label-mono hover:bg-ink hover:text-paper";

export default async function AccountPage() {
  const user = await requireUser("/account");
  const [lang, overview] = await Promise.all([getLang(), accountOverview(user)]);
  const t = MESSAGES[lang];
  const a = t.account;
  const date = new Intl.DateTimeFormat(LOCALE[lang], { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="pb-20">
      <section aria-labelledby="account-title" className="bg-columns border-b-[3px] border-ink">
        <div className="mx-auto grid max-w-6xl items-end gap-8 px-(--gutter) pt-10 pb-12 lg:grid-cols-[1fr_24rem]">
          <PlateHeadline id="account-title" lines={a.lines} className="text-[clamp(4rem,15vw,9rem)]" />
          <p className="max-w-[44ch] text-lg leading-relaxed lg:pb-2">{a.hello(user.name)}</p>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-8 px-(--gutter) pt-12 lg:grid-cols-[1fr_22rem]">
        <div className="flex min-w-0 flex-col gap-8">
          <Panel id="alerts-title" title={a.alerts} icon={<BellRing className="size-6 text-pink" aria-hidden />}>
            {!user.verified ? (
              <p className="text-ink-soft">{a.alertsLocked}</p>
            ) : overview.alerts.length === 0 ? (
              <p className="text-ink-soft">{a.alertsNone}</p>
            ) : (
              <ul className="-my-2">
                {overview.alerts.map((alert) => {
                  const reached = alert.currentPrice <= alert.targetPrice;
                  return (
                    <li key={alert.id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-ink py-4 last:border-b-0">
                      <div className="min-w-0">
                        <Link href={`/device/${alert.slug}`} className="font-heading text-2xl font-black uppercase hover:bg-pink-tint">
                          {alert.name}
                        </Link>
                        <p className="mt-1 text-sm text-ink-soft">
                          {alert.variant} · {a.target(formatPrice(alert.targetPrice))} ·{" "}
                          <span className={reached ? "bg-pink px-1 font-medium text-ink-deep" : ""}>{a.now(formatPrice(alert.currentPrice))}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="label-mono text-ink-soft">
                          {alert.sentAt ? `${a.sent} · ${date.format(new Date(alert.sentAt))}` : a.watching}
                        </span>
                        <form action={stopAlertAction}>
                          <input type="hidden" name="id" value={alert.id} />
                          <button type="submit" className={stopButton}>
                            {a.stop}
                          </button>
                        </form>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <Panel id="launches-title" title={a.launches} icon={<Rocket className="size-6 text-pink" aria-hidden />}>
            {!user.verified ? (
              <p className="text-ink-soft">{a.alertsLocked}</p>
            ) : overview.launches.length === 0 ? (
              <p className="text-ink-soft">
                {a.launchesNone}{" "}
                <Link href="/upcoming" className="underline decoration-pink decoration-2 underline-offset-4">
                  {t.nav.upcomingLaunches}
                </Link>
              </p>
            ) : (
              <ul className="-my-2">
                {overview.launches.map((launch) => (
                  <li key={launch.id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-ink py-4 last:border-b-0">
                    <div className="min-w-0">
                      {launch.launchedSlug ? (
                        <Link href={`/device/${launch.launchedSlug}`} className="font-heading text-2xl font-black uppercase hover:bg-pink-tint">
                          {launch.name}
                        </Link>
                      ) : (
                        <p className="font-heading text-2xl font-black uppercase">{launch.name}</p>
                      )}
                      <p className="mt-1 text-sm text-ink-soft">{launch.launchedSlug ? a.launched : a.expected(launch.expectedLaunch)}</p>
                    </div>
                    {!launch.notifiedAt && (
                      <form action={stopLaunchAction}>
                        <input type="hidden" name="id" value={launch.id} />
                        <button type="submit" className={stopButton}>
                          {a.stop}
                        </button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel id="password-title" title={a.security} icon={<KeyRound className="size-6 text-pink" aria-hidden />}>
            <div className="max-w-md">
              <ChangePasswordForm />
            </div>
          </Panel>
        </div>

        <aside className="flex min-w-0 flex-col gap-8 lg:sticky lg:top-24 lg:self-start">
          <Panel id="profile-title" title={a.profile} icon={<BadgeCheck className="size-6 text-pink" aria-hidden />}>
            <p className="font-heading text-3xl font-black uppercase leading-none">{user.name}</p>
            <p className="mt-2 break-all">{user.email}</p>
            {user.verified ? (
              <p className="mt-3 inline-flex items-center gap-1.5 bg-ink px-2 py-0.5 label-mono text-paper">
                <BadgeCheck className="size-3.5" aria-hidden /> {a.verified}
              </p>
            ) : (
              <div className="mt-4 flex flex-col gap-3 border-t border-ink pt-4">
                <p className="inline-flex items-center gap-1.5 self-start bg-pink px-2 py-0.5 label-mono text-ink-deep">{a.unverified}</p>
                <p className="text-sm leading-relaxed">{a.verifyNote}</p>
                <ResendVerificationButton />
              </div>
            )}
          </Panel>

          <Panel id="plan-title" title={a.plan} icon={<Crown className="size-6 text-pink" aria-hidden />}>
            <p className="font-heading text-5xl font-black uppercase leading-none">{overview.pro ? a.pro : a.free}</p>
            <p className="mt-2 text-sm text-ink-soft">{overview.pro ? a.proNote : a.freeNote(overview.limit ?? 0)}</p>
            {!overview.pro && (
              <Link href="/pro" className="mt-4 inline-flex items-center gap-2 border-[3px] border-ink bg-pink px-4 py-2 label-mono text-ink-deep shadow-hard hover:-translate-y-0.5">
                {a.getPro} <ArrowRight className="size-4" aria-hidden />
              </Link>
            )}
          </Panel>

          <Panel id="shortlist-title" title={a.shortlist} icon={<Heart className="size-6 text-pink" aria-hidden />}>
            <p className="text-sm text-ink-soft">{a.shortlistNote}</p>
            <Link href="/saved" className="mt-4 inline-flex items-center gap-2 label-mono underline underline-offset-4 hover:bg-pink-tint">
              {a.openSaved} <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Panel>

          <form action={logoutAction}>
            <button type="submit" className="flex w-full items-center justify-center gap-2 border-[3px] border-ink bg-paper px-5 py-3 label-mono hover:bg-ink hover:text-paper">
              <LogOut className="size-4" aria-hidden /> {t.auth.logout}
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}
