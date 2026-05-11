import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  color?: "blue" | "green" | "purple" | "orange" | "red";
}

const colorMap = {
  blue: { bg: "bg-blue-50", icon: "bg-blue-100 text-blue-600", text: "text-blue-600" },
  green: { bg: "bg-green-50", icon: "bg-green-100 text-green-600", text: "text-green-600" },
  purple: { bg: "bg-purple-50", icon: "bg-purple-100 text-purple-600", text: "text-purple-600" },
  orange: { bg: "bg-orange-50", icon: "bg-orange-100 text-orange-600", text: "text-orange-600" },
  red: { bg: "bg-red-50", icon: "bg-red-100 text-red-600", text: "text-red-600" },
};

export default function StatCard({ title, value, icon: Icon, trend, trendUp, color = "blue" }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className="card p-5 flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {trend && (
          <p className={cn("text-xs mt-1", trendUp ? "text-green-600" : "text-red-500")}>
            {trendUp ? "↑" : "↓"} {trend}
          </p>
        )}
      </div>
      <div className={cn("p-3 rounded-xl", c.icon)}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
}
