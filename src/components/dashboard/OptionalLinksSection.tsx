

"use client";

import Link from "next/link";

export default function OptionalLinksSection() {
  return (
    <div className="mt-12 text-center text-sm text-blue-200 space-y-3">
      <p>
        📺{" "}
        <Link href="/demo" className="underline hover:text-white transition">
          View Assistant Demo
        </Link>
      </p>
      <p>
        ❓{" "}
        <Link href="/help/questions" className="underline hover:text-white transition">
          See What Patients Can Ask
        </Link>
      </p>
      <p>
        🧠{" "}
        <Link href="/help" className="underline hover:text-white transition">
          Visit Help Center
        </Link>
      </p>
    </div>
  );
}