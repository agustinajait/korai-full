import { GlassCard } from "../ui/glass-card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  className?: string;
}

export function StatCard({ title, value, icon, trend, trendValue, className }: StatCardProps) {
  return (
    <GlassCard className={cn("p-5 flex flex-col gap-2", className)}>
      <div className="flex justify-between items-start">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</h3>
        {icon && <div className="text-primary/80">{icon}</div>}
      </div>
      <div className="flex items-end gap-3 mt-1">
        <span className="text-3xl font-display font-bold text-foreground">{value}</span>
        {trend && (
          <span className={cn(
            "text-xs font-bold px-2 py-0.5 rounded-full mb-1.5",
            trend === "up" && "bg-green-500/20 text-green-400",
            trend === "down" && "bg-red-500/20 text-red-400",
            trend === "neutral" && "bg-yellow-500/20 text-yellow-400",
          )}>
            {trendValue}
          </span>
        )}
      </div>
    </GlassCard>
  );
}
