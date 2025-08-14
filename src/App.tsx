import { useState } from 'react'
import { Toaster } from './components/ui/sonner'
import Header from './components/Header'
import MapView from './components/MapView'
import AnalysisPanel from './components/AnalysisPanel'
import AuthModal from './components/AuthModal'
import { AuthProvider, useAuth } from './hooks/useAuth'

export interface SelectedArea {
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  center: {
    lat: number;
    lng: number;
  };
  businessData?: any; // Will contain Google Maps business data
}

function AppContent() {
  const [selectedArea, setSelectedArea] = useState<SelectedArea | null>(null)
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState('')
  const { user, loading } = useAuth()

  console.log('App rendered with selectedArea:', selectedArea)
  console.log('Current analysis state:', analysis)
  console.log('Is analyzing:', isAnalyzing)
  console.log('Current user:', user)
  console.log('Selected language:', selectedLanguage)

    const handleLogout = async () => {
    console.log('App handleLogout called - clearing all state')
    setSelectedArea(null)
    setAnalysis(null)
    setIsAnalyzing(false)
    setSelectedLanguage('')
  }

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language)
    // Clear analysis when language changes to avoid confusion
    if (analysis) {
      setAnalysis(null)
    }
  }

  // Clear all function for the analysis panel
  const handleClearAll = () => {
    setSelectedArea(null)
    setAnalysis(null)
    setIsAnalyzing(false)
  }

  // Check if area has been analyzed
  const isAnalyzed = !!analysis

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Loading GeoScope</h3>
          <p className="text-gray-600">Initializing application...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Header 
        user={user} 
        onLogout={handleLogout}
        selectedLanguage={selectedLanguage}
        onLanguageChange={handleLanguageChange}
      />
      
      {/* Desktop Layout */}
      <div className="hidden lg:flex h-[calc(100vh-4rem)]">
        <div className="flex-1">
          <MapView 
            onAreaSelected={setSelectedArea}
            selectedArea={selectedArea}
            selectedLanguage={selectedLanguage}
            isAnalyzed={isAnalyzed}
          />
        </div>
        <AnalysisPanel 
          selectedArea={selectedArea}
          analysis={analysis}
          setAnalysis={setAnalysis}
          isAnalyzing={isAnalyzing}
          setIsAnalyzing={setIsAnalyzing}
          user={user}
          selectedLanguage={selectedLanguage}
          onLanguageChange={handleLanguageChange}
          onClearAll={handleClearAll}
        />
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden flex flex-col h-[calc(100vh-4rem)]">
        {/* Map Section - Top half on mobile */}
        <div className="flex-1 min-h-[50vh]">
          <MapView 
            onAreaSelected={setSelectedArea}
            selectedArea={selectedArea}
            selectedLanguage={selectedLanguage}
            isAnalyzed={isAnalyzed}
          />
        </div>
        
        {/* Analysis Panel - Bottom half on mobile */}
        <div className="flex-1 border-t border-border">
          <AnalysisPanel 
            selectedArea={selectedArea}
            analysis={analysis}
            setAnalysis={setAnalysis}
            isAnalyzing={isAnalyzing}
            setIsAnalyzing={setIsAnalyzing}
            user={user}
            selectedLanguage={selectedLanguage}
            onLanguageChange={handleLanguageChange}
            onClearAll={handleClearAll}
          />
        </div>
      </div>

      {/* Authentication Modal */}
      <AuthModal 
        isOpen={!user || !selectedLanguage} 
        selectedLanguage={selectedLanguage}
        onLanguageChange={handleLanguageChange}
      />

      <Toaster />
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App