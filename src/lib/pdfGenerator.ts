import jsPDF from "jspdf";

// Localization strings
const translations = {
  en: {
    matchScore: "Match Score",
    confidence: "Confidence",
    summary: "Summary",
    matchingSkills: "Matching Skills",
    missingSkills: "Missing Skills",
    extraSkills: "Extra Skills",
    evidence: "Evidence",
    must: "Must Have",
    should: "Should Have",
    nice: "Nice to Have",
    starAchievements: "STAR Achievements",
    tips: "Tips to Improve",
    biasAlert: "Bias Alert",
    weightedScores: "Weighted Scores",
    situation: "Situation",
    task: "Task",
    action: "Action",
    result: "Result",
    estimatedGain: "Est. Gain",
    low: "Low",
    medium: "Medium",
    high: "High",
    page: "Page"
  },
  sv: {
    matchScore: "Matchpoäng",
    confidence: "Säkerhet",
    summary: "Sammanfattning",
    matchingSkills: "Matchande färdigheter",
    missingSkills: "Saknade färdigheter",
    extraSkills: "Extra färdigheter",
    evidence: "Evidens",
    must: "Måste ha",
    should: "Bör ha",
    nice: "Bra att ha",
    starAchievements: "STAR-prestationer",
    tips: "Förbättringstips",
    biasAlert: "Bias-varning",
    weightedScores: "Viktade poäng",
    situation: "Situation",
    task: "Uppgift",
    action: "Åtgärd",
    result: "Resultat",
    estimatedGain: "Uppsk. vinst",
    low: "Låg",
    medium: "Medel",
    high: "Hög",
    page: "Sida"
  },
  ar: {
    matchScore: "درجة المطابقة",
    confidence: "الثقة",
    summary: "الملخص",
    matchingSkills: "المهارات المطابقة",
    missingSkills: "المهارات الناقصة",
    extraSkills: "مهارات إضافية",
    evidence: "أدلة",
    must: "أساسي",
    should: "مستحسن",
    nice: "إضافة",
    starAchievements: "إنجازات STAR",
    tips: "نصائح للتحسين",
    biasAlert: "تنبيه تحيز",
    weightedScores: "النتائج الموزونة",
    situation: "الوضع",
    task: "المهمة",
    action: "الإجراء",
    result: "النتيجة",
    estimatedGain: "المكسب المقدر",
    low: "منخفض",
    medium: "متوسط",
    high: "عالٍ",
    page: "صفحة"
  }
};

interface MatchResult {
  candidate_name: string;
  job_title: string;
  company: string;
  created_at_iso: string;
  language: 'en' | 'sv' | 'ar';
  score: number;
  confidence_score: number;
  summary: string;
  matchingSkills: string[];
  missingSkills: string[];
  extraSkills: string[];
  weights: {
    must: number;
    should: number;
    nice_bonus: number;
  };
  evidence: Array<{ quote: string; source: string }>;
  star: Array<{ s: string; t: string; a: string; r: string }>;
  tips: Array<{ text: string; estimated_gain: 'low' | 'medium' | 'high' }>;
  bias_alert: {
    flagged: Array<{ phrase: string; reason: string; alt: string }>;
  };
}

export const generateMatchPDF = (result: MatchResult) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  const t = translations[result.language] || translations.en;
  const isRTL = result.language === 'ar';

  // Helper: Check if we need a new page
  const checkPageBreak = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - 20) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Helper: Sanitize filename
  const sanitizeFilename = (str: string) => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 50);
  };

  // Header
  doc.setFillColor(0, 102, 204);
  doc.rect(0, 0, pageWidth, 35, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("MatchAI", margin, 15);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const dateStr = new Date(result.created_at_iso).toISOString().split('T')[0];
  doc.text(dateStr, pageWidth - margin - 30, 15);
  
  doc.setFontSize(11);
  doc.text(`${result.candidate_name} | ${result.job_title}`, margin, 25);
  doc.text(result.company, margin, 31);

  yPosition = 45;
  doc.setTextColor(0, 0, 0);

  // Match Score Section
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(t.matchScore, margin, yPosition);
  yPosition += 8;

  const scoreColor = result.score >= 80 ? [34, 197, 94] : 
                     result.score >= 60 ? [234, 179, 8] : [239, 68, 68];
  doc.setFontSize(28);
  doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.text(`${result.score}%`, margin, yPosition);
  
  // Confidence chip
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`${t.confidence}: ${(result.confidence_score * 100).toFixed(0)}%`, margin + 30, yPosition - 3);
  
  // Progress bar
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.rect(margin, yPosition + 3, contentWidth, 4);
  doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.rect(margin, yPosition + 3, (contentWidth * result.score) / 100, 4, "F");
  
  yPosition += 15;
  doc.setTextColor(0, 0, 0);

  // Summary
  checkPageBreak(30);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(t.summary, margin, yPosition);
  yPosition += 6;
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const summaryLines = doc.splitTextToSize(result.summary, contentWidth);
  const clampedSummary = summaryLines.slice(0, 4);
  if (summaryLines.length > 4) {
    clampedSummary[3] = clampedSummary[3].substring(0, clampedSummary[3].length - 3) + "...";
  }
  doc.text(clampedSummary, margin, yPosition);
  yPosition += clampedSummary.length * 5 + 8;

  // Weighted Scores
  checkPageBreak(25);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(t.weightedScores, margin, yPosition);
  yPosition += 6;

  const drawWeightBar = (label: string, value: number, maxValue: number, color: number[]) => {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(label, margin, yPosition);
    
    const barWidth = 60;
    const barX = margin + 40;
    doc.setDrawColor(200, 200, 200);
    doc.rect(barX, yPosition - 3, barWidth, 4);
    doc.setFillColor(color[0], color[1], color[2]);
    doc.rect(barX, yPosition - 3, (barWidth * value) / maxValue, 4, "F");
    
    doc.text(`${value}/${maxValue}`, barX + barWidth + 3, yPosition);
    yPosition += 6;
  };

  drawWeightBar(t.must, result.weights.must, 100, [34, 197, 94]);
  drawWeightBar(t.should, result.weights.should, 100, [234, 179, 8]);
  drawWeightBar(t.nice, result.weights.nice_bonus, 20, [59, 130, 246]);
  yPosition += 5;

  // Skills Section (3 columns)
  checkPageBreak(50);
  const skillCardWidth = (contentWidth - 8) / 3;
  
  const drawSkillCard = (title: string, skills: string[], color: number[], xOffset: number) => {
    const cardHeight = Math.max(35, skills.length * 5 + 15);
    
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.setLineWidth(0.5);
    doc.rect(margin + xOffset, yPosition, skillCardWidth, cardHeight);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(title, margin + xOffset + 2, yPosition + 5);
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    let skillY = yPosition + 11;
    skills.forEach((skill, idx) => {
      if (idx < 8) { // Limit to 8 skills per card
        const skillText = doc.splitTextToSize(`• ${skill}`, skillCardWidth - 4);
        doc.text(skillText[0], margin + xOffset + 2, skillY);
        skillY += 4;
      }
    });
  };

  drawSkillCard(t.matchingSkills, result.matchingSkills, [34, 197, 94], 0);
  drawSkillCard(t.missingSkills, result.missingSkills, [239, 68, 68], skillCardWidth + 4);
  drawSkillCard(t.extraSkills, result.extraSkills, [59, 130, 246], 2 * skillCardWidth + 8);
  
  yPosition += Math.max(35, Math.max(result.matchingSkills.length, result.missingSkills.length, result.extraSkills.length) * 5 + 15) + 8;

  // Evidence Section
  if (result.evidence?.length > 0) {
    checkPageBreak(40);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(t.evidence, margin, yPosition);
    yPosition += 6;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    result.evidence.slice(0, 6).forEach((item) => {
      checkPageBreak(10);
      const quoteText = doc.splitTextToSize(`"${item.quote}" [${item.source}]`, contentWidth - 5);
      doc.text(quoteText, margin + 3, yPosition);
      yPosition += quoteText.length * 4 + 2;
    });
    yPosition += 5;
  }

  // STAR Achievements
  if (result.star?.length > 0) {
    checkPageBreak(50);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(t.starAchievements, margin, yPosition);
    yPosition += 6;

    result.star.slice(0, 3).forEach((star, idx) => {
      checkPageBreak(30);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(`STAR ${idx + 1}:`, margin, yPosition);
      yPosition += 5;
      
      doc.setFont("helvetica", "normal");
      const starText = [
        `${t.situation}: ${star.s}`,
        `${t.task}: ${star.t}`,
        `${t.action}: ${star.a}`,
        `${t.result}: ${star.r}`
      ];
      
      starText.forEach((line) => {
        const lines = doc.splitTextToSize(line, contentWidth - 5);
        doc.text(lines, margin + 3, yPosition);
        yPosition += lines.length * 4;
      });
      yPosition += 3;
    });
    yPosition += 5;
  }

  // Tips Section
  if (result.tips?.length > 0) {
    checkPageBreak(40);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(t.tips, margin, yPosition);
    yPosition += 6;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    result.tips.slice(0, 5).forEach((tip) => {
      checkPageBreak(8);
      const gainBadge = `[${t[tip.estimated_gain]}]`;
      const gainColor = tip.estimated_gain === 'high' ? [34, 197, 94] : 
                        tip.estimated_gain === 'medium' ? [234, 179, 8] : [156, 163, 175];
      
      doc.setTextColor(gainColor[0], gainColor[1], gainColor[2]);
      doc.text(gainBadge, margin, yPosition);
      
      doc.setTextColor(0, 0, 0);
      const tipLines = doc.splitTextToSize(tip.text, contentWidth - 20);
      doc.text(tipLines, margin + 15, yPosition);
      yPosition += Math.max(4, tipLines.length * 4);
    });
    yPosition += 5;
  }

  // Bias Alert
  if (result.bias_alert?.flagged?.length > 0) {
    checkPageBreak(30);
    doc.setFillColor(254, 243, 199);
    doc.rect(margin, yPosition, contentWidth, 20, "F");
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(146, 64, 14);
    doc.text(t.biasAlert, margin + 2, yPosition + 5);
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    result.bias_alert.flagged.slice(0, 2).forEach((flag, idx) => {
      const flagText = `"${flag.phrase}" → "${flag.alt}" (${flag.reason})`;
      const lines = doc.splitTextToSize(flagText, contentWidth - 4);
      doc.text(lines, margin + 2, yPosition + 10 + idx * 5);
    });
    yPosition += 25;
  }

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      "Built with ❤️ by Mohamed · matchai.app",
      pageWidth / 2,
      pageHeight - 8,
      { align: "center" }
    );
    doc.text(`${t.page} ${i}/${totalPages}`, pageWidth - margin, pageHeight - 8);
  }

  // Generate filename
  const sanitizedName = sanitizeFilename(result.candidate_name);
  const sanitizedCompany = sanitizeFilename(result.company);
  const sanitizedJob = sanitizeFilename(result.job_title);
  const dateForFile = new Date(result.created_at_iso).toISOString().split('T')[0].replace(/-/g, '');
  
  const fileName = `MatchAI_${sanitizedName}_${sanitizedCompany}_${sanitizedJob}_${dateForFile}.pdf`;
  doc.save(fileName);
};
