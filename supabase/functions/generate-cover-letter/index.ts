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
    const prompt = `
You are a professional Swedish and English career writer who crafts realistic, well-structured, and human-sounding cover letters for job applications.
You must always produce grammatically correct, fluent text with a clear structure, appropriate tone, and content that aligns closely with the candidate's actual background.

Context:
Candidate name: ${candidate_name}
Role: ${job_title}
Company: ${company}
Language: ${target_language}
Tone: ${tone}
CV text:
"""${cv_text}"""
Job description:
"""${job_description}"""
Match summary (if available): ${match_summary || 'N/A'}
Top overlapping skills: ${matching_skills?.join(', ') || 'N/A'}

Write a complete, polished cover letter that:
1. Stays under 300 words.
2. Uses a natural, confident and professional tone.
3. Highlights 2–3 skills that appear in both CV and JD (avoid listing too many).
4. Mentions ONE specific experience or project from the CV with clear results or impact.
5. Avoids generic filler like "Jag är passionerad om teknik" or "Jag tror att".
6. Keeps language authentic — no awkward phrasing or repetition.
7. Ends with a short, polite closing line that invites follow-up.

If the target language is Swedish, ensure correct Swedish grammar, sentence flow, and formality for business context.
If English, ensure natural phrasing for UK/EU professional tone (not US overly formal).

Output only the finished letter text, with paragraph breaks and no Markdown or code fences.
`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "user", content: prompt },
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
        tone: tone,
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
