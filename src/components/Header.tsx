import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AuthButton } from "@/components/AuthButton";
import { BetaBanner } from "@/components/BetaBanner";
import { LanguageSelector } from "@/components/LanguageSelector";
import { Sparkles, LayoutDashboard, BookMarked, Home, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

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
  const [isAdmin, setIsAdmin] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase.rpc('has_role', { 
        _user_id: user.id, 
        _role: 'admin' 
      });
      
      setIsAdmin(data === true);
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

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
              <span className="text-xs font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                Beta
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <LanguageSelector />
            {showHomeLink && (
              <Link to="/">
                <Button variant="outline" className="gap-2">
                  <Home className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('header.home')}</span>
                </Button>
              </Link>
            )}
            {showMyLettersLink && (
              <Link to="/my-letters">
                <Button variant="outline" className="gap-2">
                  <BookMarked className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('header.myLetters')}</span>
                </Button>
              </Link>
            )}
            {showDashboardLink && (
              <Link to="/dashboard">
                <Button variant="outline" className="gap-2">
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('header.dashboard')}</span>
                </Button>
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin">
                <Button variant="outline" className="gap-2">
                  <Shield className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('header.admin')}</span>
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
