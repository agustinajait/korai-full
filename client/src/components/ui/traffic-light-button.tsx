import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TrafficLightButtonProps {
  color: "verde" | "amarillo" | "rojo";
  label: string;
  subLabel?: string;
  selected?: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const VARIANTS = {
  verde: {
    base: "border-green-500/30 bg-green-500/5 hover:bg-green-500/20 text-green-100",
    active: "bg-green-500/20 border-green-500 ring-2 ring-green-500/50 shadow-[0_0_30px_-5px_hsl(142,71%,45%)]",
    dot: "bg-green-500"
  },
  amarillo: {
    base: "border-yellow-500/30 bg-yellow-500/5 hover:bg-yellow-500/20 text-yellow-100",
    active: "bg-yellow-500/20 border-yellow-500 ring-2 ring-yellow-500/50 shadow-[0_0_30px_-5px_hsl(38,92%,50%)]",
    dot: "bg-yellow-500"
  },
  rojo: {
    base: "border-red-500/30 bg-red-500/5 hover:bg-red-500/20 text-red-100",
    active: "bg-red-500/20 border-red-500 ring-2 ring-red-500/50 shadow-[0_0_30px_-5px_hsl(0,84%,60%)]",
    dot: "bg-red-500"
  }
};

export function TrafficLightButton({ color, label, subLabel, selected, onClick, disabled }: TrafficLightButtonProps) {
  const variant = VARIANTS[color];

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={() => {
        if (!disabled) {
          if (navigator.vibrate) navigator.vibrate(15);
          onClick();
        }
      }}
      disabled={disabled}
      className={cn(
        "relative w-full p-5 rounded-2xl border-2 transition-all duration-300 flex items-center gap-4 text-left group",
        variant.base,
        selected && variant.active,
        disabled && "opacity-50 cursor-not-allowed grayscale"
      )}
    >
      <div className={cn(
        "w-6 h-6 rounded-full shadow-lg border-2 border-white/20 flex items-center justify-center transition-all",
        variant.dot,
        selected ? "scale-110" : "scale-100 group-hover:scale-105"
      )}>
        {selected && (
          <motion.svg 
            initial={{ scale: 0 }} 
            animate={{ scale: 1 }} 
            className="w-3.5 h-3.5 text-black font-bold" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="4" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </motion.svg>
        )}
      </div>
      
      <div className="flex flex-col">
        <span className="font-display font-bold text-lg leading-tight">{label}</span>
        {subLabel && <span className="text-xs opacity-70 font-medium">{subLabel}</span>}
      </div>

      {selected && (
        <motion.div
          layoutId="glow"
          className="absolute inset-0 rounded-2xl bg-white/5 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}
    </motion.button>
  );
}
