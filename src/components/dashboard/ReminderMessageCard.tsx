"use client";

interface ReminderMessageCardProps {
  slug: string;
}

export default function ReminderMessageCard({ slug }: ReminderMessageCardProps) {
  const chatUrl = `https://calmclinic.health/chat?c=${slug}`;

  const message = `Hi! You can chat with our assistant here: ${chatUrl}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message);
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
      <h2 className="text-md font-semibold text-white mb-3">📱 Reminder Message</h2>
      <p className="text-blue-100 text-xs mb-2 max-w-xs">
        Add this message to your text or email reminders so patients can access your assistant before their visit.
      </p>
      <div className="bg-white/10 p-2 rounded text-xs text-blue-100 border border-white/20 mb-2">
        <code>{message}</code>
      </div>
      <button
        onClick={copyToClipboard}
        className="px-3 py-1 bg-white text-blue-900 font-semibold rounded hover:bg-blue-100 text-sm"
      >
        Copy Link
      </button>
    </div>
  );
}