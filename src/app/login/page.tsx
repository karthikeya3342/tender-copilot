"use client";
import { useState } from "react";
import Link from "next/link";
import { Zap, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getRoleFromUser, getRedirectPath } from "@/lib/auth";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const handleLogin = async () => {
    console.log("[login] handleLogin called", { email: email.trim() });
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required");
      return;
    }
    setError("");
    setStatus("");
    setLoading(true);

    try {
      const supabase = createClient();

      setStatus("Signing in…");
      console.log("[login] calling signInWithPassword");
      const { data, error: authErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      console.log("[login] signInWithPassword result", { user: data?.user?.id, session: !!data?.session, authErr });

      if (authErr) {
        setError(authErr.message);
        setLoading(false);
        setStatus("");
        return;
      }

      if (!data.user || !data.session) {
        setError(
          "No session created. Go to Supabase Dashboard → Authentication → Providers → Email → disable \"Confirm email\"."
        );
        setLoading(false);
        setStatus("");
        return;
      }

      setStatus("Redirecting…");

      const role = getRoleFromUser(data.user);
      const path = getRedirectPath(role);
      console.log("[login] redirecting to", path, "role:", role);

      // Wait one tick for the browser to write the session cookie, then hard navigate
      setTimeout(() => {
        console.log("[login] firing window.location.replace", path);
        window.location.replace(path);
      }, 150);

    } catch (err) {
      console.error("[login] caught error", err);
      setError(err instanceof Error ? err.message : "Unexpected error");
      setLoading(false);
      setStatus("");
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF6ED] flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">

        {/* Logo */}
        <div className="flex items-center gap-3 justify-center">
          <div className="w-11 h-11 rounded-xl bg-[#7C6FF7] flex items-center justify-center"
            style={{ boxShadow: "inset 2px 2px 5px rgba(255,255,255,0.4), 4px 4px 14px rgba(124,111,247,0.4)" }}>
            <Zap className="w-6 h-6 text-white fill-white" />
          </div>
          <h1 className="text-2xl font-black text-gray-800">
            Tender<span className="text-[#7C6FF7]">Copilot</span>
          </h1>
        </div>

        {/* Card */}
        <div className="clay-card bg-white p-8 space-y-5">
          <div className="text-center">
            <h2 className="text-xl font-black text-gray-800">Welcome back</h2>
            <p className="text-sm text-gray-400 font-medium mt-1">Sign in to your account</p>
          </div>

          {error && (
            <div className="p-3 rounded-2xl bg-[#FEF2F2] text-[#DC2626] text-sm font-semibold leading-relaxed"
              style={{ boxShadow: "inset 2px 2px 5px rgba(255,255,255,0.6)" }}>
              ⚠️ {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !loading && handleLogin()}
                  placeholder="you@company.com"
                  autoComplete="email"
                  disabled={loading}
                  className="w-full clay-inset pl-10 pr-4 py-3 text-sm text-gray-700 font-medium outline-none placeholder:text-gray-300 disabled:opacity-60"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !loading && handleLogin()}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={loading}
                  className="w-full clay-inset pl-10 pr-12 py-3 text-sm text-gray-700 font-medium outline-none placeholder:text-gray-300 disabled:opacity-60"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleLogin}
              disabled={loading}
              className={cn(
                "w-full py-3 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all",
                "bg-[#7C6FF7] text-white",
                loading ? "opacity-80 cursor-not-allowed" : "hover:bg-[#6B5EE6] active:scale-[0.98]"
              )}
              style={{ boxShadow: "inset 2px 2px 4px rgba(255,255,255,0.3), inset -1px -1px 3px rgba(0,0,0,0.15), 3px 3px 12px rgba(124,111,247,0.35)" }}
            >
              {loading
                ? <><Loader2 className="w-5 h-5 animate-spin" /> {status || "Please wait…"}</>
                : "Sign In"
              }
            </button>
          </div>

          <p className="text-center text-sm text-gray-400 font-medium">
            No account?{" "}
            <Link href="/signup" className="text-[#7C6FF7] font-bold hover:underline">Sign up</Link>
          </p>
        </div>

      </div>
    </div>
  );
}
