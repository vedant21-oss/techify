import "server-only";
import { Resend } from "resend";

export interface OutgoingEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
}

let resend: Resend | null | undefined;

function client(): Resend | null {
  if (resend !== undefined) return resend;
  resend = process.env.RESEND_API_KEY && process.env.ALERTS_FROM_EMAIL ? new Resend(process.env.RESEND_API_KEY) : null;
  return resend;
}

export function emailConfigured(): boolean {
  return client() !== null;
}

/**
 * Sends through Resend when RESEND_API_KEY and ALERTS_FROM_EMAIL are set. Without
 * them (local development) the email is printed to the server log instead, and the
 * result says it wasn't delivered.
 */
export async function sendEmail(email: OutgoingEmail): Promise<{ delivered: boolean; error?: string }> {
  const resendClient = client();
  if (!resendClient) {
    console.info(`[email not configured] To: ${email.to}\nSubject: ${email.subject}\n\n${email.text}\n`);
    return { delivered: false, error: "Email sending isn't configured" };
  }
  const { error } = await resendClient.emails.send({
    from: process.env.ALERTS_FROM_EMAIL!,
    to: email.to,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });
  if (error) {
    console.error("Resend rejected an email:", error.message);
    return { delivered: false, error: error.message };
  }
  return { delivered: true };
}

export function appUrl(path = ""): string {
  const base = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${base}${path}`;
}
