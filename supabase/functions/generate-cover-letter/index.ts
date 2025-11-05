import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      candidate_name,
      cv_text,
      job_description,
      match_summary,
      matching_skills,
      language_pref,
      tone,
      job_title,
      company,
    } = await req.json();

    console.log("Generating cover letter for:", candidate_name);

    // Detect language if auto
    let target_language = language_pref;
    if (language_pref === "auto") {
      target_language = detectLanguage(job_description, cv_text);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build the LLM prompt
    const systemPrompt = "You are an expert career writer who crafts concise, human-sounding cover letters that align a candidate's CV to a given Job Description. You avoid clichés, keep it factual and specific, and highlight 2–3 overlapping skills and one concrete experience with results.";

    const languageInstruction = target_language === "sv" ? "svenska" : "English";
    const toneMap: Record<string, string> = {
      professional: "professional",
      friendly: "friendly",
      concise: "concise",
      story: "story-driven",
    };
    const toneInstruction = toneMap[tone] || "professional";

    const userPrompt = `Write a personalized cover letter for role: ${job_title || "the position"} at ${company || "the company"}.
Candidate: ${candidate_name}.
CV (raw): \`\`\`${cv_text}\`\`\`
Job Description (raw): \`\`\`${job_description}\`\`\`
Match summary (optional): ${match_summary || "N/A"}
Top overlapping skills (optional): ${matching_skills?.join(", ") || "N/A"}

Requirements:
- Language: ${languageInstruction}.
- Tone: ${toneInstruction}.
- 250–300 words max.
- Use a natural, confident voice (no robotic phrasing).
- Mention 2–3 overlapping skills explicitly as they appear in the JD.
- Reference ONE concrete project/experience from the CV and its outcome (numbers if available).
- Close with a short, polite call-to-action.

Output ONLY the finalized letter text with line breaks — no markdown, no preface.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error("Failed to generate cover letter");
    }

    const data = await response.json();
    const coverLetterText = data.choices?.[0]?.message?.content || "";

    console.log("Cover letter generated successfully");

    return new Response(
      JSON.stringify({
        language: target_language,
        tone: toneInstruction,
        cover_letter_text: coverLetterText,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error generating cover letter:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to generate cover letter" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Language detection helper
function detectLanguage(jobDescription: string, cvText: string): string {
  const swedishIndicators = [
    "och", "att", "är", "på", "för", "med", "som", "av", "till", "vi",
    "ansökan", "kunskap", "erfarenhet", "arbete", "företag"
  ];
  
  const text = (jobDescription + " " + cvText).toLowerCase();
  
  let swedishCount = 0;
  for (const indicator of swedishIndicators) {
    const regex = new RegExp(`\\b${indicator}\\b`, "gi");
    const matches = text.match(regex);
    swedishCount += matches ? matches.length : 0;
  }
  
  // If we find significant Swedish indicators, assume Swedish
  return swedishCount > 5 ? "sv" : "en";
}
