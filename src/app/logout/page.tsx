"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    fetch("/api/logout").then(() => {
      router.replace("/login");
    });
  }, [router]);

  return <div>Logging out...</div>;
} 