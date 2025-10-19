import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, PlusCircle, RotateCcw, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import jsPDF from "jspdf";

interface MatchResultProps {
  result: {
    score: number;
    summary: string;
    matchingSkills: string[];
    missingSkills: string[];
    extraSkills: string[];
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

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPosition = 20;

    // Header with logo placeholder
    doc.setFillColor(0, 102, 204);
    doc.rect(0, 0, pageWidth, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("MatchAI", margin, 25);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    const currentDate = new Date().toLocaleDateString("en-US", { 
      year: "numeric", 
      month: "long", 
      day: "numeric" 
    });
    doc.text(currentDate, pageWidth - margin - 60, 25);

    yPosition = 60;
    doc.setTextColor(0, 0, 0);

    // Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("CV Match Analysis Report", margin, yPosition);
    yPosition += 15;

    if (cvName) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Candidate CV: ${cvName}`, margin, yPosition);
      yPosition += 10;
    }

    // Match Score
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Match Score", margin, yPosition);
    yPosition += 8;
    
    doc.setFontSize(32);
    const scoreColor = result.score >= 80 ? [34, 197, 94] : 
                       result.score >= 60 ? [234, 179, 8] : [239, 68, 68];
    doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.text(`${result.score}%`, margin, yPosition);
    yPosition += 15;

    // Summary
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Summary", margin, yPosition);
    yPosition += 8;
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const summaryLines = doc.splitTextToSize(result.summary, pageWidth - 2 * margin);
    doc.text(summaryLines, margin, yPosition);
    yPosition += summaryLines.length * 6 + 10;

    // Matching Skills
    if (result.matchingSkills.length > 0) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(34, 197, 94);
      doc.text("✓ Matching Skills", margin, yPosition);
      yPosition += 8;
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      result.matchingSkills.forEach((skill) => {
        doc.text(`• ${skill}`, margin + 5, yPosition);
        yPosition += 6;
      });
      yPosition += 5;
    }

    // Missing Skills
    if (result.missingSkills.length > 0) {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(239, 68, 68);
      doc.text("✗ Missing Skills", margin, yPosition);
      yPosition += 8;
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      result.missingSkills.forEach((skill) => {
        doc.text(`• ${skill}`, margin + 5, yPosition);
        yPosition += 6;
      });
      yPosition += 5;
    }

    // Extra Skills
    if (result.extraSkills.length > 0) {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(234, 179, 8);
      doc.text("+ Additional Skills", margin, yPosition);
      yPosition += 8;
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      result.extraSkills.forEach((skill) => {
        doc.text(`• ${skill}`, margin + 5, yPosition);
        yPosition += 6;
      });
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(128, 128, 128);
      doc.text(
        "Built with ❤️ by Futurearc",
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
    }

    // Save the PDF
    const fileName = cvName 
      ? `MatchAI_Report_${cvName.replace(/\.[^/.]+$/, "")}_${Date.now()}.pdf`
      : `MatchAI_Report_${Date.now()}.pdf`;
    doc.save(fileName);
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
        <Button onClick={generatePDF} size="lg" variant="outline" className="gap-2">
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
