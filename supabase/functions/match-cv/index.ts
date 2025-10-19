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
    const { cvText, jobDescription, candidateName, jobTitle, company, language = 'en' } = await req.json();
    console.log('Received match request');

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an expert HR and recruitment AI assistant specializing in comprehensive CV analysis. Your task is to provide detailed, actionable insights for candidate-job matching.

Analyze the CV and job description thoroughly, then return a complete JSON object with:
1. score: Overall match score (0-100)
2. confidence_score: Your confidence in this assessment (0.0-1.0)
3. summary: Concise 3-4 sentence paragraph explaining fit, strengths, and gaps
4. matchingSkills: Top 5 most relevant matching skills
5. missingSkills: Top 3 most critical missing skills from job requirements
6. extraSkills: Additional valuable skills the candidate possesses
7. weights: Breakdown scores for must-have (0-100), should-have (0-100), and nice-to-have (0-20) requirements
8. evidence: Up to 6 specific quotes from CV or JD supporting the match, with source indicator
9. star: Up to 3 STAR achievements (Situation, Task, Action, Result) extracted from CV
10. tips: 5 actionable improvement tips with estimated impact (low/medium/high)
11. bias_alert: Flag any potentially biased language in job description

Be professional, objective, and data-driven. Focus on concrete evidence.`;

    const userPrompt = `Job Description:
${jobDescription}

Candidate CV:
${cvText}

Please analyze this match comprehensively and provide results in the specified JSON format.`;

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
              description: "Return comprehensive CV-job match analysis",
              parameters: {
                type: "object",
                properties: {
                  score: { 
                    type: "number",
                    description: "Overall match score 0-100"
                  },
                  confidence_score: {
                    type: "number",
                    description: "Confidence in assessment 0.0-1.0"
                  },
                  summary: { 
                    type: "string",
                    description: "Concise 3-4 sentence explanation of fit"
                  },
                  matchingSkills: {
                    type: "array",
                    items: { type: "string" },
                    description: "Top 5 matching skills"
                  },
                  missingSkills: {
                    type: "array",
                    items: { type: "string" },
                    description: "Top 3 critical missing skills"
                  },
                  extraSkills: {
                    type: "array",
                    items: { type: "string" },
                    description: "Additional valuable skills"
                  },
                  weights: {
                    type: "object",
                    properties: {
                      must: { type: "number", description: "Must-have score 0-100" },
                      should: { type: "number", description: "Should-have score 0-100" },
                      nice_bonus: { type: "number", description: "Nice-to-have bonus 0-20" }
                    }
                  },
                  evidence: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        quote: { type: "string" },
                        source: { type: "string", enum: ["CV", "JD"] }
                      }
                    },
                    description: "Up to 6 supporting quotes"
                  },
                  star: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        s: { type: "string", description: "Situation" },
                        t: { type: "string", description: "Task" },
                        a: { type: "string", description: "Action" },
                        r: { type: "string", description: "Result" }
                      }
                    },
                    description: "Up to 3 STAR achievements"
                  },
                  tips: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        text: { type: "string" },
                        estimated_gain: { type: "string", enum: ["low", "medium", "high"] }
                      }
                    },
                    description: "5 improvement tips"
                  },
                  bias_alert: {
                    type: "object",
                    properties: {
                      flagged: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            phrase: { type: "string" },
                            reason: { type: "string" },
                            alt: { type: "string", description: "Neutral alternative" }
                          }
                        }
                      }
                    }
                  }
                },
                required: ["score", "confidence_score", "summary", "matchingSkills", "missingSkills", "extraSkills", "weights", "evidence", "star", "tips", "bias_alert"]
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

    // Add metadata to result
    const enrichedResult = {
      ...analysisResult,
      candidate_name: candidateName || "Unknown Candidate",
      job_title: jobTitle || "Position",
      company: company || "Company",
      created_at_iso: new Date().toISOString(),
      language: language
    };

    return new Response(
      JSON.stringify(enrichedResult),
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
