import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { adminConfigured, isAdmin } from "@/lib/server/admin";
import { LoginForm } from "../forms";

export const metadata: Metadata = { title: "Admin login", robots: { index: false } };

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <div className="mx-auto max-w-md px-(--gutter) py-24">
      <h1 className="text-6xl">Admin</h1>
      {adminConfigured() ? (
        <div className="mt-8 border-[3px] border-ink bg-paper p-6">
          <LoginForm />
        </div>
      ) : (
        <p className="mt-6 border-[3px] border-ink bg-pink-tint p-5 text-ink-deep">
          The admin area is switched off. Set <code className="font-mono">ADMIN_PASSWORD</code> (and ideally{" "}
          <code className="font-mono">ADMIN_SESSION_SECRET</code>) in your environment, then restart.
        </p>
      )}
    </div>
  );
}
