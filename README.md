# MatchAI – CV & Job Match Assistant (Beta)

MatchAI är ett AI-drivet verktyg som hjälper jobbsökare och företag att:
- Matcha CV:n mot jobbannonser
- Generera personliga brev baserat på CV + roll
- Få AI-feedback kring styrkor, förbättringar och skillnader mellan profil och krav

## Features

- 🔍 CV + Job Description Matching  
- ✉️ AI-genererat personligt brev (svenska/engelska)  
- ♻️ “Refine Letter” – förbättra ton, tydlighet och struktur  
- 🧠 “Explain Letter” – AI förklarar varför brevet ser ut som det gör  
- 📊 Employer Dashboard (beta) – översikt över kandidater och matchpoäng  

## Tech Stack

- Frontend: React / Next.js (genererat, vidareutvecklat för hand)
- UI: Tailwind CSS + shadcn/ui
- Backend: Vercel API routes / Supabase functions
- Auth: Supabase Auth (e-post + Google)
- AI: OpenAI API

## Getting Started

```bash
git clone https://github.com/Mohamadaloreibi/matchai-talent-finder.git
cd matchai-talent-finder
npm install
npm run dev
