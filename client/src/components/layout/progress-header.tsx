import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { INSTRUMENT } from "@/lib/instrument";

interface ProgressHeaderProps {
  currentStep: number;
  totalSteps: number;
  currentDimensionId: string;
}

export function ProgressHeader({ currentStep, totalSteps, currentDimensionId }: ProgressHeaderProps) {
  const progress = Math.min(100, (currentStep / totalSteps) * 100);
  const dimension = INSTRUMENT.dimensions.find(d => d.id === currentDimensionId);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-[#F4F0FF]/90 backdrop-blur-md border-b border-[#DDD6FE] px-4 py-3">
      <div className="max-w-xl mx-auto flex flex-col gap-2">
        <div className="flex justify-between items-center text-xs font-bold text-[#6B5FA0] uppercase tracking-widest">
          <motion.span 
            key={dimension?.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[#5B21B6]"
          >
            {dimension?.emoji} {dimension?.name}
          </motion.span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-1.5 bg-[#DDD6FE]" indicatorClassName="bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] transition-all duration-500 ease-out" />
      </div>
    </div>
  );
}
