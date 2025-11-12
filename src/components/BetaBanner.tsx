import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";

const BANNER_DISMISSED_KEY = "matchai.beta.banner.dismissed";

export const BetaBanner = () => {
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    // Check if banner was previously dismissed
    const dismissed = localStorage.getItem(BANNER_DISMISSED_KEY);
    setIsDismissed(dismissed === "true");
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(BANNER_DISMISSED_KEY, "true");
    setIsDismissed(true);
  };

  if (isDismissed) return null;

  return (
    <div className="h-9 bg-muted/60 border-b border-border sticky top-0 z-50 flex items-center justify-center px-4">
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex-1 text-center">
          <p className="text-xs md:text-sm text-foreground">
            MatchAI is in Beta. We're actively improving based on your feedback.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/feedback">
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
              <MessageSquare className="w-3 h-3" />
              <span className="hidden sm:inline">Give Feedback</span>
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={handleDismiss}
            aria-label="Dismiss banner"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};
