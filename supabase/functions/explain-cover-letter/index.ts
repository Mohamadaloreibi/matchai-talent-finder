import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      current_letter,
      cv_text,
      job_description,
      tone,
      job_title,
      company,
      target_language
    } = await req.json();

    console.log("Explaining cover letter for:", job_title, "at", company);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const prompt = `You are an AI career writing expert.  
Your task is to **analyze and explain** the AI-generated cover letter based on the user's CV and the job description.  
Explain the reasoning behind how the letter was written — what strengths it highlights, how it matches the job, and what could be improved.

### Context Data:
Language: ${target_language}
Tone: ${tone}
Job Title: ${job_title}
Company: ${company}

CV Text:
"""${cv_text}"""

Job Description:
"""${job_description}"""

Cover Letter:
"""${current_letter}"""

### Instructions:
1. Write the explanation in ${target_language} (Swedish if "sv", English if "en").
2. Start with a short summary paragraph about the overall quality of the letter.
3. Then list 3–5 bullet points under "Styrkor / Strengths".
4. Then list 2–3 bullet points under "Förbättringar / Improvements".
5. Never rewrite or modify the letter itself.
6. Keep the explanation concise, professional, and clear.
7. Output only the explanation text (no markdown, no code).`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const explanation = data.choices[0].message.content;

    console.log("Explanation generated successfully");

    return new Response(
      JSON.stringify({
        explanation,
        language: target_language
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error("Error in explain-cover-letter function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
