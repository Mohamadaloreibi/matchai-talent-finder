import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { UploadSection } from "@/components/UploadSection";
import { MatchResult } from "@/components/MatchResult";
import { LoadingState } from "@/components/LoadingState";
import { MatchHistory } from "@/components/MatchHistory";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, LayoutDashboard } from "lucide-react";
import { Link } from "react-router-dom";

interface MatchResultData {
  score: number;
  summary: string;
  matchingSkills: string[];
  missingSkills: string[];
  extraSkills: string[];
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
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const { toast } = useToast();

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
        },
      });

      if (error) throw error;

      setMatchResult(data);
      saveToHistory(data);
      
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
  };

  const canAnalyze = (cvFile || cvText) && (jobFile || jobText);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">MatchAI</h1>
            </div>
            <Link to="/dashboard">
              <Button variant="outline" className="gap-2">
                <LayoutDashboard className="w-4 h-4" />
                Employer Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

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
            <div className="flex justify-center">
              <Button
                size="lg"
                onClick={handleAnalyze}
                disabled={!canAnalyze || isAnalyzing}
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
          <div className="max-w-6xl mx-auto">
            <MatchResult result={matchResult} onReset={handleReset} cvName={cvFile?.name} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 mt-20">
        <div className="container mx-auto px-6 py-8">
          <p className="text-center text-muted-foreground">
            Built with ❤️ by <span className="font-semibold text-foreground">Futurearc</span>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
