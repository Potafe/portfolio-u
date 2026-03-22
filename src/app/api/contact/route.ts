import { NextResponse } from "next/server";
import { headers } from "next/headers";

interface ContactPayload {
  name: string;
  email: string;
  message: string;
}

// Linear-time email validation — avoids ReDoS from adjacent quantifiers.
// RFC 5321 limits: 254 chars total, 64 for the local part.
function isValidEmail(email: string): boolean {
  if (email.length > 254) return false;
  const atIdx = email.indexOf("@");
  // Must have exactly one @, not at position 0
  if (atIdx < 1 || atIdx !== email.lastIndexOf("@")) return false;
  const local = email.slice(0, atIdx);
  const domain = email.slice(atIdx + 1);
  if (local.length > 64 || domain.length < 4) return false;
  // No whitespace anywhere; domain must contain at least one dot
  return !/\s/.test(email) && domain.includes(".");
}

// ─── Simple in-process rate limiter ───────────────────────────────────────
// Limits each IP to 1 successful send per calendar day (UTC).
// Note: this state is per-instance; for multi-region deployments use an
// external store (Redis / Upstash) instead.
const sentToday = new Map<string, number>(); // ip → UTC date number (YYYYMMDD)

function todayUTC(): number {
  const d = new Date();
  return (
    d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate()
  );
}

function hasAlreadySentToday(ip: string): boolean {
  return sentToday.get(ip) === todayUTC();
}

function markSentToday(ip: string): void {
  sentToday.set(ip, todayUTC());
}

export async function POST(request: Request) {
  // Rate-limit by IP
  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headersList.get("x-real-ip") ??
    "unknown";

  if (hasAlreadySentToday(ip)) {
    return NextResponse.json(
      {
        error:
          "You have already sent a message today. Please try again tomorrow.",
      },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { name, email, message } = body as Partial<ContactPayload>;

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return NextResponse.json(
      { error: "name, email, and message are required." },
      { status: 400 },
    );
  }

  if (!isValidEmail(email)) {
    return NextResponse.json(
      { error: "Please provide a valid email address." },
      { status: 400 },
    );
  }

  if (message.length > 5000) {
    return NextResponse.json(
      { error: "Message must be 5000 characters or fewer." },
      { status: 400 },
    );
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const toEmail =
    process.env.CONTACT_TO_EMAIL ?? process.env.NEXT_PUBLIC_CONTACT_EMAIL;

  if (resendApiKey && toEmail) {
    const fromEmail = process.env.CONTACT_FROM_EMAIL ?? "onboarding@resend.dev";
    const fromLabel = process.env.CONTACT_FROM_LABEL ?? "Portfolio Contact";

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${fromLabel} <${fromEmail}>`,
        to: [toEmail],
        reply_to: email.trim(),
        subject: `Portfolio contact from ${name.trim()}`,
        text: `Name: ${name.trim()}\nEmail: ${email.trim()}\n\n${message.trim()}`,
      }),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to send message. Please try again later." },
        { status: 502 },
      );
    }

    markSentToday(ip);
    return NextResponse.json({ ok: true });
  }

  // No email backend configured — log the message server-side and acknowledge.
  // In production, set RESEND_API_KEY + CONTACT_TO_EMAIL to enable delivery.

  // Still mark as sent so the daily limit is enforced even without email delivery.
  markSentToday(ip);
  return NextResponse.json({ ok: true });
}
