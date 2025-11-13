import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { UploadSection } from "@/components/UploadSection";
import { MatchResult } from "@/components/MatchResult";
import { LoadingState } from "@/components/LoadingState";
import { MatchHistory } from "@/components/MatchHistory";
import { CoverLetterGenerator } from "@/components/CoverLetterGenerator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles } from "lucide-react";
import { Header } from "@/components/Header";

interface MatchResultData {
  score: number;
  summary: string;
  matchingSkills: string[];
  missingSkills: string[];
  extraSkills: string[];
  confidence_score?: number;
  weights?: {
    must: number;
    should: number;
    nice_bonus: number;
  };
  evidence?: Array<{ quote: string; source: string }>;
  star?: Array<{ s: string; t: string; a: string; r: string }>;
  tips?: Array<{ text: string; estimated_gain: 'low' | 'medium' | 'high' }>;
  bias_alert?: {
    flagged: Array<{ phrase: string; reason: string; alt: string }>;
  };
  candidate_name?: string;
  job_title?: string;
  company?: string;
  created_at_iso?: string;
  language?: 'en' | 'sv' | 'ar';
}

interface HistoryItem {
  id: string;
  timestamp: number;
  score: number;
  cvName?: string;
  result: MatchResultData;
}

const Index = () => {
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvText, setCvText] = useState("");
  const [jobFile, setJobFile] = useState<File | null>(null);
  const [jobText, setJobText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [matchResult, setMatchResult] = useState<MatchResultData | null>(null);
  const [analyzedCvText, setAnalyzedCvText] = useState("");
  const [analyzedJobText, setAnalyzedJobText] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [user, setUser] = useState<any>(null);
  const [hasUsedDailyAnalysis, setHasUsedDailyAnalysis] = useState(false);
  const [isCheckingQuota, setIsCheckingQuota] = useState(true);
  const { toast } = useToast();

  // Check auth status and daily quota
  useEffect(() => {
    const checkAuthAndQuota = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);

        if (session?.user) {
          console.log('Checking quota for user:', session.user.id);
          // Check if user has used their daily analysis
          const { data, error } = await supabase
            .from('analysis_logs' as any)
            .select('created_at')
            .eq('user_id', session.user.id)
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (error) {
            console.error('Error checking analysis quota:', error);
            setHasUsedDailyAnalysis(false);
          } else if (data && 'created_at' in data) {
            console.log('User has used daily analysis at:', (data as any).created_at);
            setHasUsedDailyAnalysis(true);
          } else {
            console.log('User has not used daily analysis yet');
            setHasUsedDailyAnalysis(false);
          }
        } else {
          console.log('No user session found');
          setHasUsedDailyAnalysis(false);
        }
      } catch (err) {
        console.error('Error in checkAuthAndQuota:', err);
        setHasUsedDailyAnalysis(false);
      } finally {
        setIsCheckingQuota(false);
      }
    };

    checkAuthAndQuota();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user || null);
      if (!session?.user) {
        setHasUsedDailyAnalysis(false);
        setIsCheckingQuota(false);
      } else {
        // Re-check quota when auth state changes
        setIsCheckingQuota(true);
        try {
          const { data, error } = await supabase
            .from('analysis_logs' as any)
            .select('created_at')
            .eq('user_id', session.user.id)
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!error && data) {
            setHasUsedDailyAnalysis(true);
          } else {
            setHasUsedDailyAnalysis(false);
          }
        } catch (err) {
          console.error('Error checking quota on auth change:', err);
          setHasUsedDailyAnalysis(false);
        } finally {
          setIsCheckingQuota(false);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem("matchHistory");
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error("Failed to load history:", error);
      }
    }
  }, []);

  // Save history to localStorage
  const saveToHistory = (result: MatchResultData) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      score: result.score,
      cvName: cvFile?.name,
      result,
    };
    const newHistory = [newItem, ...history].slice(0, 10); // Keep last 10
    setHistory(newHistory);
    localStorage.setItem("matchHistory", JSON.stringify(newHistory));
  };

  const readFileAsText = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const handleAnalyze = async () => {
    // Check if user is logged in
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to use the analysis feature.",
        variant: "destructive",
      });
      return;
    }

    // Check if user has already used their daily analysis
    if (hasUsedDailyAnalysis) {
      toast({
        title: "Daily limit reached",
        description: "You can only run one analysis every 24 hours. Please try again tomorrow.",
        variant: "destructive",
      });
      return;
    }

    // Validate inputs
    const cvContent = cvText || (cvFile ? await readFileAsText(cvFile) : "");
    const jobContent = jobText || (jobFile ? await readFileAsText(jobFile) : "");

    if (!cvContent || !jobContent) {
      toast({
        title: "Missing Information",
        description: "Please provide both CV and job description",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      const { data, error } = await supabase.functions.invoke("match-cv", {
        body: {
          cvText: cvContent,
          jobDescription: jobContent,
          candidateName: cvFile?.name?.replace(/\.[^/.]+$/, "") || "Candidate",
          jobTitle: "Position", // Can be extracted from job description in future
          company: "Company", // Can be extracted from job description in future
          language: "en" // Default to English, can be made configurable
        },
      });

      if (error) {
        // Handle rate limit error
        if (error.message?.includes('daily_limit_reached') || data?.error === 'daily_limit_reached') {
          setHasUsedDailyAnalysis(true);
          toast({
            title: "Daily limit reached",
            description: "You can only run one analysis every 24 hours. Please try again tomorrow.",
            variant: "destructive",
          });
          setIsAnalyzing(false);
          return;
        }
        
        // Handle authentication error
        if (error.message?.includes('authentication_required') || data?.error === 'authentication_required') {
          toast({
            title: "Login Required",
            description: "Please log in to use the analysis feature.",
            variant: "destructive",
          });
          setIsAnalyzing(false);
          return;
        }
        
        throw error;
      }

      setMatchResult(data);
      setAnalyzedCvText(cvContent);
      setAnalyzedJobText(jobContent);
      saveToHistory(data);
      setHasUsedDailyAnalysis(true); // Mark as used after successful analysis
      
      toast({
        title: "Analysis Complete!",
        description: `Match score: ${data.score}%`,
      });
    } catch (error: any) {
      console.error("Analysis error:", error);
      
      let errorMessage = "Failed to analyze match. Please try again.";
      if (error.message?.includes("429")) {
        errorMessage = "Too many requests. Please wait a moment and try again.";
      } else if (error.message?.includes("402")) {
        errorMessage = "AI usage limit reached. Please contact support.";
      }
      
      toast({
        title: "Analysis Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setCvFile(null);
    setCvText("");
    setJobFile(null);
    setJobText("");
    setMatchResult(null);
    setAnalyzedCvText("");
    setAnalyzedJobText("");
  };

  const canAnalyze = (cvFile || cvText) && (jobFile || jobText);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      {/* Header */}
      <Header showDashboardLink={true} showMyLettersLink={true} />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        {!matchResult ? (
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Upload Sections */}
            <div className="grid md:grid-cols-2 gap-8">
              <UploadSection
                title="Upload CV"
                description="Upload the candidate's CV or paste the content"
                onFileSelect={setCvFile}
                onTextChange={setCvText}
                selectedFile={cvFile}
                textContent={cvText}
              />
              <UploadSection
                title="Upload Job Description"
                description="Upload the job posting or paste the description"
                onFileSelect={setJobFile}
                onTextChange={setJobText}
                selectedFile={jobFile}
                textContent={jobText}
              />
            </div>

            {/* Analyze Button */}
            <div className="flex flex-col items-center gap-3">
              {!isCheckingQuota && user && (
                <div className={`px-4 py-2 rounded-md ${hasUsedDailyAnalysis ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                  <p className="text-sm font-medium text-center">
                    {hasUsedDailyAnalysis 
                      ? "You've used today's free analysis. Try again in 24 hours." 
                      : "You have 1 free analysis available today."}
                  </p>
                </div>
              )}
              {!isCheckingQuota && !user && (
                <div className="px-4 py-2 rounded-md bg-muted">
                  <p className="text-sm font-medium text-muted-foreground text-center">
                    Please log in to use the analysis feature.
                  </p>
                </div>
              )}
              <Button
                size="lg"
                onClick={handleAnalyze}
                disabled={!canAnalyze || isAnalyzing || hasUsedDailyAnalysis || !user || isCheckingQuota}
                className="gap-2 px-8 py-6 text-lg"
              >
                {isAnalyzing ? (
                  <>
                    <Sparkles className="w-5 h-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Analyze Match
                  </>
                )}
              </Button>
            </div>

            {/* History */}
            {history.length > 0 && (
              <MatchHistory
                history={history}
                onClearHistory={() => {
                  setHistory([]);
                  localStorage.removeItem("matchHistory");
                  toast({
                    title: "History Cleared",
                    description: "All match history has been removed",
                  });
                }}
                onSelectMatch={(item) => {
                  setMatchResult(item.result);
                }}
              />
            )}
          </div>
        ) : isAnalyzing ? (
          <div className="max-w-2xl mx-auto">
            <LoadingState />
          </div>
        ) : (
          <div className="max-w-6xl mx-auto space-y-6">
            <MatchResult result={matchResult} onReset={handleReset} cvName={cvFile?.name} />
            
            {/* Cover Letter Generator */}
            <CoverLetterGenerator
              candidateName={matchResult.candidate_name || cvFile?.name?.replace(/\.[^/.]+$/, "") || "Candidate"}
              jobTitle={matchResult.job_title || "Position"}
              company={matchResult.company || "Company"}
              cvText={analyzedCvText}
              jobDescription={analyzedJobText}
              matchSummary={matchResult.summary}
              matchingSkills={matchResult.matchingSkills}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 mt-20">
        <div className="container mx-auto px-6 py-8">
          <p className="text-center text-muted-foreground">
            Built with ❤️ by <span className="font-semibold text-foreground">Mohamed</span>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
