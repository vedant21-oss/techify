import { z } from "zod";
import { zodMessage } from "@/lib/query";
import { sendEmail } from "@/lib/server/mailer";

const bodySchema = z.object({
  name: z.string().trim().min(2).max(60),
  email: z.email({ error: "Enter an email we can reply to." }),
  subject: z.string().trim().max(60).default("Message"),
  message: z.string().trim().min(20, { error: "Add a bit more detail so we can act on it." }).max(2000),
});

const escapeHtml = (text: string) =>
  text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/**
 * POST /api/contact — sends a message from the contact form to the site's own inbox.
 * Without CONTACT_EMAIL (or email sending at all) it prints to the server log instead.
 */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: zodMessage(parsed.error) }, { status: 400 });
  const { name, email, subject, message } = parsed.data;

  const to = process.env.CONTACT_EMAIL ?? process.env.ALERTS_FROM_EMAIL;
  if (!to) {
    console.info(`[contact] ${subject} from ${name} <${email}>\n\n${message}\n`);
    return Response.json({ ok: true }, { status: 201 });
  }

  const result = await sendEmail({
    to,
    subject: `Techify contact: ${subject}`,
    text: `${subject}\nFrom: ${name} <${email}>\n\n${message}`,
    html: `<div style="font-family:Arial,sans-serif;color:#0c0d52">
  <p style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#1d1fcf">Techify contact</p>
  <h1 style="font-size:20px;margin:8px 0">${escapeHtml(subject)}</h1>
  <p style="color:#3d3f8f">From ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
  <p style="white-space:pre-line">${escapeHtml(message)}</p>
</div>`,
  });
  if (!result.delivered && result.error !== "Email sending isn't configured") {
    return Response.json({ error: "That didn't send. Try again in a minute." }, { status: 502 });
  }
  return Response.json({ ok: true }, { status: 201 });
}
