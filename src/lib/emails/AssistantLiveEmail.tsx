
type AssistantLiveEmailProps = {
  doctorName: string;
  clinicSlug: string;
  qrCodeUrl: string;
};

export default function AssistantLiveEmail({
  doctorName,
  clinicSlug,
  qrCodeUrl,
}: AssistantLiveEmailProps) {
  const chatUrl = `https://calmclinic-health.vercel.app/chat?c=${clinicSlug}`;

  return (
    <div style={{ fontFamily: "Arial, sans-serif", lineHeight: 1.5 }}>
      <h1>Your Assistant Is Now Live!</h1>
      <p>
        Hi Dr. {doctorName}, your CalmClinic assistant is now ready to use.
      </p>
      <p>
        Here’s your link: <a href={chatUrl}>{chatUrl}</a>
      </p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={qrCodeUrl}
        alt="QR Code to chat with assistant"
        style={{ width: 200, height: 200, marginTop: 16 }}
      />
      <p>
        📎 You can print and post this QR code at your front desk or include it
        in appointment reminder messages.
      </p>
      <p>
        📧 Want to embed it on your website? Share this email with your web
        developer or IT team—or reach out to us and we’ll help you do it!
      </p>
      <p style={{ marginTop: 24 }}>— The CalmClinic Team</p>
    </div>
  );
}
