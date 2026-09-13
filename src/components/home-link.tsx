"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { REPLAY_INTRO_EVENT } from "@/components/landing/intro-curtain";

/**
 * A link home that replays the landing intro. Navigating from another page remounts
 * the intro on its own; when you're already home, it asks the intro to play again.
 */
export function HomeLink({
  className,
  children,
  ...rest
}: Omit<React.ComponentProps<typeof Link>, "href">) {
  const pathname = usePathname();
  return (
    <Link
      {...rest}
      href="/"
      className={className}
      onClick={(event) => {
        if (pathname === "/") {
          event.preventDefault();
          window.dispatchEvent(new Event(REPLAY_INTRO_EVENT));
        }
      }}
    >
      {children}
    </Link>
  );
}
