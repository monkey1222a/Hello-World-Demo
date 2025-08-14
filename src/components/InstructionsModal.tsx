import { useState } from 'react'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { HelpCircle, MapPin } from 'lucide-react'

interface InstructionsModalProps {
  selectedLanguage: string
}

const InstructionsModal = ({ selectedLanguage }: InstructionsModalProps) => {
  const translations = {
    en: {
      howToSelect: "How to Select Area",
      areaSelectionGuide: "Area Selection Guide",
      step1: "Click the rectangle tool above the map to activate drawing mode",
      step2: "Click and drag to draw your analysis area on the map",
      step3: "You can resize and move the rectangle after drawing",
      step4: "Use the analysis panel to get AI-powered business insights"
    },
    de: {
      howToSelect: "Bereich Auswählen",
      areaSelectionGuide: "Anleitung zur Bereichsauswahl",
      step1: "Klicken Sie auf das Rechteck-Tool über der Karte, um den Zeichenmodus zu aktivieren",
      step2: "Klicken und ziehen Sie, um Ihren Analysebereich auf der Karte zu zeichnen",
      step3: "Sie können das Rechteck nach dem Zeichnen in der Größe ändern und verschieben",
      step4: "Verwenden Sie das Analysepanel für KI-gestützte Geschäftseinblicke"
    },
    tr: {
      howToSelect: "Alan Nasıl Seçilir",
      areaSelectionGuide: "Alan Seçimi Rehberi",
      step1: "Çizim modunu etkinleştirmek için haritanın üzerindeki dikdörtgen aracına tıklayın",
      step2: "Haritada analiz alanınızı çizmek için tıklayın ve sürükleyin",
      step3: "Çizdikten sonra dikdörtgeni yeniden boyutlandırabilir ve taşıyabilirsiniz",
      step4: "AI destekli iş öngörüleri için analiz panelini kullanın"
    },
    es: {
      howToSelect: "Cómo Seleccionar Área",
      areaSelectionGuide: "Guía de Selección de Área",
      step1: "Haga clic en la herramienta de rectángulo sobre el mapa para activar el modo de dibujo",
      step2: "Haga clic y arrastre para dibujar su área de análisis en el mapa",
      step3: "Puede redimensionar y mover el rectángulo después de dibujar",
      step4: "Use el panel de análisis para obtener información comercial impulsada por IA"
    },
    fr: {
      howToSelect: "Comment Sélectionner une Zone",
      areaSelectionGuide: "Guide de Sélection de Zone",
      step1: "Cliquez sur l'outil rectangle au-dessus de la carte pour activer le mode dessin",
      step2: "Cliquez et faites glisser pour dessiner votre zone d'analyse sur la carte",
      step3: "Vous pouvez redimensionner et déplacer le rectangle après l'avoir dessiné",
      step4: "Utilisez le panneau d'analyse pour obtenir des informations commerciales alimentées par l'IA"
    },
    nl: {
      howToSelect: "Hoe Gebied Selecteren",
      areaSelectionGuide: "Gebied Selectie Gids",
      step1: "Klik op de rechthoek tool boven de kaart om de tekenmodus te activeren",
      step2: "Klik en sleep om uw analysegebied op de kaart te tekenen",
      step3: "U kunt de rechthoek na het tekenen vergroten/verkleinen en verplaatsen",
      step4: "Gebruik het analysepaneel voor AI-gedreven bedrijfsinzichten"
    },
    ar: {
      howToSelect: "كيفية اختيار المنطقة",
      areaSelectionGuide: "دليل اختيار المنطقة",
      step1: "انقر على أداة المستطيل أعلى الخريطة لتفعيل وضع الرسم",
      step2: "انقر واسحب لرسم منطقة التحليل على الخريطة",
      step3: "يمكنك تغيير حجم ونقل المستطيل بعد الرسم",
      step4: "استخدم لوحة التحليل للحصول على رؤى الأعمال المدعومة بالذكاء الاصطناعي"
    },
    he: {
      howToSelect: "איך לבחור אזור",
      areaSelectionGuide: "מדריך בחירת אזור",
      step1: "לחץ על כלי המלבן מעל המפה כדי להפעיל מצב ציור",
      step2: "לחץ וגרור כדי לצייר את אזור הניתוח שלך על המפה",
      step3: "אתה יכול לשנות גודל ולהזיז את המלבן לאחר הציור",
      step4: "השתמש בלוח הניתוח כדי לקבל תובנות עסקיות מבוססות AI"
    }
  }

  const t = translations[selectedLanguage as keyof typeof translations] || translations.en

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm border-gray-300 shadow-lg z-10"
        >
          <HelpCircle className="w-4 h-4 mr-2" />
          {t.howToSelect}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            {t.areaSelectionGuide}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
            <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</div>
            <p>{t.step1}</p>
          </div>
          <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
            <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</div>
            <p>{t.step2}</p>
          </div>
          <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
            <div className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</div>
            <p>{t.step3}</p>
          </div>
          <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
            <div className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">4</div>
            <p>{t.step4}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default InstructionsModal