import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Edit, FileText, Search, FlaskConical, Users, MessageSquare } from "lucide-react";

export const BetaRoadmap = () => {
  const features = [
    {
      icon: Globe,
      title: "🌍 Fler språkstöd",
      description: `Snart kan du välja språk för både CV-analys och personligt brev.
• Svenska
• Engelska
• Arabiska
• Tyska
• Franska`
    },
    {
      icon: Edit,
      title: "📝 Redigering av personligt brev",
      description: `Du kommer kunna:
• Redigera texten direkt i verktyget
• Ändra ton, längd och stil
• Anpassa innehållet innan du laddar ner brevet`
    },
    {
      icon: FileText,
      title: "📄 AI-genererat CV från grunden",
      description: `MatchAI ska kunna skapa ett komplett CV åt dig:
• Modern layout och struktur
• Förbättrade bullet-points
• Sammanfattning och styrkor
Perfekt för nya jobbsökare eller dig som vill lyfta ditt befintliga CV.`
    },
    {
      icon: Search,
      title: "🔍 Reverse Job Matching",
      description: `Ladda upp ditt CV och få förslag på jobbroller du passar för.
För företag: ladda upp en roll och få AI-genererade kandidatprofiler som matchar.`
    },
    {
      icon: FlaskConical,
      title: "🧪 1 gratis AI-analys per dag (Beta)",
      description: `Under betan får alla användare:
• 1 analys var 24:e timme
• Möjlighet att spara sina analyser
• Planer på fler analyser med uppgradering längre fram.`
    },
    {
      icon: Users,
      title: "🧑‍💼 Employer Dashboard – nästa nivå",
      description: `Kommande förbättringar för företag:
• Batch-analys av flera kandidater
• Rankinglistor och skill gap-rapporter
• Export till PDF
• Dela kandidater internt med teamet.`
    },
    {
      icon: MessageSquare,
      title: "💬 Förbättrad feedbackvisning",
      description: `Snart kan du:
• Se hela feedbackmeddelandet
• Visa historik
• Markera feedback som läst
• Få bekräftelse på att din feedback tagits emot.`
    }
  ];

  return (
    <section className="py-12 bg-muted/30 rounded-lg border">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-3xl font-bold">Coming Features (Beta Roadmap)</h2>
          <Badge variant="secondary" className="bg-amber-500/20 text-amber-700 border-amber-500/30">
            BETA
          </Badge>
        </div>
        
        <p className="text-muted-foreground mb-8 max-w-3xl">
          MatchAI utvecklas aktivt baserat på era önskemål. Här är några av funktionerna vi jobbar på just nu.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
