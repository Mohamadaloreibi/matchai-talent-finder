import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Copy, FileDown, RefreshCw } from "lucide-react";
import { generateCoverLetterPDF } from "@/lib/coverLetterPdfGenerator";

interface CoverLetterGeneratorProps {
  candidateName: string;
  jobTitle: string;
  company: string;
  cvText: string;
  jobDescription: string;
  matchSummary?: string;
  matchingSkills?: string[];
}

export const CoverLetterGenerator = ({
  candidateName,
  jobTitle,
  company,
  cvText,
  jobDescription,
  matchSummary,
  matchingSkills,
}: CoverLetterGeneratorProps) => {
  const [language, setLanguage] = useState<string>("auto");
  const [tone, setTone] = useState<string>("professional");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState<string>("");
  const [detectedLanguage, setDetectedLanguage] = useState<string>("en");
  const { toast } = useToast();

  // Load saved letter from localStorage on mount
  useEffect(() => {
    const savedLetter = localStorage.getItem("matchai.coverletter.latest");
    if (savedLetter) {
      try {
        const parsed = JSON.parse(savedLetter);
        // Simple hash check - could be improved
        const currentHash = hashString(cvText + jobDescription);
        if (parsed.hash === currentHash) {
          setGeneratedLetter(parsed.letter);
          setDetectedLanguage(parsed.language || "en");
          setLanguage(parsed.languagePref || "auto");
          setTone(parsed.tone || "professional");
        }
      } catch (error) {
        console.error("Failed to load saved letter:", error);
      }
    }
  }, [cvText, jobDescription]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("generate-cover-letter", {
        body: {
          candidate_name: candidateName,
          cv_text: cvText,
          job_description: jobDescription,
          match_summary: matchSummary,
          matching_skills: matchingSkills,
          language_pref: language,
          tone: tone,
          job_title: jobTitle,
          company: company,
        },
      });

      if (error) {
        throw error;
      }

      const letterText = data.cover_letter_text;
      const lang = data.language;
      
      setGeneratedLetter(letterText);
      setDetectedLanguage(lang);

      // Save to localStorage
      const currentHash = hashString(cvText + jobDescription);
      localStorage.setItem(
        "matchai.coverletter.latest",
        JSON.stringify({
          letter: letterText,
          language: lang,
          languagePref: language,
          tone: tone,
          hash: currentHash,
        })
      );

      toast({
        title: "Cover Letter Generated!",
        description: "Your personalized cover letter is ready.",
      });
    } catch (error: any) {
      console.error("Error generating cover letter:", error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate cover letter. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedLetter);
      toast({
        title: "Letter Copied",
        description: "Cover letter copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadPDF = () => {
    generateCoverLetterPDF({
      candidateName,
      jobTitle,
      company,
      letterText: generatedLetter,
      date: new Date().toISOString().split("T")[0],
      language: detectedLanguage,
    });

    toast({
      title: "PDF Downloaded",
      description: "Cover letter PDF has been saved.",
    });
  };

  const handleRefine = () => {
    // Re-trigger generation with current settings
    handleGenerate();
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
          <Mail className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-foreground">AI-Generated Cover Letter</h2>
          <p className="text-sm text-muted-foreground">
            Generate a personalized cover letter based on your match
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Language Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Language</label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger>
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto (detect)</SelectItem>
              <SelectItem value="sv">Svenska</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tone Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Tone</label>
          <Select value={tone} onValueChange={setTone}>
            <SelectTrigger>
              <SelectValue placeholder="Select tone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="friendly">Friendly</SelectItem>
              <SelectItem value="concise">Concise</SelectItem>
              <SelectItem value="story">Story-driven</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Generate Button */}
      <Button
        onClick={handleGenerate}
        disabled={isGenerating || !cvText || !jobDescription}
        className="w-full gap-2"
        size="lg"
      >
        {isGenerating ? (
          <>
            <RefreshCw className="w-5 h-5 animate-spin" />
            Writing your letter...
          </>
        ) : (
          <>
            <Mail className="w-5 h-5" />
            Generate Cover Letter
          </>
        )}
      </Button>

      {/* Generated Letter Display */}
      {generatedLetter && (
        <div className="space-y-4">
          <Textarea
            value={generatedLetter}
            readOnly
            className="min-h-[300px] font-mono text-sm"
          />

          <div className="flex flex-wrap gap-3">
            <Button onClick={handleCopy} variant="outline" className="gap-2">
              <Copy className="w-4 h-4" />
              Copy Letter
            </Button>
            <Button onClick={handleDownloadPDF} variant="outline" className="gap-2">
              <FileDown className="w-4 h-4" />
              Download PDF
            </Button>
            <Button onClick={handleRefine} variant="ghost" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Refine Letter
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            ℹ️ Preview generated by AI — review before sending.
          </p>
        </div>
      )}
    </Card>
  );
};

// Simple string hash function for comparison
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString();
}
