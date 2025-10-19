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
    const { cvText, jobDescription } = await req.json();
    console.log('Received match request');

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an expert HR and recruitment AI assistant. Your task is to analyze CVs and job descriptions to provide accurate match scores and insights.

Analyze the provided CV and job description, then return a JSON object with:
1. score: A number between 0-100 representing how well the candidate matches the job
2. summary: A brief summary (2-3 sentences) of why the candidate is a good fit
3. matchingSkills: Array of skills that match between CV and job description
4. missingSkills: Array of skills mentioned in job description but not in CV
5. extraSkills: Array of relevant skills the candidate has that aren't mentioned in the job description

Be objective, professional, and focus on actual qualifications and requirements.`;

    const userPrompt = `Job Description:
${jobDescription}

Candidate CV:
${cvText}

Please analyze this match and provide the results in the exact JSON format specified.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "provide_match_analysis",
              description: "Return the CV-job match analysis",
              parameters: {
                type: "object",
                properties: {
                  score: { 
                    type: "number",
                    description: "Match score from 0-100"
                  },
                  summary: { 
                    type: "string",
                    description: "Brief summary of why candidate is a good fit"
                  },
                  matchingSkills: {
                    type: "array",
                    items: { type: "string" },
                    description: "Skills that match between CV and job"
                  },
                  missingSkills: {
                    type: "array",
                    items: { type: "string" },
                    description: "Skills in job description but not in CV"
                  },
                  extraSkills: {
                    type: "array",
                    items: { type: "string" },
                    description: "Relevant skills candidate has not mentioned in job"
                  }
                },
                required: ["score", "summary", "matchingSkills", "missingSkills", "extraSkills"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "provide_match_analysis" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), 
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI usage limit reached. Please add credits to continue.' }), 
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response received');

    // Extract the tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const analysisResult = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify(analysisResult),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in match-cv function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
