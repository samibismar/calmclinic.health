import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const body = await req.json();
  const { email, slug, doctor_name } = body;

  if (!email || !slug || !doctor_name) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  const chatUrl = `https://calmclinic-health.vercel.app/chat?c=${slug}`;

  try {
    const data = await resend.emails.send({
      from: "CalmClinic <onboarding@calmclinic.health>",
      to: email,
      subject: "Your CalmClinic Assistant is Now Live!",
      html: `
        <h1>Your Assistant is Ready 🎉</h1>
        <p>Hi Dr. ${doctor_name},</p>
        <p>Your AI assistant is now live and ready to help your patients!</p>
        <p><strong>Link:</strong> <a href="${chatUrl}">${chatUrl}</a></p>
        <p>We recommend printing your <a href="https://calmclinic-health.vercel.app/dashboard/print">QR code</a> and placing it in your waiting room.</p>
        <p>Thanks for using CalmClinic!</p>
      `,
    });

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}