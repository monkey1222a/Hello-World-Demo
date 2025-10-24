import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
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

    // Verify user authentication
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

    const { selectedArea, selectedLanguage, businessData } = await req.json()

    if (!selectedArea) {
      return new Response(
        JSON.stringify({ error: 'Selected area is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get user data to check limits
    const { data: userData, error: userError } = await supabaseClient
      .from('app_users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (userError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user data' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check if user can analyze (free tier limits)
    if (userData.subscription === 'free') {
      const lastSearchDate = new Date(userData.last_search_date)
      const today = new Date()
      const daysDiff = Math.floor((today.getTime() - lastSearchDate.getTime()) / (1000 * 60 * 60 * 24))

      if (daysDiff < 15 && userData.searches_used >= 1) {
        return new Response(
          JSON.stringify({ error: 'Search limit reached. Upgrade to continue analyzing.' }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
    }

    // Prepare language-specific prompt
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

    const getSectionHeaders = (lang: string) => {
      const headers: Record<string, any> = {
        'en': {
          locationOverview: "🌍 **LOCATION OVERVIEW**",
          demographics: "👥 **DEMOGRAPHICS & TARGET MARKET**",
          businessLandscape: "🏢 **EXISTING BUSINESS LANDSCAPE**",
          opportunities: "🚀 **TOP BUSINESS OPPORTUNITIES**",
          challenges: "⚠️ **POTENTIAL CHALLENGES**",
          marketSize: "💰 **MARKET SIZE ESTIMATION**",
          recommended: "🎯 **RECOMMENDED BUSINESS TYPES**",
          conclusion: "📊 **CONCLUSION & NEXT STEPS**"
        },
        'tr': {
          locationOverview: "🌍 **KONUM GEÇMİŞİ**",
          demographics: "👥 **DEMOGRAFİK VERİLER & HEDEF PAZAR**",
          businessLandscape: "🏢 **MEVCUT İŞ ORTAMI**",
          opportunities: "🚀 **EN İYİ İŞ FIRSATLARI**",
          challenges: "⚠️ **POTANSIYEL ZORLUKLAR**",
          marketSize: "💰 **PAZAR BÜYÜKLÜĞÜ TAHMİNİ**",
          recommended: "🎯 **ÖNERİLEN İŞ TÜRLERİ**",
          conclusion: "📊 **SONUÇ VE SONRAKİ ADIMLAR**"
        }
      }
      return headers[lang] || headers['en']
    }

    const headers = getSectionHeaders(selectedLanguage)

    let businessDataText = ''
    if (businessData) {
      businessDataText = `
REAL GOOGLE MAPS BUSINESS DATA FOR THIS AREA:
- Total businesses found: ${businessData.totalBusinesses}
- Business density: ${businessData.businessDensity.toFixed(1)} businesses per km²
- Average rating: ${businessData.averageRating.toFixed(1)}/5.0
- Business categories: ${Object.keys(businessData.categoryDistribution).join(', ')}
- Top businesses: ${businessData.topBusinesses.slice(0, 5).map((b: any) => `${b.name} (${b.rating}★)`).join(', ')}
- Category breakdown: ${JSON.stringify(businessData.categoryDistribution)}
- Price distribution: ${JSON.stringify(businessData.priceDistribution)}
      `
    }

    const prompt = `${languageInstruction}. 

Analyze the business opportunities for the geographic area with coordinates:
- North: ${selectedArea.bounds.north}
- South: ${selectedArea.bounds.south}  
- East: ${selectedArea.bounds.east}
- West: ${selectedArea.bounds.west}
- Center: ${selectedArea.center.lat}, ${selectedArea.center.lng}

${businessDataText}

Structure your response with these EXACT sections using emojis:

${headers.locationOverview}
(Describe the area type, urban/suburban classification, key landmarks, and reference the actual businesses found)

${headers.demographics}
(Population characteristics, income levels, lifestyle preferences - correlate with the types of businesses found)

${headers.businessLandscape}
(Current businesses based on REAL DATA: ${businessData ? `${businessData.totalBusinesses} businesses found` : 'analyze typical business types'}, competition density, market gaps)

${headers.opportunities}
(3 specific opportunities with reasoning, considering the actual business data)

${headers.challenges}
(Market risks, regulatory issues, competition threats based on existing businesses)

${headers.marketSize}
(Revenue potential, customer base size, growth projections - use business density data)

${headers.recommended}
(Specific business categories suited for this location, considering existing competition)

${headers.conclusion}
(Summary and actionable recommendations based on real data)

Keep each section concise but informative. Use bullet points where appropriate. Reference the actual business data when available.`

    // Call Gemini API
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
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 3000,
          }
        })
      }
    )

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text()
      console.error('Gemini API error:', errorText)
      return new Response(
        JSON.stringify({ error: 'Failed to analyze location' }),
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

    const analysisText = geminiData.candidates[0].content.parts[0].text

    // Update user search count for free tier users
    if (userData.subscription === 'free') {
      await supabaseClient
        .from('app_users')
        .update({
          searches_used: 1,
          last_search_date: new Date().toISOString()
        })
        .eq('id', user.id)
    }

    // Save report to database
    await supabaseClient
      .from('reports')
      .insert({
        user_id: user.id,
        area_data: selectedArea,
        analysis_text: analysisText,
        business_data: businessData || null,
        report_type: 'basic',
        language: selectedLanguage || 'en'
      })

    return new Response(
      JSON.stringify({ analysis: analysisText }),
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
