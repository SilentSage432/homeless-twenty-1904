import { NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

const TARGET_EMAIL =
  process.env.RESEND_TARGET_EMAIL || "info@thehomelesstwenty1904.org";
// Must be a verified sender/domain in Resend. `onboarding@resend.dev` works
// only for sending to the account owner during development.
const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ||
  "Homeless Twenty 1904 <onboarding@resend.dev>";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value: unknown, max = 5000): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request payload." },
      { status: 400 }
    );
  }

  // Honeypot: real users never fill this. Silently succeed to waste bot effort.
  if (clean(body.honeypot, 200).length > 0) {
    return NextResponse.json({ ok: true });
  }

  const name = clean(body.name, 200);
  const email = clean(body.email, 320);
  const subject = clean(body.subject, 200);
  const phone = clean(body.phone, 60);
  const message = clean(body.message, 5000);

  if (!name || !email || !subject || !message) {
    return NextResponse.json(
      { ok: false, error: "Please complete name, email, subject, and message." },
      { status: 400 }
    );
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { ok: false, error: "Please provide a valid email address." },
      { status: 400 }
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "The lodge inbox is not configured yet. Please email us directly for now.",
      },
      { status: 503 }
    );
  }

  const resend = new Resend(apiKey);

  const textBody = [
    `New message from the Homeless Twenty 1904 website.`,
    ``,
    `Name:    ${name}`,
    `Email:   ${email}`,
    phone ? `Phone:   ${phone}` : null,
    `Subject: ${subject}`,
    ``,
    `Message:`,
    message,
  ]
    .filter((line) => line !== null)
    .join("\n");

  const htmlBody = `
    <div style="font-family:Georgia,serif;color:#2b2622;line-height:1.6">
      <h2 style="margin:0 0 4px;color:#7a1f1f">New Lodge Inquiry</h2>
      <p style="margin:0 0 16px;color:#6b5f52">via thehomelesstwenty1904.org</p>
      <table style="border-collapse:collapse">
        <tr><td style="padding:2px 12px 2px 0;color:#6b5f52">Name</td><td>${escapeHtml(name)}</td></tr>
        <tr><td style="padding:2px 12px 2px 0;color:#6b5f52">Email</td><td>${escapeHtml(email)}</td></tr>
        ${phone ? `<tr><td style="padding:2px 12px 2px 0;color:#6b5f52">Phone</td><td>${escapeHtml(phone)}</td></tr>` : ""}
        <tr><td style="padding:2px 12px 2px 0;color:#6b5f52">Subject</td><td>${escapeHtml(subject)}</td></tr>
      </table>
      <hr style="border:none;border-top:1px solid #d8c9ad;margin:16px 0" />
      <p style="white-space:pre-wrap;margin:0">${escapeHtml(message)}</p>
    </div>
  `;

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: [TARGET_EMAIL],
    replyTo: email,
    subject: `[Lodge Contact] ${subject} — ${name}`,
    text: textBody,
    html: htmlBody,
  });

  if (error) {
    return NextResponse.json(
      { ok: false, error: "We couldn't send your message. Please try again." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
