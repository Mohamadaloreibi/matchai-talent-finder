import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ 
          error: 'authentication_required',
          message: 'Please log in to use the analysis feature.' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ 
          error: 'authentication_required',
          message: 'Please log in to use the analysis feature.' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✓ User authenticated successfully. User ID:', user.id);

    // Check if user is admin (admins have unlimited analyses)
    const { data: isAdmin, error: roleError } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (roleError) {
      console.error('⚠️ Error checking admin role:', roleError);
    }

    if (isAdmin) {
      console.log('👑 Admin user detected - skipping quota check');
    } else {
      // Check if user has already run 2 analyses in the last 24 hours (non-admins only)
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      console.log('Checking for analysis logs since:', twentyFourHoursAgo.toISOString());
      
      const { data: recentAnalyses, error: checkError } = await supabase
        .from('analysis_logs')
        .select('created_at')
        .eq('user_id', user.id)
        .gte('created_at', twentyFourHoursAgo.toISOString())
        .order('created_at', { ascending: false });

      if (checkError) {
        console.error('❌ Error checking analysis logs:', checkError);
        // Continue with analysis if we can't check logs (fail open)
      }

      if (recentAnalyses && recentAnalyses.length >= 2) {
        const lastAnalysisTime = new Date(recentAnalyses[0].created_at);
        const hoursUntilReset = Math.ceil((lastAnalysisTime.getTime() + 24 * 60 * 60 * 1000 - Date.now()) / (60 * 60 * 1000));
        
        console.log('❌ Daily limit reached. Analyses count:', recentAnalyses.length);
        console.log('⏰ Hours until reset:', hoursUntilReset);
        
        return new Response(
          JSON.stringify({ 
            error: 'daily_limit_reached',
            message: 'You can only run 2 analyses every 24 hours. Try again tomorrow.',
            last_analysis_at: recentAnalyses[0].created_at,
            hours_until_reset: hoursUntilReset
          }),
          { 
            status: 429, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      console.log('✓ User has quota available. Analyses used:', recentAnalyses?.length || 0, 'of 2');
    }

    const { cvText, jobDescription, candidateName, jobTitle, company, language = 'en' } = await req.json();
    console.log('📋 Starting analysis for user:', user.id, '| Candidate:', candidateName || 'Unknown', '| Language:', language);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = language === 'sv' 
      ? `Du är en expert HR- och rekryteringsassistent specialiserad på omfattande CV-analys. Din uppgift är att ge detaljerade, handlingsbara insikter för matchning mellan kandidat och jobb.

Analysera CV:t och jobbeskrivningen noggrant och returnera sedan ett komplett JSON-objekt med:
1. score: Övergripande matchningspoäng (0-100)
2. confidence_score: Din tillförsikt i denna bedömning (0.0-1.0)
3. summary: Kort 3-4 meningar som förklarar passform, styrkor och luckor (PÅ SVENSKA)
4. matchingSkills: Topp 5 mest relevanta matchande färdigheter (PÅ SVENSKA)
5. missingSkills: Topp 3 mest kritiska saknade färdigheter från jobbkrav (PÅ SVENSKA)
6. extraSkills: Ytterligare värdefulla färdigheter som kandidaten besitter (PÅ SVENSKA)
7. weights: Uppdelningspoäng för must-have (0-100), should-have (0-100), och nice-to-have (0-20) krav
8. evidence: Upp till 6 specifika citat från CV eller JD som stöder matchningen, med källindikator (PÅ SVENSKA)
9. star: Upp till 3 STAR-prestationer (Situation, Task, Action, Result) extraherade från CV (PÅ SVENSKA)
10. tips: 5 handlingsbara förbättringstips med uppskattad påverkan (low/medium/high) (PÅ SVENSKA)
11. bias_alert: Flagga eventuellt partiskt språk i jobbeskrivningen (PÅ SVENSKA)

Var professionell, objektiv och datadriven. Fokusera på konkreta bevis. Skriv ALLT på svenska (sammanfattning, färdigheter, tips, etc.).`
      : `You are an expert HR and recruitment AI assistant specializing in comprehensive CV analysis. Your task is to provide detailed, actionable insights for candidate-job matching.

Analyze the CV and job description thoroughly, then return a complete JSON object with:
1. score: Overall match score (0-100)
2. confidence_score: Your confidence in this assessment (0.0-1.0)
3. summary: Concise 3-4 sentence paragraph explaining fit, strengths, and gaps (IN ENGLISH)
4. matchingSkills: Top 5 most relevant matching skills (IN ENGLISH)
5. missingSkills: Top 3 most critical missing skills from job requirements (IN ENGLISH)
6. extraSkills: Additional valuable skills the candidate possesses (IN ENGLISH)
7. weights: Breakdown scores for must-have (0-100), should-have (0-100), and nice-to-have (0-20) requirements
8. evidence: Up to 6 specific quotes from CV or JD supporting the match, with source indicator (IN ENGLISH)
9. star: Up to 3 STAR achievements (Situation, Task, Action, Result) extracted from CV (IN ENGLISH)
10. tips: 5 actionable improvement tips with estimated impact (low/medium/high) (IN ENGLISH)
11. bias_alert: Flag any potentially biased language in job description (IN ENGLISH)

Be professional, objective, and data-driven. Focus on concrete evidence. Write EVERYTHING in English (summary, skills, tips, etc.).`;

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

    // Log the analysis to track daily limit
    console.log('📝 Inserting analysis log for user:', user.id);
    const { data: logData, error: logError } = await supabase
      .from('analysis_logs')
      .insert({ user_id: user.id })
      .select()
      .single();

    if (logError) {
      console.error('❌ Error logging analysis:', logError);
      // Don't fail the request if logging fails
    } else {
      console.log('✓ Analysis logged successfully. Log ID:', logData?.id, '| Created at:', logData?.created_at);
      console.log('⏰ User quota will reset 24 hours from now at:', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString());
    }

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
