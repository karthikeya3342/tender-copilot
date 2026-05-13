"use client";
import { cn } from "@/lib/utils";

interface ClayCardProps {
  children: React.ReactNode;
  className?: string;
  color?: "white" | "peach" | "mint" | "lavender" | "yellow";
  onClick?: () => void;
}

const colorMap = {
  white: "bg-white",
  peach: "bg-[#FFF0E8]",
  mint: "bg-[#E8F8F0]",
  lavender: "bg-[#F3EFFF]",
  yellow: "bg-[#FFFBEA]",
};

export function ClayCard({ children, className, color = "white", onClick }: ClayCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "clay-card p-6",
        colorMap[color],
        onClick && "cursor-pointer hover:scale-[1.01] transition-transform duration-200",
        className
      )}
    >
      {children}
    </div>
  );
}
