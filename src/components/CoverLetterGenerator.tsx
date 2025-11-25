import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Mail, Copy, FileDown, RefreshCw } from "lucide-react";
import { generateCoverLetterPDF } from "@/lib/coverLetterPdfGenerator";
import { toast as sonnerToast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

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
  const { language: globalLanguage, t } = useLanguage();
  const [tone, setTone] = useState<string>("professional");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState<string>("");
  const [detectedLanguage, setDetectedLanguage] = useState<string>("en");
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();
  // 🔹 Refine Letter states
  const [refineInstruction, setRefineInstruction] = useState("");
  const [loadingRefine, setLoadingRefine] = useState(false);
  // 🔹 Explain Letter states
  const [explanation, setExplanation] = useState<string>("");
  const [loadingExplanation, setLoadingExplanation] = useState(false);

  // Track user authentication
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load saved letter from localStorage on mount
  useEffect(() => {
    const savedLetter = localStorage.getItem("matchai.coverletter.latest");
    if (savedLetter) {
      try {
        const parsed = JSON.parse(savedLetter);
        // Simple hash check
        const currentHash = hashString(cvText + jobDescription);
        if (parsed.hash === currentHash) {
          setGeneratedLetter(parsed.letter);
          setDetectedLanguage(parsed.language || "en");
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
          language_pref: globalLanguage, // Use global language from context
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
          tone: tone,
          hash: currentHash,
        })
      );

      // Save to Supabase if user is logged in
      if (user) {
        try {
          const { error: saveError } = await supabase
            .from("saved_letters")
            .insert({
              user_id: user.id,
              job_title: jobTitle,
              company: company,
              letter_text: letterText,
              cv_text: cvText,
              job_description: jobDescription,
              tone: tone,
              language: lang,
            });

          if (saveError) throw saveError;

          toast({
            title: globalLanguage === 'sv' ? "Personligt brev genererat & sparat!" : "Cover Letter Generated & Saved!",
            description: globalLanguage === 'sv' 
              ? "Ditt personliga brev är redo och sparat."
              : "Your personalized cover letter is ready and saved.",
          });
        } catch (saveError) {
          console.error("Failed to save letter:", saveError);
          toast({
            title: t('coverletter.generate'),
            description: globalLanguage === 'sv'
              ? "Brevet skapat men kunde inte sparas till ditt konto."
              : "Letter created but couldn't be saved to your account.",
          });
        }
      } else {
        toast({
          title: t('coverletter.generate'),
          description: globalLanguage === 'sv' 
            ? "Ditt personliga brev är redo."
            : "Your personalized cover letter is ready.",
        });
        sonnerToast.info(
          globalLanguage === 'sv'
            ? "Logga in för att spara dina brev permanent"
            : "Sign in to save your letters permanently",
          { duration: 5000 }
        );
      }
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
  

  const handleRefine = async () => {
    if (!generatedLetter || !refineInstruction) return;
    setLoadingRefine(true);
    try {
      const res = await fetch("/api/refine-cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          refine_instruction: refineInstruction,
          target_language: detectedLanguage,
          tone,
          cv_text: cvText,
          current_letter: generatedLetter,
        }),
      });
      const data = await res.json();
      if (data.refined_letter) {
        setGeneratedLetter(data.refined_letter);
        toast({ title: "Brev förbättrat ✨", description: "AI:n har förfinat brevet." });
      } else {
        toast({ title: "Ingen förbättring", description: "Kunde inte förfina brevet.", variant: "destructive" });
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Fel vid förfining", description: "Försök igen.", variant: "destructive" });
    } finally {
      setLoadingRefine(false);
    }
  };

  const handleExplain = async () => {
    if (!generatedLetter) return;
    setLoadingExplanation(true);
    try {
      const { data, error } = await supabase.functions.invoke("explain-cover-letter", {
        body: {
          current_letter: generatedLetter,
          cv_text: cvText,
          job_description: jobDescription,
          tone: tone,
          job_title: jobTitle,
          company: company,
          target_language: detectedLanguage,
        },
      });

      if (error) {
        throw error;
      }

      setExplanation(data.explanation);
      toast({
        title: "Explanation Generated!",
        description: "Your cover letter has been analyzed.",
      });
    } catch (error: any) {
      console.error("Error explaining cover letter:", error);
      toast({
        title: "Explanation Failed",
        description: error.message || "Failed to explain cover letter. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingExplanation(false);
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-foreground">{t('coverletter.title')}</h3>
        <p className="text-sm text-muted-foreground">
          {globalLanguage === 'sv' 
            ? "Generera ett personligt brev baserat på ditt CV och jobbeskrivningen."
            : "Generate a personalized cover letter based on your CV and the job description."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tone Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">{t('coverletter.tone')}</label>
          <Select value={tone} onValueChange={setTone}>
            <SelectTrigger>
              <SelectValue placeholder={globalLanguage === 'sv' ? "Välj ton" : "Select tone"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="professional">{t('coverletter.tone.professional')}</SelectItem>
              <SelectItem value="friendly">{t('coverletter.tone.enthusiastic')}</SelectItem>
              <SelectItem value="concise">{t('coverletter.tone.confident')}</SelectItem>
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
            {t('coverletter.generating')}
          </>
        ) : (
          <>
            <Mail className="w-5 h-5" />
            {t('coverletter.generate')}
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
              {t('coverletter.copy')}
            </Button>
            <Button onClick={handleDownloadPDF} variant="outline" className="gap-2">
              <FileDown className="w-4 h-4" />
              {t('coverletter.download')}
            </Button>
            <Button onClick={handleRefine} variant="ghost" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              {t('coverletter.refine')}
            </Button>
            <Button 
              onClick={handleExplain} 
              variant="ghost" 
              className="gap-2"
              disabled={loadingExplanation}
            >
              <Mail className="w-4 h-4" />
              {loadingExplanation 
                ? (globalLanguage === 'sv' ? "Analyserar..." : "Analyzing...") 
                : t('coverletter.explain')}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            ℹ️ {globalLanguage === 'sv' 
              ? "Förhandsgranskning genererad av AI — granska före sändning."
              : "Preview generated by AI — review before sending."}
          </p>

          {/* Explanation Display */}
          {explanation && (
            <Card className="p-4 bg-muted/50 border-border">
              <h4 className="text-sm font-semibold text-foreground mb-3">{t('coverletter.analysis')}</h4>
              <div className="text-sm text-muted-foreground whitespace-pre-line">
                {explanation}
              </div>
            </Card>
          )}
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
