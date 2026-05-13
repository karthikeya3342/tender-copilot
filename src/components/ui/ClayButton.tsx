"use client";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ClayButtonProps {
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit";
}

const variantMap = {
  primary: "bg-[#7C6FF7] text-white hover:bg-[#6B5EE6]",
  secondary: "bg-[#F97316] text-white hover:bg-[#E8620A]",
  ghost: "bg-white text-[#7C6FF7] hover:bg-[#F3EFFF]",
  danger: "bg-[#EF4444] text-white hover:bg-[#DC2626]",
  success: "bg-[#22C55E] text-white hover:bg-[#16A34A]",
};

const sizeMap = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
};

export function ClayButton({
  children,
  className,
  variant = "primary",
  size = "md",
  onClick,
  disabled,
  loading,
  type = "button",
}: ClayButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "clay-btn font-bold flex items-center gap-2 justify-center",
        "active:scale-[0.97] transition-all duration-150",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variantMap[variant],
        sizeMap[size],
        className
      )}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}
