import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'sv' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation strings
const translations: Record<Language, Record<string, string>> = {
  sv: {
    // Upload section
    'upload.cv.title': 'Ladda upp CV',
    'upload.cv.description': 'Ladda upp ditt CV eller klistra in texten',
    'upload.job.title': 'Ladda upp Jobbeskrivning',
    'upload.job.description': 'Ladda upp jobbeskrivningen eller klistra in texten',
    'upload.button': 'Välj fil',
    'upload.paste': 'Eller klistra in text här...',
    'upload.clear': 'Rensa',
    'upload.addMore': 'Lägg till fler CVs',
    'upload.clearAll': 'Rensa alla',
    
    // Analysis
    'analyze.button': 'Analysera matchning',
    'analyze.loading': 'AI analyserar din matchning...',
    'analyze.quota.available': 'Du har 1 gratis analys tillgänglig idag under betan',
    'analyze.quota.used': 'Du har använt dagens gratis analys. Försök igen om 24 timmar.',
    'analyze.quota.signin': 'Logga in för att använda din 1 gratis analys per dag under betan.',
    'analyze.error.signin': 'Inloggning krävs: Skapa ett gratis konto eller logga in för att köra din dagliga analys.',
    
    // Match results
    'match.score': 'Matchningspoäng',
    'match.summary': 'Sammanfattning',
    'match.skills.matching': 'Matchande kompetenser',
    'match.skills.missing': 'Saknade kompetenser',
    'match.skills.extra': 'Extra kompetenser',
    'match.download': 'Ladda ner rapport',
    'match.tryAnother': 'Prova en ny matchning',
    
    // Cover letter
    'coverletter.title': 'Generera personligt brev',
    'coverletter.generate': 'Generera personligt brev',
    'coverletter.generating': 'Genererar personligt brev...',
    'coverletter.language': 'Språk',
    'coverletter.tone': 'Ton',
    'coverletter.tone.professional': 'Professionell',
    'coverletter.tone.enthusiastic': 'Entusiastisk',
    'coverletter.tone.confident': 'Självsäker',
    'coverletter.copy': 'Kopiera',
    'coverletter.download': 'Ladda ner PDF',
    'coverletter.refine': 'Förfina brev',
    'coverletter.explain': 'Förklara brev',
    'coverletter.analysis': 'AI-analys av ditt personliga brev',
    'coverletter.refine.placeholder': 'Beskriv hur du vill ändra brevet...',
    'coverletter.refine.button': 'Tillämpa förändringar',
    
    // Header
    'header.home': 'Hem',
    'header.myLetters': 'Mina brev',
    'header.dashboard': 'Arbetsgivare Dashboard',
    'header.admin': 'Admin',
    'header.feedback': 'Ge feedback',
    
    // Auth
    'auth.signin': 'Logga in',
    'auth.signup': 'Registrera',
    'auth.signout': 'Logga ut',
    
    // Language selector
    'language.label': 'Språk',
    'language.swedish': 'Svenska',
    'language.english': 'English',
  },
  en: {
    // Upload section
    'upload.cv.title': 'Upload CV',
    'upload.cv.description': 'Upload your CV or paste the text',
    'upload.job.title': 'Upload Job Description',
    'upload.job.description': 'Upload the job description or paste the text',
    'upload.button': 'Choose file',
    'upload.paste': 'Or paste text here...',
    'upload.clear': 'Clear',
    'upload.addMore': 'Add More CVs',
    'upload.clearAll': 'Clear All',
    
    // Analysis
    'analyze.button': 'Analyze Match',
    'analyze.loading': 'AI is analyzing your match...',
    'analyze.quota.available': 'You have 1 free analysis available today during beta',
    'analyze.quota.used': 'You\'ve used today\'s free analysis. Try again in 24 hours.',
    'analyze.quota.signin': 'Sign in to use your 1 free analysis per day during beta.',
    'analyze.error.signin': 'Sign in required: Create a free account or sign in to run your daily analysis.',
    
    // Match results
    'match.score': 'Match Score',
    'match.summary': 'Summary',
    'match.skills.matching': 'Matching Skills',
    'match.skills.missing': 'Missing Skills',
    'match.skills.extra': 'Extra Skills',
    'match.download': 'Download Report',
    'match.tryAnother': 'Try Another Match',
    
    // Cover letter
    'coverletter.title': 'Generate Cover Letter',
    'coverletter.generate': 'Generate Cover Letter',
    'coverletter.generating': 'Generating cover letter...',
    'coverletter.language': 'Language',
    'coverletter.tone': 'Tone',
    'coverletter.tone.professional': 'Professional',
    'coverletter.tone.enthusiastic': 'Enthusiastic',
    'coverletter.tone.confident': 'Confident',
    'coverletter.copy': 'Copy',
    'coverletter.download': 'Download PDF',
    'coverletter.refine': 'Refine Letter',
    'coverletter.explain': 'Explain Letter',
    'coverletter.analysis': 'AI Analysis of Your Cover Letter',
    'coverletter.refine.placeholder': 'Describe how you want to change the letter...',
    'coverletter.refine.button': 'Apply Changes',
    
    // Header
    'header.home': 'Home',
    'header.myLetters': 'My Letters',
    'header.dashboard': 'Employer Dashboard',
    'header.admin': 'Admin',
    'header.feedback': 'Give Feedback',
    
    // Auth
    'auth.signin': 'Sign In',
    'auth.signup': 'Sign Up',
    'auth.signout': 'Sign Out',
    
    // Language selector
    'language.label': 'Language',
    'language.swedish': 'Svenska',
    'language.english': 'English',
  }
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  // Default to Swedish, read from localStorage if available
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('matchai.language');
    return (saved === 'en' || saved === 'sv') ? saved : 'sv';
  });

  // Persist language choice
  useEffect(() => {
    localStorage.setItem('matchai.language', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  // Translation function
  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
