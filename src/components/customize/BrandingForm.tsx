"use client";

import React from "react";
import clsx from "clsx";

type Props = {
  backgroundStyle: string;
  // other props...
};

const BrandingForm = ({ backgroundStyle }: Props) => {
  return (
    <div
      className={clsx(
        "chat-container",
        backgroundStyle === "calm-gradient" && "bg-gradient-to-br from-[#0f172a] to-[#1e293b]",
        backgroundStyle === "light" && "bg-white",
        backgroundStyle === "dark" && "bg-[#111827]"
      )}
    >
      {/* chat interface content */}
    </div>
  );
};

export default BrandingForm;