"use client";

import { useState } from "react";
import { buttonClassName } from "@/components/ui/button";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore — clear locally regardless
    }
    window.location.replace("/login");
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className={buttonClassName("secondary", "default", "w-full")}
    >
      {loading ? "Signing out..." : "Log out"}
    </button>
  );
}
