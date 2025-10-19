import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";

export const LoadingState = () => {
  return (
    <Card className="p-12 shadow-lg">
      <div className="flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-primary animate-pulse"></div>
          <Loader2 className="w-12 h-12 text-primary-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin" />
        </div>
        
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-semibold text-foreground">Analyzing Match...</h3>
          <p className="text-muted-foreground">
            AI is comparing the CV with job requirements
          </p>
        </div>

        <div className="flex gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }}></div>
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }}></div>
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }}></div>
        </div>
      </div>
    </Card>
  );
};
