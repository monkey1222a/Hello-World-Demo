import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const { selectedArea, analysis, selectedLanguage, businessData } = await req.json()

    if (!selectedArea || !analysis) {
      return new Response(
        JSON.stringify({ error: 'Selected area and analysis are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check user permissions
    const { data: userData } = await supabaseClient
      .from('app_users')
      .select('*')
      .eq('id', user.id)
      .single()

    const isAdmin = user.email === 'cem@trdefi.com'
    const isPro = userData?.subscription === 'pro'

    if (!isAdmin && !isPro) {
      return new Response(
        JSON.stringify({ error: 'Premium subscription required' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check report limits for Pro users
    if (isPro && !isAdmin) {
      const reportsUsed = userData?.reports_used_this_month || 0
      if (reportsUsed >= 30) {
        return new Response(
          JSON.stringify({ error: 'Monthly report limit reached' }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
    }

    const languageMap: Record<string, string> = {
      'en': 'Please respond in English',
      'de': 'Bitte antworten Sie auf Deutsch',
      'tr': 'Lütfen Türkçe olarak yanıtlayın',
      'es': 'Por favor responda en español',
      'fr': 'Veuillez répondre en français',
      'nl': 'Gelieve te antwoorden in het Nederlands',
      'ar': 'يرجى الرد باللغة العربية',
      'he': 'אנא השב בעברית'
    }
    const languageInstruction = languageMap[selectedLanguage] || 'Please respond in English'

    const prompt = `${languageInstruction}.

You are creating a COMPREHENSIVE PREMIUM BUSINESS INTELLIGENCE REPORT using Gemini 2.5 Pro capabilities. This is a professional consulting-grade document worth $500+ in value.

LOCATION DATA:
- Coordinates: ${selectedArea.center.lat}, ${selectedArea.center.lng}
- Bounds: N:${selectedArea.bounds.north}, S:${selectedArea.bounds.south}, E:${selectedArea.bounds.east}, W:${selectedArea.bounds.west}

REAL GOOGLE MAPS BUSINESS DATA:
${businessData ? JSON.stringify(businessData, null, 2) : 'No specific business data available'}

BASED ON INITIAL ANALYSIS: "${analysis}"

CREATE A DETAILED 20+ PAGE BUSINESS INTELLIGENCE REPORT with mathematical calculations, specific numbers, and actionable insights:

═══════════════════════════════════════════════════════════
📋 **EXECUTIVE SUMMARY**
═══════════════════════════════════════════════════════════

• **Location Score**: ${businessData ? Math.min(10, Math.round((businessData.businessDensity * 2) + (businessData.averageRating * 1.5))) : 7}/10
• **Market Opportunity**: $${businessData ? Math.round(businessData.totalBusinesses * 50000) : 250000} annual revenue potential  
• **Investment Range**: $25,000 - $150,000
• **ROI Timeline**: 8-14 months
• **Risk Level**: ${businessData && businessData.businessDensity > 20 ? 'Medium (High Competition)' : 'Low-Medium'} 

**KEY FINDINGS:**
1. Business Density: ${businessData ? businessData.businessDensity.toFixed(1) : '15.2'} businesses per km² (${businessData && businessData.businessDensity > 15 ? 'Above' : 'Below'} average)
2. Market Gap: ${businessData ? Object.keys(businessData.categoryDistribution).length < 8 ? 'Significant opportunities in underrepresented categories' : 'Saturated market, focus on niche differentiation' : 'Multiple service gaps identified'}
3. Competition Advantage: ${businessData && businessData.averageRating < 4.0 ? 'Service quality improvement opportunity' : 'Focus on innovative offerings'}

[Continue with comprehensive financial projections, competitor analysis, step-by-step business setup guides, market calculations, risk assessments, and detailed implementation timelines with specific costs and revenue projections...]

Use SPECIFIC NUMBERS, PERCENTAGES, and DOLLAR AMOUNTS throughout. Include mathematical formulas for market size calculations, break-even analysis, and ROI projections.`

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          }
        })
      }
    )

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text()
      console.error('Gemini API error:', errorText)
      return new Response(
        JSON.stringify({ error: 'Failed to generate premium report' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const geminiData = await geminiResponse.json()

    if (!geminiData.candidates || !geminiData.candidates[0] || !geminiData.candidates[0].content) {
      return new Response(
        JSON.stringify({ error: 'Invalid response from AI' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const premiumReport = geminiData.candidates[0].content.parts[0].text

    // Update report usage for Pro users
    if (isPro && !isAdmin) {
      await supabaseClient
        .from('app_users')
        .update({
          reports_used_this_month: (userData?.reports_used_this_month || 0) + 1
        })
        .eq('id', user.id)
    }

    // Save premium report to database
    await supabaseClient
      .from('reports')
      .insert({
        user_id: user.id,
        area_data: selectedArea,
        analysis_text: premiumReport,
        business_data: businessData || null,
        report_type: 'premium',
        language: selectedLanguage || 'en'
      })

    return new Response(
      JSON.stringify({ report: premiumReport }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
