import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AuthButton } from "@/components/AuthButton";
import { BetaBanner } from "@/components/BetaBanner";
import { Sparkles, LayoutDashboard, BookMarked, Home } from "lucide-react";

interface HeaderProps {
  showDashboardLink?: boolean;
  showHomeLink?: boolean;
  showMyLettersLink?: boolean;
}

export const Header = ({ 
  showDashboardLink = true, 
  showHomeLink = false,
  showMyLettersLink = true 
}: HeaderProps) => {
  return (
    <>
      <BetaBanner />
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">MatchAI</h1>
              <span className="text-[10px] md:text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 border border-amber-500/30">
                Beta
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {showHomeLink && (
              <Link to="/">
                <Button variant="outline" className="gap-2">
                  <Home className="w-4 h-4" />
                  <span className="hidden sm:inline">Home</span>
                </Button>
              </Link>
            )}
            {showMyLettersLink && (
              <Link to="/my-letters">
                <Button variant="outline" className="gap-2">
                  <BookMarked className="w-4 h-4" />
                  <span className="hidden sm:inline">My Letters</span>
                </Button>
              </Link>
            )}
            {showDashboardLink && (
              <Link to="/dashboard">
                <Button variant="outline" className="gap-2">
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline">Employer Dashboard</span>
                </Button>
              </Link>
            )}
            <AuthButton />
          </div>
        </div>
      </div>
    </header>
    </>
  );
};
