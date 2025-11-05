import jsPDF from "jspdf";

interface CoverLetterData {
  candidateName: string;
  jobTitle: string;
  company: string;
  letterText: string;
  date: string;
  language: string;
}

export const generateCoverLetterPDF = (data: CoverLetterData) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - 2 * margin;

  let yPos = margin;

  // Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Cover Letter — MatchAI", margin, yPos);
  yPos += 10;

  // Subheader
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  const subheader = `${data.candidateName} · ${data.jobTitle} — ${data.company} · ${data.date}`;
  doc.text(subheader, margin, yPos);
  yPos += 12;

  // Separator line
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // Letter body
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);

  // Split letter into paragraphs (by double newlines or single newlines)
  const paragraphs = data.letterText.split(/\n\n|\n/);
  
  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) continue;
    
    const lines = doc.splitTextToSize(paragraph, contentWidth);
    
    for (const line of lines) {
      // Check if we need a new page
      if (yPos > pageHeight - margin - 15) {
        doc.addPage();
        yPos = margin;
      }
      
      doc.text(line, margin, yPos);
      yPos += 5;
    }
    
    // Add space between paragraphs
    yPos += 3;
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  const footerText = "Built with care by Mohamed · matchai.app";
  const footerWidth = doc.getTextWidth(footerText);
  doc.text(footerText, (pageWidth - footerWidth) / 2, pageHeight - 10);

  // Save the PDF
  const safeFileName = `CoverLetter_${data.candidateName}_${data.company}_${data.jobTitle}_${data.date}`
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .substring(0, 100);
  
  doc.save(`${safeFileName}.pdf`);
};
