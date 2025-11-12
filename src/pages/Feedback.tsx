import { useState } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { MessageSquare, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const feedbackSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }).max(255).optional().or(z.literal("")),
  message: z.string().trim().min(1, { message: "Please enter your feedback" }).max(2000, { message: "Feedback must be less than 2000 characters" })
});

const Feedback = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    const validation = feedbackSchema.safeParse({ email, message });
    if (!validation.success) {
      toast.error(validation.error.issues[0].message);
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Get current user if logged in
      const { data: { user } } = await supabase.auth.getUser();
      
      // Insert feedback into Supabase
      const { error } = await supabase
        .from('feedback')
        .insert({
          email: email || null,
          message: message.trim(),
          user_id: user?.id || null,
          status: 'new'
        });

      if (error) throw error;

      toast.success("Thank you for your feedback! We'll review it soon.");
      setEmail("");
      setMessage("");
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <Header showDashboardLink={true} showHomeLink={true} showMyLettersLink={true} />
      
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <MessageSquare className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Share Your Feedback</h1>
            <p className="text-muted-foreground">
              Help us improve MatchAI by sharing your thoughts, suggestions, or reporting issues.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Your Feedback</CardTitle>
              <CardDescription>
                We value your input and read every submission. Your feedback helps us make MatchAI better for everyone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email (optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Provide your email if you'd like us to follow up with you.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Your Message *</Label>
                  <Textarea
                    id="message"
                    placeholder="Tell us what you think, what features you'd like to see, or any issues you've encountered..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={8}
                    maxLength={2000}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {message.length}/2000 characters
                  </p>
                </div>

                <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
                  <Send className="w-4 h-4" />
                  {isSubmitting ? "Sending..." : "Send Feedback"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>
              You can also reach out to us directly at{" "}
              <a href="mailto:Moh2567@outlook.com" className="text-primary hover:underline">
                Moh2567@outlook.com
              </a>
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-border bg-card/50 mt-20">
        <div className="container mx-auto px-6 py-8">
          <p className="text-center text-muted-foreground">
            Built with ❤️ by <span className="font-semibold text-foreground">Mohamed</span>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Feedback;
