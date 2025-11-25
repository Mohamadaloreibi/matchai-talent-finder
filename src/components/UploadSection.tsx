import { Upload, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface UploadSectionProps {
  title: string;
  description: string;
  onFileSelect: (file: File) => void;
  onTextChange: (text: string) => void;
  selectedFile: File | null;
  textContent: string;
  accept?: string;
}

export const UploadSection = ({
  title,
  description,
  onFileSelect,
  onTextChange,
  selectedFile,
  textContent,
  accept = ".pdf,.txt,.doc,.docx"
}: UploadSectionProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const { t } = useLanguage();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  const clearFile = () => {
    onFileSelect(null as any);
    onTextChange("");
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </div>

      <Card
        className={`border-2 border-dashed transition-all duration-200 ${
          isDragging 
            ? 'border-primary bg-primary/5' 
            : 'border-border hover:border-primary/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="p-8">
          {!selectedFile ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  Drop your file here, or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports PDF, TXT, DOC, DOCX
                </p>
              </div>

              <div>
                <input
                  type="file"
                  id={`file-${title}`}
                  className="hidden"
                  accept={accept}
                  onChange={handleFileInput}
                />
                <label htmlFor={`file-${title}`}>
                  <Button type="button" variant="outline" asChild>
                    <span className="cursor-pointer">{t('upload.button')}</span>
                  </Button>
                </label>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or paste text</span>
                </div>
              </div>

              <textarea
                className="w-full min-h-32 p-4 text-sm border border-input rounded-lg bg-background focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
                placeholder={t('upload.paste')}
                value={textContent}
                onChange={(e) => onTextChange(e.target.value)}
              />
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={clearFile}
                className="text-muted-foreground hover:text-destructive"
                aria-label={t('upload.clear')}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
