import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UploadSection } from "@/components/UploadSection";
import { CandidateTable } from "@/components/CandidateTable";
import { LoadingState } from "@/components/LoadingState";
import { ComparisonDialog } from "@/components/ComparisonDialog";
import { Sparkles, FileDown, Home, Users, X } from "lucide-react";
import { Link } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface CandidateResult {
  id: string;
  name: string;
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
}

interface DashboardData {
  id: string;
  jobDescription: string;
  candidates: CandidateResult[];
  timestamp: number;
}

const Dashboard = () => {
  const [jobFile, setJobFile] = useState<File | null>(null);
  const [jobText, setJobText] = useState("");
  const [cvFiles, setCvFiles] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentDashboard, setCurrentDashboard] = useState<DashboardData | null>(null);
  const [savedDashboards, setSavedDashboards] = useState<DashboardData[]>([]);
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const { toast } = useToast();

  // Load saved dashboards from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("employerDashboards");
    if (saved) {
      try {
        setSavedDashboards(JSON.parse(saved));
      } catch (error) {
        console.error("Failed to load dashboards:", error);
      }
    }
  }, []);

  const readFileAsText = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const handleCvFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // Append new files to existing ones instead of replacing
      const newFiles = Array.from(files);
      setCvFiles(prev => [...prev, ...newFiles]);
    }
    // Reset input value to allow selecting the same file again if needed
    e.target.value = '';
  };

  const handleRemoveCvFile = (index: number) => {
    setCvFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyzeBatch = async () => {
    const jobContent = jobText || (jobFile ? await readFileAsText(jobFile) : "");

    if (!jobContent) {
      toast({
        title: "Missing Job Description",
        description: "Please provide a job description",
        variant: "destructive",
      });
      return;
    }

    if (cvFiles.length === 0) {
      toast({
        title: "No CVs Selected",
        description: "Please upload at least one CV",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    const results: CandidateResult[] = [];

    try {
      for (const cvFile of cvFiles) {
        const cvContent = await readFileAsText(cvFile);
        
        const { data, error } = await supabase.functions.invoke("match-cv", {
          body: {
            cvText: cvContent,
            jobDescription: jobContent,
            candidateName: cvFile.name.replace(/\.[^/.]+$/, ""),
            jobTitle: "Position", // Can be extracted from job description
            company: "Company", // Can be extracted from job description
            language: "en" // Default to English
          },
        });

        if (error) {
          console.error(`Error analyzing ${cvFile.name}:`, error);
          continue;
        }

        results.push({
          id: Date.now().toString() + Math.random(),
          name: cvFile.name.replace(/\.[^/.]+$/, ""),
          score: data.score,
          summary: data.summary,
          matchingSkills: data.matchingSkills,
          missingSkills: data.missingSkills,
          extraSkills: data.extraSkills,
          confidence_score: data.confidence_score,
          weights: data.weights,
          evidence: data.evidence,
          star: data.star,
          tips: data.tips,
          bias_alert: data.bias_alert,
        });
      }

      const dashboard: DashboardData = {
        id: Date.now().toString(),
        jobDescription: jobContent.substring(0, 200) + "...",
        candidates: results,
        timestamp: Date.now(),
      };

      setCurrentDashboard(dashboard);
      
      // Save to localStorage
      const updated = [dashboard, ...savedDashboards].slice(0, 5);
      setSavedDashboards(updated);
      localStorage.setItem("employerDashboards", JSON.stringify(updated));

      toast({
        title: "Analysis Complete!",
        description: `Analyzed ${results.length} candidates`,
      });
    } catch (error: any) {
      console.error("Batch analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze candidates. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generatePDFReport = () => {
    if (!currentDashboard) return;

    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text("MatchAI - Candidate Analysis Report", 14, 20);
    
    // Date
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    
    // Job Description
    doc.setFontSize(12);
    doc.text("Job Description:", 14, 38);
    doc.setFontSize(10);
    const splitJobDesc = doc.splitTextToSize(currentDashboard.jobDescription, 180);
    doc.text(splitJobDesc, 14, 44);

    // Candidates Table
    const tableData = currentDashboard.candidates.map(c => [
      c.name,
      `${c.score}%`,
      c.summary.substring(0, 100) + "...",
      c.matchingSkills.slice(0, 3).join(", "),
      c.missingSkills.slice(0, 3).join(", "),
    ]);

    autoTable(doc, {
      startY: 60,
      head: [["Candidate", "Score", "Summary", "Top Skills", "Missing Skills"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [37, 99, 235] },
      styles: { fontSize: 8 },
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    doc.setFontSize(8);
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(
        `Built with ❤️ by Mohamed - Page ${i} of ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
    }

    doc.save(`matchai-report-${Date.now()}.pdf`);
    
    toast({
      title: "Report Generated",
      description: "PDF report has been downloaded",
    });
  };

  const handleReset = () => {
    setJobFile(null);
    setJobText("");
    setCvFiles([]);
    setCurrentDashboard(null);
    setSelectedCandidates([]);
  };

  const handleCompare = () => {
    if (selectedCandidates.length < 2) {
      toast({
        title: "Invalid Selection",
        description: "Please select at least 2 candidates to compare",
        variant: "destructive",
      });
      return;
    }
    if (selectedCandidates.length > 6) {
      toast({
        title: "Too Many Selected",
        description: "Please select maximum 6 candidates to compare",
        variant: "destructive",
      });
      return;
    }
    setShowComparison(true);
  };

  const getComparedCandidates = () => {
    if (!currentDashboard) return [];
    return currentDashboard.candidates.filter(c => selectedCandidates.includes(c.id));
  };

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
              <h1 className="text-2xl font-bold text-foreground">MatchAI Dashboard</h1>
            </div>
            <Link to="/">
              <Button variant="outline" className="gap-2">
                <Home className="w-4 h-4" />
                Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        {!currentDashboard ? (
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Job Description Upload */}
            <UploadSection
              title="Upload Job Description"
              description="Upload or paste the job description for this position"
              onFileSelect={setJobFile}
              onTextChange={setJobText}
              selectedFile={jobFile}
              textContent={jobText}
            />

            {/* Multiple CV Upload */}
            <Card className="p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-2">Upload Candidate CVs</h2>
              <p className="text-muted-foreground mb-4">Select multiple CV files to analyze (you can add more files by clicking again)</p>
              
              <div className="space-y-4">
                <input
                  type="file"
                  id="cv-files"
                  className="hidden"
                  accept=".pdf,.txt,.doc,.docx"
                  multiple
                  onChange={handleCvFilesChange}
                />
                <div className="flex gap-2">
                  <label htmlFor="cv-files">
                    <Button type="button" variant="outline" asChild>
                      <span className="cursor-pointer">
                        {cvFiles.length === 0 ? 'Select CV Files' : `Add More CVs (${cvFiles.length} selected)`}
                      </span>
                    </Button>
                  </label>
                  {cvFiles.length > 0 && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={() => setCvFiles([])}
                      className="text-destructive hover:text-destructive"
                    >
                      Clear All
                    </Button>
                  )}
                </div>

                {cvFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium text-foreground">Selected CVs:</p>
                    <div className="flex flex-wrap gap-2">
                      {cvFiles.map((file, idx) => (
                        <div 
                          key={idx} 
                          className="px-3 py-1 bg-secondary/50 rounded-md text-sm text-foreground flex items-center gap-2 group"
                        >
                          {file.name}
                          <button
                            onClick={() => handleRemoveCvFile(idx)}
                            className="text-muted-foreground hover:text-destructive transition-colors ml-1"
                            aria-label={`Remove ${file.name}`}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Analyze Button */}
            <div className="flex justify-center">
              <Button
                size="lg"
                onClick={handleAnalyzeBatch}
                disabled={!jobText && !jobFile || cvFiles.length === 0 || isAnalyzing}
                className="gap-2 px-8 py-6 text-lg"
              >
                {isAnalyzing ? (
                  <>
                    <Sparkles className="w-5 h-5 animate-spin" />
                    Analyzing {cvFiles.length} candidates...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Analyze All Candidates
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : isAnalyzing ? (
          <div className="max-w-2xl mx-auto">
            <LoadingState />
          </div>
        ) : (
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Welcome Card */}
            <Card className="mb-6 p-4 bg-muted/40 border border-muted rounded-lg">
              <h2 className="text-xl font-semibold text-foreground">Welcome to MatchAI Dashboard</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Analyze and rank candidates instantly based on their CVs and the job description. 
                MatchAI helps you identify top matches, skill gaps, and unique strengths — all powered by AI.
              </p>
            </Card>

            {/* Header with Actions */}
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-lg font-semibold text-foreground">AI-Powered Candidate Analysis</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Each score is calculated by comparing the candidate's CV to the job description with AI. 
                  Green = Matching skills, Red = Missing skills, Blue = Extra skills.
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={generatePDFReport} variant="outline" className="gap-2">
                  <FileDown className="w-4 h-4" />
                  Export Report
                </Button>
                <Button variant="secondary" className="gap-2">
                  🔗 Share Candidate
                </Button>
                <Button onClick={handleReset} variant="outline">
                  New Analysis
                </Button>
              </div>
            </div>

            <CandidateTable 
              candidates={currentDashboard.candidates}
              selectedCandidates={selectedCandidates}
              onSelectionChange={setSelectedCandidates}
            />

            {/* Floating Compare Button */}
            {selectedCandidates.length >= 2 && (
              <div className="fixed bottom-8 right-8 z-50">
                <Button 
                  size="lg" 
                  onClick={handleCompare}
                  className="gap-2 shadow-lg"
                  disabled={selectedCandidates.length > 6}
                >
                  <Users className="w-5 h-5" />
                  Compare {selectedCandidates.length} Candidates
                  {selectedCandidates.length > 6 && (
                    <span className="text-xs">(Max 6)</span>
                  )}
                </Button>
              </div>
            )}

            {/* Comparison Dialog */}
            <ComparisonDialog
              open={showComparison}
              onOpenChange={setShowComparison}
              candidates={getComparedCandidates()}
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

export default Dashboard;
