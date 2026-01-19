import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { motion, HTMLMotionProps } from "framer-motion";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export function GlassCard({ children, className, hoverEffect = false, ...props }: GlassCardProps) {
  return (
    <motion.div 
      className={cn(
        "glass rounded-3xl p-6 relative overflow-hidden",
        hoverEffect && "hover:bg-white/10 transition-colors duration-300",
        className
      )}
      {...props}
    >
      <div className="relative z-10">{children}</div>
      {/* Subtle shine effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-50 pointer-events-none" />
    </motion.div>
  );
}
