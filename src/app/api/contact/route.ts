import { NextResponse } from "next/server";

interface ContactPayload {
  name: string;
  email: string;
  message: string;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
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
      // eslint-disable-next-line no-console
      console.error("Resend error:", await res.text());
      return NextResponse.json(
        { error: "Failed to send message. Please try again later." },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true });
  }

  // No email backend configured — log the message server-side and acknowledge.
  // In production, set RESEND_API_KEY + CONTACT_TO_EMAIL to enable delivery.
  // eslint-disable-next-line no-console
  console.log("[contact]", {
    name: name.trim(),
    email: email.trim(),
    message: message.trim(),
  });
  return NextResponse.json({ ok: true });
}
