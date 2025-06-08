"use client";

import { useState } from "react";

type ClinicAnswers = {
  clinicName: string;
  doctorName: string;
  specialty: string;
  tone: string;
  languages: string[];
  notes: string;
};

export default function PromptGenerator() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold text-center text-gray-800">Assistant Setup Coming Soon</h2>
      <p className="text-center text-gray-500">
        This step will help you personalize your assistant's behavior using AI — we'll come back to it later.
      </p>
    </div>
  );
}