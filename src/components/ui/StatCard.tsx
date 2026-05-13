import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: "lavender" | "peach" | "mint";
  trend?: string;
}

const colorMap = {
  lavender: { bg: "bg-[#F3EFFF]", icon: "bg-[#7C6FF7] text-white", text: "text-[#7C6FF7]" },
  peach: { bg: "bg-[#FFF0E8]", icon: "bg-[#F97316] text-white", text: "text-[#F97316]" },
  mint: { bg: "bg-[#E8F8F0]", icon: "bg-[#22C55E] text-white", text: "text-[#22C55E]" },
};

export function StatCard({ title, value, icon: Icon, color = "lavender", trend }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className={cn("clay-card p-6", c.bg)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-600 text-gray-500 mb-1">{title}</p>
          <p className={cn("text-4xl font-900", c.text)}>{value}</p>
          {trend && <p className="text-xs text-gray-400 mt-1">{trend}</p>}
        </div>
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", c.icon)}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
