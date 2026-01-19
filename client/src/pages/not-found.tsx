import { GlassCard } from "@/components/ui/glass-card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <GlassCard className="max-w-md w-full p-6 text-center">
        <div className="flex justify-center mb-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">404 Page Not Found</h1>
        <p className="text-muted-foreground mb-4">
          Did you forget to add the page to the router?
        </p>
      </GlassCard>
    </div>
  );
}
