"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleGoogleLogin() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Check your email for a login link!");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0B0B] px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center">
          <h1
            className="text-4xl font-normal text-[#E8E0D4] tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            fitted.
          </h1>
          <p className="mt-2 text-sm text-[#8A817A]">
            Sign in to your workspace
          </p>
        </div>

        {/* Google OAuth */}
        <Button
          onClick={handleGoogleLogin}
          variant="outline"
          className="w-full h-11 bg-[#1A1816] border-[#2A2520] text-[#E8E0D4] hover:bg-[#2A2520] hover:text-[#E8E0D4] cursor-pointer"
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </Button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#2A2520]" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-[#0B0B0B] px-2 text-[#5A534D]">
              or continue with email
            </span>
          </div>
        </div>

        {/* Magic Link */}
        <form onSubmit={handleMagicLink} className="space-y-4">
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-11 bg-[#1A1816] border-[#2A2520] text-[#E8E0D4] placeholder:text-[#5A534D] focus-visible:ring-[#D4734E]"
          />
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-[#D4734E] text-[#0B0B0B] hover:bg-[#E8845D] cursor-pointer font-medium"
          >
            {loading ? "Sending link..." : "Send Magic Link"}
          </Button>
        </form>

        {message && (
          <p
            className={`text-sm text-center ${
              message.includes("Check") ? "text-[#5EC69A]" : "text-[#E87D5F]"
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
