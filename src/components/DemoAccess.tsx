"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DemoAccess() {
  const [code, setCode] = useState("");
  const [isWrong, setIsWrong] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (code.toUpperCase() === 'DEMO') {
      router.push('/founder-demo/fort-worth-eye');
    } else {
      setIsWrong(true);
      setTimeout(() => setIsWrong(false), 2000);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter demo code"
            className={`w-full px-4 py-3 rounded-lg border text-center text-lg font-mono tracking-wider uppercase focus:outline-none focus:ring-2 transition-colors ${
              isWrong 
                ? 'border-red-500 bg-red-50 text-red-700 focus:ring-red-500' 
                : 'border-gray-300 bg-white text-gray-900 focus:ring-cyan-500'
            }`}
            maxLength={10}
          />
          {isWrong && (
            <p className="text-red-400 text-sm mt-2 animate-pulse">
              Invalid code. Please try again.
            </p>
          )}
        </div>
        <button
          type="submit"
          className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          Access Demo
        </button>
      </form>
      
      <p className="text-gray-500 text-sm mt-4">
        Demo access is restricted to authorized users only.
      </p>
    </div>
  );
}