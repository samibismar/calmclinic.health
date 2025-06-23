// src/components/FeedbackLink.tsx
import React from "react";

export default function FeedbackLink() {
  return (
    <div className="text-center mt-6 text-sm text-gray-500">
      💬 Help us improve →{" "}
      <a
        href="https://forms.gle/aGKvuwzUwrH7HuEy8"
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline font-medium"
      >
        Leave feedback
      </a>
    </div>
  );
}
