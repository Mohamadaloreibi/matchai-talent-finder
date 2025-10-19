import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, PlusCircle, RotateCcw, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { generateMatchPDF } from "@/lib/pdfGenerator";

interface MatchResultProps {
  result: {
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
  };
  onReset: () => void;
  cvName?: string;
}

export const MatchResult = ({ result, onReset, cvName }: MatchResultProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-accent";
    return "text-destructive";
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-success";
    if (score >= 60) return "bg-accent";
    return "bg-destructive";
  };

  const handleGeneratePDF = () => {
    // Prepare complete result object for PDF generation
    const pdfData = {
      candidate_name: result.candidate_name || cvName || "Candidate",
      job_title: result.job_title || "Position",
      company: result.company || "Company",
      created_at_iso: result.created_at_iso || new Date().toISOString(),
      language: result.language || 'en' as const,
      score: result.score,
      confidence_score: result.confidence_score || 0.85,
      summary: result.summary,
      matchingSkills: result.matchingSkills,
      missingSkills: result.missingSkills,
      extraSkills: result.extraSkills,
      weights: result.weights || { must: 70, should: 60, nice_bonus: 10 },
      evidence: result.evidence || [],
      star: result.star || [],
      tips: result.tips || [],
      bias_alert: result.bias_alert || { flagged: [] }
    };
    
    generateMatchPDF(pdfData);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Score Card */}
      <Card className="p-8 shadow-lg">
        <div className="text-center space-y-4">
          <div className={`text-6xl font-bold ${getScoreColor(result.score)}`}>
            {result.score}%
          </div>
          <div className="max-w-md mx-auto">
            <Progress 
              value={result.score} 
              className="h-3"
            />
          </div>
          <p className="text-lg text-foreground font-medium">Match Score</p>
        </div>
      </Card>

      {/* Summary */}
      <Card className="p-6 shadow-md">
        <h3 className="text-lg font-semibold text-foreground mb-3">Summary</h3>
        <p className="text-muted-foreground leading-relaxed">{result.summary}</p>
      </Card>

      {/* Skills Analysis */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Matching Skills */}
        <Card className="p-6 shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-success" />
            <h3 className="font-semibold text-foreground">Matching Skills</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {result.matchingSkills.length > 0 ? (
              result.matchingSkills.map((skill, idx) => (
                <Badge key={idx} variant="secondary" className="bg-success/10 text-success border-success/20">
                  {skill}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No matching skills found</p>
            )}
          </div>
        </Card>

        {/* Missing Skills */}
        <Card className="p-6 shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <XCircle className="w-5 h-5 text-destructive" />
            <h3 className="font-semibold text-foreground">Missing Skills</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {result.missingSkills.length > 0 ? (
              result.missingSkills.map((skill, idx) => (
                <Badge key={idx} variant="secondary" className="bg-destructive/10 text-destructive border-destructive/20">
                  {skill}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No missing skills</p>
            )}
          </div>
        </Card>

        {/* Extra Skills */}
        <Card className="p-6 shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <PlusCircle className="w-5 h-5 text-accent" />
            <h3 className="font-semibold text-foreground">Extra Skills</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {result.extraSkills.length > 0 ? (
              result.extraSkills.map((skill, idx) => (
                <Badge key={idx} variant="secondary" className="bg-accent/10 text-accent border-accent/20">
                  {skill}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No extra skills found</p>
            )}
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-4">
        <Button onClick={handleGeneratePDF} size="lg" variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Download Report
        </Button>
        <Button onClick={onReset} size="lg" className="gap-2">
          <RotateCcw className="w-4 h-4" />
          Try Another Match
        </Button>
      </div>
    </div>
  );
};
