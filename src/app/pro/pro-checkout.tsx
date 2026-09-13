"use client";

import { Check, Loader2 } from "lucide-react";
import Script from "next/script";
import { useState } from "react";
import { formatPrice } from "@/lib/engine";

interface RazorpaySuccess {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: "payment.failed", handler: (response: { error: { description?: string } }) => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

type Status =
  | { kind: "idle" }
  | { kind: "working"; label: string }
  | { kind: "error"; message: string }
  | { kind: "paid"; email: string };

export function ProCheckout({ priceInr, configured }: { priceInr: number; configured: boolean }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [scriptReady, setScriptReady] = useState(false);

  async function pay(event: React.FormEvent) {
    event.preventDefault();
    setStatus({ kind: "working", label: "Starting payment" });
    try {
      const orderRes = await fetch("/api/pro/order", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const order = await orderRes.json();
      if (!orderRes.ok) throw new Error(order.error ?? "Couldn't start the payment.");
      if (!window.Razorpay) throw new Error("Razorpay Checkout didn't load. Check your connection and try again.");

      const checkout = new window.Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amountPaise,
        currency: order.currency,
        name: "Techify",
        description: "Techify Pro: unlimited price alerts",
        prefill: { email: order.email },
        theme: { color: "#1d1fcf" },
        modal: { ondismiss: () => setStatus({ kind: "idle" }) },
        handler: async (response: RazorpaySuccess) => {
          setStatus({ kind: "working", label: "Confirming payment" });
          const verifyRes = await fetch("/api/pro/verify", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            }),
          });
          const verified = await verifyRes.json();
          setStatus(verifyRes.ok ? { kind: "paid", email: verified.email } : { kind: "error", message: verified.error });
        },
      });
      checkout.on("payment.failed", (response) =>
        setStatus({ kind: "error", message: response.error.description ?? "The payment didn't go through. You weren't charged." }),
      );
      checkout.open();
    } catch (err) {
      setStatus({ kind: "error", message: (err as Error).message });
    }
  }

  if (status.kind === "paid") {
    return (
      <div role="status" className="border-[3px] border-ink bg-pink p-6 text-ink-deep sm:p-8">
        <p className="flex items-center gap-3 font-heading text-4xl font-black uppercase">
          <Check className="size-8" aria-hidden /> You&apos;re Pro
        </p>
        <p className="mt-3 text-lg">
          Price alerts for <strong>{status.email}</strong> are now unlimited. Set them from any device page.
        </p>
      </div>
    );
  }

  const working = status.kind === "working";

  return (
    <>
      {configured && (
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" onReady={() => setScriptReady(true)} />
      )}
      <form onSubmit={pay} className="border-[3px] border-ink bg-paper shadow-hard-pink">
        <div className="p-6 sm:p-8">
          <label htmlFor="pro-email" className="label-mono">
            Email you use for price alerts
          </label>
          <input
            id="pro-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-3 w-full border-[3px] border-ink bg-paper px-4 py-3 text-lg outline-none placeholder:text-ink-soft focus:bg-pink-tint"
          />
          {!configured && (
            <p className="mt-4 bg-pink-tint px-3 py-2 text-sm text-ink-deep">
              Payments aren&apos;t switched on for this site yet, so checkout is unavailable. Nothing will be charged.
            </p>
          )}
          {status.kind === "error" && (
            <p role="alert" className="mt-4 border-[3px] border-ink bg-pink-tint px-4 py-3 text-sm font-medium text-ink-deep">
              {status.message}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={!configured || working || !scriptReady}
          className="flex w-full items-center justify-center gap-3 border-t-[3px] border-ink bg-ink px-6 py-5 font-heading text-3xl font-black uppercase text-paper transition-colors hover:bg-pink hover:text-ink-deep disabled:cursor-not-allowed disabled:opacity-60"
        >
          {working && <Loader2 className="size-6 animate-spin" aria-hidden />}
          {working ? status.label : `Pay ${formatPrice(priceInr)} with Razorpay`}
        </button>
      </form>
      <p className="mt-4 text-sm text-ink-soft">
        One-time payment. UPI, cards, netbanking and wallets through Razorpay; Techify never sees your card or UPI details.
      </p>
    </>
  );
}
