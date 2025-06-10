"use client";

export default function EmbedCodeCard() {
  const chatUrl = typeof window !== "undefined"
    ? `${window.location.origin}/chat`
    : "/chat";

  const iframeCode = `<iframe src="${chatUrl}" width="100%" height="400" style="border:none;"></iframe>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(iframeCode);
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
      <h2 className="text-md font-semibold text-white mb-3">🌐 Website Embed</h2>
      <p className="text-blue-100 text-xs mb-2 max-w-xs">
        Want your AI assistant on your clinic website? Send this embed code to your web developer or IT team — and if they need help, they can contact us directly. Once embedded, patients can start chatting with your assistant right from your site.
      </p>
      <div className="bg-white/10 p-2 rounded text-xs text-blue-100 border border-white/20 overflow-x-auto mb-2">
        <code>{iframeCode}</code>
      </div>
      <button
        onClick={copyToClipboard}
        className="px-3 py-1 bg-white text-blue-900 font-semibold rounded hover:bg-blue-100 text-sm"
      >
        Copy Embed Code
      </button>
    </div>
  );
}