
import { Resend } from "resend";
import AssistantLiveEmail from "@/lib/emails/AssistantLiveEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

type SendLiveAssistantEmailProps = {
  to: string;
  doctorName: string;
  clinicSlug: string;
  qrCodeUrl: string;
};

export async function sendLiveAssistantEmail({
  to,
  doctorName,
  clinicSlug,
  qrCodeUrl,
}: SendLiveAssistantEmailProps) {
  try {
    const { error } = await resend.emails.send({
      from: "CalmClinic <team@calmclinic.health>",
      to,
      subject: "Your Assistant Is Now Live!",
      react: AssistantLiveEmail({ doctorName, clinicSlug, qrCodeUrl }),
    });

    if (error) {
      console.error("Resend email error:", error);
    }
  } catch (err) {
    console.error("Unexpected error sending email:", err);
  }
}