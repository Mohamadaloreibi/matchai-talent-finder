import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Trash2, FileText, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { AuthButton } from "@/components/AuthButton";
import { Header } from "@/components/Header";

interface SavedLetter {
  id: string;
  job_title: string;
  company: string;
  letter_text: string;
  created_at: string;
  tone: string;
  language: string;
}

const MyLetters = () => {
  const [user, setUser] = useState<User | null>(null);
  const [letters, setLetters] = useState<SavedLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLetter, setSelectedLetter] = useState<SavedLetter | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchLetters();
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchLetters();
      } else {
        setLetters([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchLetters = async () => {
    try {
      const { data, error } = await supabase
        .from("saved_letters")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLetters(data || []);
    } catch (error: any) {
      toast.error("Failed to load letters");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("saved_letters")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Letter deleted");
      setLetters(letters.filter(l => l.id !== id));
      if (selectedLetter?.id === id) {
        setSelectedLetter(null);
      }
    } catch (error: any) {
      toast.error("Failed to delete letter");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Sign in Required</CardTitle>
            <CardDescription>
              Sign in to save and view your cover letters.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AuthButton />
            <Button variant="outline" onClick={() => navigate("/")} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (selectedLetter) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        <Header showDashboardLink={true} showHomeLink={true} showMyLettersLink={false} />
        <div className="container mx-auto p-4 pt-8">
          <div className="max-w-4xl mx-auto space-y-4">
            <Button variant="outline" onClick={() => setSelectedLetter(null)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to My Letters
            </Button>
            <Card>
              <CardHeader>
                <CardTitle>{selectedLetter.job_title}</CardTitle>
                <CardDescription>
                  {selectedLetter.company} • {format(new Date(selectedLetter.created_at), "PPP")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {selectedLetter.letter_text}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <Header showDashboardLink={true} showHomeLink={true} showMyLettersLink={false} />
      <div className="container mx-auto p-4 pt-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">My Letters</h1>
              <p className="text-muted-foreground">View and manage your saved cover letters</p>
            </div>
          </div>

        {letters.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No saved letters yet</h3>
              <p className="text-muted-foreground mb-4">
                Generate and save cover letters to see them here
              </p>
              <Button onClick={() => navigate("/")}>
                Create Your First Letter
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {letters.map((letter) => (
              <Card key={letter.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{letter.job_title}</CardTitle>
                  <CardDescription>{letter.company}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(letter.created_at), "PPP")}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1"
                      onClick={() => setSelectedLetter(letter)}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(letter.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyLetters;
