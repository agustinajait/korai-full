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
    base: "border-green-400 bg-green-50 hover:bg-green-100 text-green-900",
    active: "bg-green-100 border-green-500 ring-2 ring-green-400/50 shadow-[0_0_20px_-5px_rgba(34,197,94,0.4)]",
    dot: "bg-green-500"
  },
  amarillo: {
    base: "border-yellow-400 bg-yellow-50 hover:bg-yellow-100 text-yellow-900",
    active: "bg-yellow-100 border-yellow-500 ring-2 ring-yellow-400/50 shadow-[0_0_20px_-5px_rgba(234,179,8,0.4)]",
    dot: "bg-yellow-500"
  },
  rojo: {
    base: "border-red-400 bg-red-50 hover:bg-red-100 text-red-900",
    active: "bg-red-100 border-red-500 ring-2 ring-red-400/50 shadow-[0_0_20px_-5px_rgba(239,68,68,0.4)]",
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
            className="w-3.5 h-3.5 text-white font-bold" 
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
