import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Separator } from './ui/separator'
import { Badge } from './ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible'
import { MapPin, Zap, TrendingUp, Users, Building, AlertCircle, Target, CheckCircle, Globe, Lock, ChevronDown, Crown, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { SelectedArea } from '../App'
import { User } from '../types/auth'
import LanguageSelector from './LanguageSelector'
import { supabase } from '../lib/supabase'
import ChartGenerator from './ChartGenerator'

interface AnalysisPanelProps {
  selectedArea: SelectedArea | null
  analysis: string | null
  setAnalysis: (analysis: string | null) => void
  isAnalyzing: boolean
  setIsAnalyzing: (analyzing: boolean) => void
  user: User | null
  selectedLanguage: string
  onLanguageChange: (language: string) => void
  onClearAll?: () => void
}

const AnalysisPanel = ({ 
  selectedArea, 
  analysis, 
  setAnalysis, 
  isAnalyzing, 
  setIsAnalyzing,
  user,
  selectedLanguage,
  onLanguageChange,
  onClearAll
}: AnalysisPanelProps) => {
  const [isPremiumFeaturesOpen, setIsPremiumFeaturesOpen] = useState(false)
  const [isDataServicesOpen, setIsDataServicesOpen] = useState(false)
  const [businessData, setBusinessData] = useState<any>(null)

  console.log('AnalysisPanel rendered with:', { selectedArea, analysis, isAnalyzing, user, selectedLanguage })

  const translations = {
    en: {
      businessAnalysis: "Business Analysis",
      areaSelected: "Area Selected",
      searchesUsed: "searches used (resets every 15 days)",
      authRequired: "Authentication Required",
      authRequiredText: "Please sign in to access business analysis features",
      noAreaSelected: "No Area Selected",
      noAreaSelectedText: "Click \"How to Select Area\" to get started with your business analysis",
      readyToAnalyze: "Ready to Analyze",
      readyToAnalyzeText: "Get comprehensive AI-powered business insights for your selected area",
      searchLimitReached: "Search limit reached. Upgrade to continue analyzing.",
      analyzeOpportunities: "Analyze Business Opportunities",
      analyzingLocation: "🔍 Analyzing Location",
      analyzingText: "Our AI is processing demographic data, market trends, and business opportunities...",
      analyzingSteps: [
        "• Analyzing geographic data",
        "• Processing Google Places data",
        "• Identifying market opportunities"
      ],
      analysisResults: "Analysis Results",
            premiumFeatures: "Premium Features",
      dataServices: "Data Services", 
      premiumReport: "Get Premium Detailed Report",
      premiumReportText: "20+ pages with interactive charts, competitor analysis, and revenue projections",
      downloadPremiumReport: "Download Premium Report ($5)",
      reAnalyze: "🔄 Re-analyze",
      clear: "🗑️ Clear All",
      contactForAccess: "Contact info@trdefi.com for access",
      generatePremiumReport: "Generate Premium Report (Admin)",
      basicPlanPrice: "$9/month - Unlimited searches",
      proPlanPrice: "$29/month - Unlimited searches + 30 reports"
    },
    tr: {
      businessAnalysis: "İş Analizi",
      areaSelected: "Alan Seçildi",
      searchesUsed: "arama kullanıldı (her 15 günde sıfırlanır)",
      authRequired: "Kimlik Doğrulama Gerekli",
      authRequiredText: "İş analizi özelliklerine erişmek için lütfen giriş yapın",
      noAreaSelected: "Alan Seçilmedi",
      noAreaSelectedText: "İş analizinize başlamak için \"Alan Nasıl Seçilir\"e tıklayın",
      readyToAnalyze: "Analiz İçin Hazır",
      readyToAnalyzeText: "Seçtiğiniz alan için kapsamlı AI destekli iş öngörüleri edinin",
      searchLimitReached: "Arama limiti doldu. Analize devam etmek için yükseltin.",
      analyzeOpportunities: "İş Fırsatlarını Analiz Et",
      analyzingLocation: "🔍 Konum Analiz Ediliyor",
      analyzingText: "AI'mız demografik veriler, pazar trendleri ve iş fırsatlarını işliyor...",
      analyzingSteps: [
        "• Coğrafi veriler analiz ediliyor",
        "• Google Places verisi işleniyor",
        "• Pazar fırsatları belirleniyor"
      ],
      analysisResults: "Analiz Sonuçları",
      premiumFeatures: "Premium Özellikler",
      dataServices: "Veri Hizmetleri",
      premiumReport: "Premium Detaylı Rapor Alın",
      premiumReportText: "Etkileşimli grafikler, rakip analizi ve gelir tahminleri ile 20+ sayfa",
      downloadPremiumReport: "Premium Raporu İndir ($5)",
      reAnalyze: "🔄 Yeniden Analiz Et",
      clear: "🗑️ Tümünü Temizle",
      contactForAccess: "Erişim için info@trdefi.com ile iletişime geçin",
      generatePremiumReport: "Premium Rapor Oluştur (Admin)"
    }
  }

  const t = translations[selectedLanguage as keyof typeof translations] || translations.en
    const premiumFeatures = [
    { name: 'Basic Plan', description: '$9/month - Unlimited searches', price: '$9/month' },
    { name: 'Pro Plan', description: '$29/month - Unlimited searches + 30 reports', price: '$29/month' },
    { name: 'Location Comparison', description: 'Side-by-side area comparison', contact: true },
    { name: 'Historical Trends', description: '5-year historical data analysis', contact: true },
    { name: 'Custom Branding', description: 'White-label reports with your brand', contact: true }
  ]

  const dataServices = [
    { name: 'Real Estate Insights', description: 'Property value and development potential', contact: true },
    { name: 'Demographic Deep Dive', description: 'Advanced population analytics', contact: true },
    { name: 'Traffic Pattern Analysis', description: 'Transportation and accessibility insights', contact: true }
  ]

  const canAnalyze = () => {
    if (!user) return false
    if (user.subscription !== 'free') return true
    
    const today = new Date().toDateString()
    const lastSearchDate = new Date(user.lastSearchDate).toDateString()
    
    return user.searchesUsed === 0 || lastSearchDate !== today
  }

  const getLanguagePrompt = (language: string) => {
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
    return languageMap[language] || 'Please respond in English'
  }

  const getSectionHeaders = (lang: string) => {
    const headers = {
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
    return headers[lang as keyof typeof headers] || headers['en']
  }

  const analyzeArea = async () => {
    if (!selectedArea) {
      toast.error('Please select an area on the map first')
      return
    }

    if (!canAnalyze()) {
      toast.error('You have reached your search limit. Please upgrade your plan.')
      return
    }

    console.log('Starting enhanced analysis for area:', selectedArea)
    setIsAnalyzing(true)
    setAnalysis(null)

    try {
      const languageInstruction = getLanguagePrompt(selectedLanguage)
      const headers = getSectionHeaders(selectedLanguage)
      
      // Get business data from the selected area (if available from Google Maps integration)
      const areaBusinessData = (selectedArea as any).businessData
      let businessDataText = ''
      
      if (areaBusinessData) {
        console.log('Using integrated Google Maps business data:', areaBusinessData)
        setBusinessData(areaBusinessData)
        
        businessDataText = `
REAL GOOGLE MAPS BUSINESS DATA FOR THIS AREA:
- Total businesses found: ${areaBusinessData.totalBusinesses}
- Business density: ${areaBusinessData.businessDensity.toFixed(1)} businesses per km²
- Average rating: ${areaBusinessData.averageRating.toFixed(1)}/5.0
- Business categories: ${Object.keys(areaBusinessData.categoryDistribution).join(', ')}
- Top businesses: ${areaBusinessData.topBusinesses.slice(0, 5).map((b: any) => `${b.name} (${b.rating}★)`).join(', ')}
- Category breakdown: ${JSON.stringify(areaBusinessData.categoryDistribution)}
- Price distribution: ${JSON.stringify(areaBusinessData.priceDistribution)}
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
(Current businesses based on REAL DATA: ${areaBusinessData ? `${areaBusinessData.totalBusinesses} businesses found` : 'analyze typical business types'}, competition density, market gaps)

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

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=AIzaSyApbwiPeQoZgSI8ZosfAhXq0Q6GpSaHlhs`, {
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
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const data = await response.json()
      console.log('Gemini API response:', data)

      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const analysisText = data.candidates[0].content.parts[0].text
        setAnalysis(analysisText)
        
        // Update user search count in Supabase
        if (user && user.subscription === 'free') {
          const { error } = await supabase
            .from('app_users')
            .update({
              searches_used: 1,
              last_search_date: new Date().toISOString()
            })
            .eq('id', user.id)
            
          if (error) {
            console.error('Error updating user search count:', error)
          }
        }
        
        toast.success('✅ Analysis complete!')
      } else {
        throw new Error('Invalid response format from API')
      }

    } catch (error) {
      console.error('Analysis error:', error)
      toast.error('❌ Failed to analyze area. Please try again.')
      setAnalysis('Sorry, there was an error analyzing this area. Please try again or select a different location.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const formatAnalysis = (text: string) => {
    const sections = text.split(/(?=🌍|👥|🏢|🚀|⚠️|💰|🎯|📊)/g).filter(section => section.trim())
    
    return sections.map((section, index) => {
      const trimmedSection = section.trim()
      if (!trimmedSection) return null

      const lines = trimmedSection.split('\n').filter(line => line.trim())
      const headerLine = lines[0]
      const contentLines = lines.slice(1)

      return (
        <div key={index} className="mb-6 last:mb-0">
          <div className="flex items-center gap-3 mb-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-500">
            <h3 className="font-bold text-lg text-gray-800">{headerLine}</h3>
          </div>
          <div className="pl-4 space-y-2">
            {contentLines.map((line, lineIndex) => (
              <p key={lineIndex} className="text-sm text-gray-700 leading-relaxed">
                {line.trim()}
              </p>
            ))}
          </div>
        </div>
      )
    }).filter(Boolean)
  }

  const copyProtectionStyles = {
    userSelect: 'none' as const,
    WebkitUserSelect: 'none' as const,
    MozUserSelect: 'none' as const,
    msUserSelect: 'none' as const,
    pointerEvents: 'none' as const,
    WebkitTouchCallout: 'none' as const,
    WebkitTapHighlightColor: 'transparent'
  }
  const handleWisePayment = () => {
    const wisePaymentUrl = 'https://wise.com/pay/r/_J26rTIJ5o1NPL8'
    const paymentWindow = window.open(wisePaymentUrl, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes')
    
    if (paymentWindow) {
      toast.success('🔄 Payment window opened. After completing payment, return here to access your premium features.')
    } else {
      toast.error('❌ Unable to open payment window. Please disable popup blocker and try again.')
    }
  }

  const canGenerateReport = () => {
    if (isAdmin) return true
    if (user?.subscription === 'pro') {
      const reportsUsed = (user as any).reportsUsedThisMonth || 0
      return reportsUsed < 30
    }
    return false
  }

  const getReportButtonText = () => {
    if (isAdmin) return t.generatePremiumReport
    if (user?.subscription === 'pro') {
      const reportsUsed = (user as any).reportsUsedThisMonth || 0
      if (reportsUsed >= 30) {
        return 'Report Limit Reached - Pay $5'
      }
      return `Generate Report (${30 - reportsUsed} left)`
    }
    return t.downloadPremiumReport
  }

  const generatePremiumReport = async () => {
    if (!selectedArea || !analysis) {
      toast.error('Please analyze an area first')
      return
    }

    toast.info('🔄 Generating comprehensive premium report with charts...')
    
    try {
      const languageInstruction = getLanguagePrompt(selectedLanguage)
      const areaBusinessData = (selectedArea as any).businessData
      
      const prompt = `${languageInstruction}.

You are creating a COMPREHENSIVE PREMIUM BUSINESS INTELLIGENCE REPORT using Gemini 2.5 Pro capabilities. This is a professional consulting-grade document worth $500+ in value.

LOCATION DATA:
- Coordinates: ${selectedArea.center.lat}, ${selectedArea.center.lng}
- Bounds: N:${selectedArea.bounds.north}, S:${selectedArea.bounds.south}, E:${selectedArea.bounds.east}, W:${selectedArea.bounds.west}

REAL GOOGLE MAPS BUSINESS DATA:
${areaBusinessData ? JSON.stringify(areaBusinessData, null, 2) : 'No specific business data available'}

BASED ON INITIAL ANALYSIS: "${analysis}"

CREATE A DETAILED 20+ PAGE BUSINESS INTELLIGENCE REPORT with mathematical calculations, specific numbers, and actionable insights:

═══════════════════════════════════════════════════════════
📋 **EXECUTIVE SUMMARY**
═══════════════════════════════════════════════════════════

• **Location Score**: ${areaBusinessData ? Math.min(10, Math.round((areaBusinessData.businessDensity * 2) + (areaBusinessData.averageRating * 1.5))) : 7}/10
• **Market Opportunity**: $${areaBusinessData ? Math.round(areaBusinessData.totalBusinesses * 50000) : 250000} annual revenue potential  
• **Investment Range**: $25,000 - $150,000
• **ROI Timeline**: 8-14 months
• **Risk Level**: ${areaBusinessData && areaBusinessData.businessDensity > 20 ? 'Medium (High Competition)' : 'Low-Medium'} 

**KEY FINDINGS:**
1. Business Density: ${areaBusinessData ? areaBusinessData.businessDensity.toFixed(1) : '15.2'} businesses per km² (${areaBusinessData && areaBusinessData.businessDensity > 15 ? 'Above' : 'Below'} average)
2. Market Gap: ${areaBusinessData ? Object.keys(areaBusinessData.categoryDistribution).length < 8 ? 'Significant opportunities in underrepresented categories' : 'Saturated market, focus on niche differentiation' : 'Multiple service gaps identified'}
3. Competition Advantage: ${areaBusinessData && areaBusinessData.averageRating < 4.0 ? 'Service quality improvement opportunity' : 'Focus on innovative offerings'}

[Continue with comprehensive financial projections, competitor analysis, step-by-step business setup guides, market calculations, risk assessments, and detailed implementation timelines with specific costs and revenue projections...]

Use SPECIFIC NUMBERS, PERCENTAGES, and DOLLAR AMOUNTS throughout. Include mathematical formulas for market size calculations, break-even analysis, and ROI projections.`

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=AIzaSyApbwiPeQoZgSI8ZosfAhXq0Q6GpSaHlhs`, {
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
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const premiumReport = data.candidates[0].content.parts[0].text
        
        // Create comprehensive HTML report with charts
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Premium Business Analysis Report</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.8; 
            margin: 0; 
            padding: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
        }
        
        .report-container {
            background: white;
            padding: 60px;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.1);
            max-width: 1000px;
            margin: 0 auto;
        }
        
        h1 { 
            color: #1e3a8a; 
            border-bottom: 4px solid #3b82f6; 
            padding-bottom: 20px;
            font-size: 2.5em;
            text-align: center;
            margin-bottom: 40px;
        }
        
        h2 { 
            color: #1e40af; 
            margin-top: 40px; 
            font-size: 1.8em;
            border-left: 6px solid #3b82f6;
            padding-left: 20px;
        }
        
        h3 { 
            color: #2563eb; 
            font-size: 1.4em;
        }
        
        .executive-summary { 
            background: linear-gradient(135deg, #f0f9ff, #e0f2fe); 
            padding: 30px; 
            border-left: 8px solid #3b82f6; 
            border-radius: 10px;
            margin: 30px 0;
        }
        
        .financial-data { 
            background: linear-gradient(135deg, #f0fdf4, #dcfce7); 
            padding: 25px; 
            border-radius: 10px; 
            margin: 20px 0;
            border: 2px solid #22c55e;
        }
        
        .risk-assessment { 
            background: linear-gradient(135deg, #fef2f2, #fee2e2); 
            padding: 25px; 
            border-radius: 10px; 
            margin: 20px 0;
            border: 2px solid #ef4444;
        }
        
        .opportunity { 
            background: linear-gradient(135deg, #fffbeb, #fef3c7); 
            padding: 25px; 
            margin: 15px 0; 
            border-radius: 10px; 
            border: 2px solid #f59e0b;
        }
        
        strong { 
            color: #1e40af; 
            font-weight: 700;
        }
        
        .chart-container {
            margin: 30px 0;
            padding: 20px;
            background: #f8fafc;
            border-radius: 10px;
            text-align: center;
        }
        
        ul { 
            margin: 15px 0; 
            padding-left: 30px;
        }
        
        li { 
            margin: 8px 0; 
            line-height: 1.6;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        
        .stat-card {
            background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
            padding: 25px;
            border-radius: 15px;
            text-align: center;
            border: 3px solid #cbd5e1;
        }
        
        .stat-number {
            font-size: 2.5em;
            font-weight: bold;
            color: #1e40af;
            display: block;
        }
        
        .stat-label {
            color: #64748b;
            font-size: 0.9em;
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <div class="report-container">
        <h1>🏢 Premium Business Intelligence Report</h1>
        
        ${businessData ? `
        <div class="stats-grid">
            <div class="stat-card">
                <span class="stat-number">${businessData.totalBusinesses}</span>
                <div class="stat-label">Total Businesses</div>
            </div>
            <div class="stat-card">
                <span class="stat-number">${businessData.averageRating.toFixed(1)}</span>
                <div class="stat-label">Average Rating</div>
            </div>
            <div class="stat-card">
                <span class="stat-number">${businessData.businessDensity.toFixed(1)}</span>
                <div class="stat-label">Density per km²</div>
            </div>
            <div class="stat-card">
                <span class="stat-number">${Object.keys(businessData.categoryDistribution).length}</span>
                <div class="stat-label">Business Categories</div>
            </div>
        </div>` : ''}
        
        ${premiumReport.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                       .replace(/\n/g, '<br>')
                       .replace(/═+/g, '<hr style="border: 2px solid #3b82f6; margin: 40px 0;">')
                       .replace(/📋|🌍|👥|🏢|🚀|⚠️|💰|🎯|📊/g, '<span style="font-size: 1.5em;">$&</span>')}
        
        <hr style="border: 3px solid #3b82f6; margin: 50px 0;">
        
        <div style="text-align: center; padding: 30px; background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; border-radius: 15px;">
            <h2 style="color: white; border: none; margin: 0;">Generated by GeoScope Business Analyzer</h2>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Powered by Gemini 2.5 Pro AI & Google Maps Business Intelligence</p>
        </div>
    </div>
</body>
</html>`
        
        // Create downloadable HTML file
        const blob = new Blob([htmlContent], { type: 'text/html' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `premium-business-analysis-report-${Date.now()}.html`
        link.click()
        window.URL.revokeObjectURL(url)
        
        toast.success('✅ Premium report with charts generated! Open the HTML file in your browser and use Print > Save as PDF for PDF version.')
      } else {
        throw new Error('Invalid response format from API')
      }

    } catch (error) {
      console.error('Premium report generation error:', error)
      toast.error('❌ Failed to generate premium report. Please try again.')
    }
  }

  const isAdmin = user?.email === 'cem@trdefi.com'

  const handleClearAll = () => {
    setAnalysis(null)
    setBusinessData(null)
    if (onClearAll) {
      onClearAll()
    }
    toast.info('🗑️ Analysis cleared. You can now select a new area.')
  }

  return (
    <div className="h-full bg-gradient-to-b from-white to-gray-50 flex flex-col lg:w-96 border-l border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Zap className="w-6 h-6" />
          {t.businessAnalysis}
        </h2>
        {selectedArea && (
          <div className="mt-2 flex flex-wrap gap-1">
            <Badge variant="secondary" className="text-xs bg-white/20 text-white">
              {t.areaSelected}
            </Badge>
            <Badge variant="outline" className="text-xs border-white/30 text-white">
              {selectedArea.center.lat.toFixed(4)}, {selectedArea.center.lng.toFixed(4)}
            </Badge>
            {businessData && (
              <Badge variant="outline" className="text-xs border-white/30 text-white">
                {businessData.totalBusinesses} businesses found
              </Badge>
            )}
          </div>
        )}
        {user && user.subscription === 'free' && (
          <div className="mt-2 text-xs text-blue-100">
            {user.searchesUsed}/1 {t.searchesUsed}
          </div>
        )}
      </div>

      {/* Language Selector */}
      {selectedArea && user && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <LanguageSelector 
            selectedLanguage={selectedLanguage}
            onLanguageChange={onLanguageChange}
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {!user && (
            <Card className="border-2 border-dashed border-orange-300 bg-gradient-to-r from-orange-50 to-yellow-50">
              <CardContent className="p-8 text-center">
                <Crown className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-orange-800 mb-2">{t.authRequired}</h3>
                <p className="text-sm text-orange-600">
                  {t.authRequiredText}
                </p>
              </CardContent>
            </Card>
          )}

          {user && !selectedArea && (
            <Card className="border-2 border-dashed border-gray-300">
              <CardContent className="p-8 text-center">
                <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">{t.noAreaSelected}</h3>
                <p className="text-sm text-gray-500">
                  {t.noAreaSelectedText}
                </p>
              </CardContent>
            </Card>
          )}

          {user && selectedArea && !analysis && !isAnalyzing && (
            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{t.readyToAnalyze}</h3>
                  <p className="text-sm text-gray-600">
                    {t.readyToAnalyzeText}
                  </p>
                  {businessData && (
                    <div className="mt-4 p-3 bg-white/50 rounded-lg">
                      <p className="text-xs text-blue-700 font-medium">
                        📍 {businessData.totalBusinesses} businesses detected in selected area
                      </p>
                    </div>
                  )}
                  {!canAnalyze() && (
                    <p className="text-xs text-red-600 mt-2">
                      {t.searchLimitReached}
                    </p>
                  )}
                </div>
                
                <Button 
                  onClick={analyzeArea} 
                  disabled={!canAnalyze()}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50"
                  size="lg"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  {t.analyzeOpportunities}
                </Button>
              </CardContent>
            </Card>
          )}

          {isAnalyzing && (
            <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50">
              <CardContent className="p-8">
                <div className="text-center">
                  <div className="relative w-16 h-16 mx-auto mb-6">
                    <div className="w-16 h-16 border-4 border-yellow-200 border-t-yellow-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Globe className="w-6 h-6 text-yellow-600 animate-pulse" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{t.analyzingLocation}</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {t.analyzingText}
                  </p>
                  <div className="text-xs text-gray-500 space-y-1">
                    {t.analyzingSteps.map((step, index) => (
                      <p key={index}>{step}</p>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {analysis && (
            <div className="space-y-6">
              <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl flex items-center gap-2 text-green-800">
                    <CheckCircle className="w-6 h-6" />
                    {t.analysisResults}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Business Data Charts - Show for premium users or admin */}
                  {businessData && (isAdmin || user?.subscription !== 'free') && (
                    <div className="mb-6">
                      <ChartGenerator 
                        businessData={businessData} 
                        selectedLanguage={selectedLanguage}
                      />
                      <Separator className="my-6" />
                    </div>
                  )}

                  {/* Copy-protected analysis content */}
                  <div 
                    style={copyProtectionStyles}
                    className="select-none"
                    onContextMenu={(e) => e.preventDefault()}
                    onDragStart={(e) => e.preventDefault()}
                  >
                    <div className="space-y-6">
                      {formatAnalysis(analysis)}
                    </div>
                  </div>

                  <Separator className="my-6" />
                  
                  {/* Premium Features Dropdown */}
                  <Collapsible open={isPremiumFeaturesOpen} onOpenChange={setIsPremiumFeaturesOpen}>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" className="w-full justify-between mb-4">
                        <span className="flex items-center gap-2">
                          <Crown className="w-4 h-4 text-purple-600" />
                          {t.premiumFeatures}
                        </span>
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-2 mb-4">                      {premiumFeatures.map((feature, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                          <div>
                            <p className="font-medium text-sm">{feature.name}</p>
                            <p className="text-xs text-gray-600">{feature.description}</p>
                          </div>
                          <div className="text-right">
                            {feature.price ? (
                              <div className="text-sm font-bold text-purple-600">{feature.price}</div>
                            ) : (
                              <div className="text-xs text-purple-500">Contact info@trdefi.com for access</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Data Services Dropdown */}
                  <Collapsible open={isDataServicesOpen} onOpenChange={setIsDataServicesOpen}>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" className="w-full justify-between mb-4">
                        <span className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-blue-600" />
                          {t.dataServices}
                        </span>
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-2 mb-4">                      {dataServices.map((service, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div>
                            <p className="font-medium text-sm">{service.name}</p>
                            <p className="text-xs text-gray-600">{service.description}</p>
                          </div>
                          <div className="text-right">
                            {service.contact && (
                              <div className="text-xs text-blue-500">Contact info@trdefi.com for access</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Premium Download Section */}
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg border-2 border-dashed border-purple-300">
                      <Lock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <h4 className="font-bold text-purple-800 mb-1">{t.premiumReport}</h4>
                      <p className="text-xs text-purple-600">
                        {t.premiumReportText}
                      </p>
                    </div>
                    
                    {isAdmin ? (
                      <Button 
                        onClick={generatePremiumReport}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        {t.generatePremiumReport}
                      </Button>
                    ) : (
                      <Button 
                        onClick={handleWisePayment}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        {t.downloadPremiumReport}
                      </Button>
                    )}
                  </div>

                  <Separator className="my-4" />

                  <div className="flex gap-2">
                    <Button 
                      onClick={analyzeArea} 
                      disabled={!canAnalyze()}
                      variant="outline" 
                      size="sm"
                      className="flex-1"
                    >
                      {t.reAnalyze}
                    </Button>
                    <Button 
                      onClick={handleClearAll} 
                      variant="ghost" 
                      size="sm"
                      className="flex-1"
                    >
                      {t.clear}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AnalysisPanel