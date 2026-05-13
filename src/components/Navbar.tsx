"use client";
import { useState, useRef, useEffect } from "react";
import { Zap, Bell, User, ChevronDown, LogOut, Settings, Globe } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/lib/LanguageContext";
import { cn } from "@/lib/utils";

interface NavbarProps {
  role?: "admin" | "explorer" | "msme";
  userName?: string;
}

const roleConfig = {
  admin: { label: "Admin", color: "bg-[#F97316] text-white", path: "/admin" },
  explorer: { label: "Explorer", color: "bg-[#7C6FF7] text-white", path: "/explorer" },
  msme: { label: "MSME", color: "bg-[#22C55E] text-white", path: "/dashboard" },
};

export function Navbar({ role = "msme", userName = "User" }: NavbarProps) {
  const rc = roleConfig[role];
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { lang, setLang, t } = useLang();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.replace("/login");
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/70 backdrop-blur-md border-b border-white/50"
      style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06), 0 1px 0 rgba(255,255,255,0.8)" }}
    >
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-[#7C6FF7] flex items-center justify-center"
            style={{ boxShadow: "inset 1px 1px 3px rgba(255,255,255,0.4), 2px 2px 8px rgba(124,111,247,0.4)" }}
          >
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <span className="text-xl font-black text-[#2D2D2D]">
            Tender<span className="text-[#7C6FF7]">Copilot</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <span className={cn("clay-badge px-3 py-1", rc.color)}>{rc.label}</span>

          <button className="w-9 h-9 rounded-xl bg-[#F3EFFF] flex items-center justify-center relative"
            style={{ boxShadow: "inset 1px 1px 3px rgba(255,255,255,0.8), 2px 2px 6px rgba(0,0,0,0.06)" }}
          >
            <Bell className="w-4 h-4 text-[#7C6FF7]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#F97316]" />
          </button>

          {/* Profile dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 clay-card-sm px-3 py-2"
            >
              <div className="w-7 h-7 rounded-full bg-[#7C6FF7] flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-bold text-gray-700 max-w-[120px] truncate">{userName}</span>
              <ChevronDown className={cn("w-3 h-3 text-gray-400 transition-transform", menuOpen && "rotate-180")} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 clay-card bg-white py-1 z-50"
                style={{ boxShadow: "4px 4px 20px rgba(0,0,0,0.12), inset 1px 1px 3px rgba(255,255,255,0.9)" }}
              >
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-xs text-gray-400 font-semibold">{t.signedInAs}</p>
                  <p className="text-sm font-bold text-gray-700 truncate">{userName}</p>
                </div>

                <Link
                  href={rc.path}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-[#F3EFFF] hover:text-[#7C6FF7] transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  {t.myDashboard}
                </Link>
                {role === "msme" && (
                  <Link
                    href="/settings"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-[#F3EFFF] hover:text-[#7C6FF7] transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Edit Profile
                  </Link>
                )}

                {/* Language toggle */}
                <div className="px-4 py-2.5 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{t.language}</span>
                  </div>
                  <div className="flex gap-2">
                    {(["en", "kn"] as const).map((l) => (
                      <button
                        key={l}
                        onClick={() => setLang(l)}
                        className={cn(
                          "flex-1 py-1.5 rounded-xl text-xs font-bold transition-all",
                          lang === l
                            ? "bg-[#7C6FF7] text-white"
                            : "bg-[#F3EFFF] text-[#7C6FF7] hover:bg-[#E8E3FF]"
                        )}
                        style={lang === l ? { boxShadow: "inset 1px 1px 3px rgba(255,255,255,0.3)" } : {}}
                      >
                        {l === "en" ? "🇬🇧 EN" : "🇮🇳 ಕನ್ನಡ"}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-[#DC2626] hover:bg-[#FEF2F2] transition-colors border-t border-gray-100"
                >
                  <LogOut className="w-4 h-4" />
                  {t.signOut}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
