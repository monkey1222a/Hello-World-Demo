import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Search } from 'lucide-react'
import { SelectedArea } from '../App'
import InstructionsModal from './InstructionsModal'
import { GoogleMapsService } from '../lib/googleMaps'

interface MapViewProps {
  onAreaSelected: (area: SelectedArea | null) => void
  selectedArea: SelectedArea | null
  selectedLanguage: string
  isAnalyzed?: boolean
}

declare global {
  interface Window {
    google: any
  }
}

const MapView = ({ onAreaSelected, selectedArea, selectedLanguage, isAnalyzed = false }: MapViewProps) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const rectangleRef = useRef<any>(null)
  const drawingManagerRef = useRef<any>(null)
  const searchBoxRef = useRef<any>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false)
  const googleMapsService = useRef<GoogleMapsService | null>(null)

  console.log('MapView rendered with props:', { selectedArea, selectedLanguage, isAnalyzed })

  const translations = {
    en: {
      areaSelected: '✅ Area selected! Click "Analyze" to get business insights.',
      selectionCleared: '🗑️ Selection cleared',
      searchPlaceholder: 'Search for a location...'
    },
    de: {
      areaSelected: '✅ Gebiet ausgewählt! Klicken Sie auf "Analysieren" für Geschäftseinblicke.',
      selectionCleared: '🗑️ Auswahl gelöscht',
      searchPlaceholder: 'Nach einem Ort suchen...'
    },
    tr: {
      areaSelected: '✅ Alan seçildi! İş öngörüleri için "Analiz Et"e tıklayın.',
      selectionCleared: '🗑️ Seçim temizlendi',
      searchPlaceholder: 'Konum ara...'
    },
    es: {
      areaSelected: '✅ ¡Área seleccionada! Haga clic en "Analizar" para obtener información comercial.',
      selectionCleared: '🗑️ Selección eliminada',
      searchPlaceholder: 'Buscar una ubicación...'
    },
    fr: {
      areaSelected: '✅ Zone sélectionnée! Cliquez sur "Analyser" pour obtenir des informations commerciales.',
      selectionCleared: '🗑️ Sélection effacée',
      searchPlaceholder: 'Rechercher un lieu...'
    },
    nl: {
      areaSelected: '✅ Gebied geselecteerd! Klik op "Analyseren" voor bedrijfsinzichten.',
      selectionCleared: '🗑️ Selectie gewist',
      searchPlaceholder: 'Zoek naar een locatie...'
    },
    ar: {
      areaSelected: '✅ تم اختيار المنطقة! انقر على "تحليل" للحصول على رؤى الأعمال.',
      selectionCleared: '🗑️ تم مسح التحديد',
      searchPlaceholder: 'البحث عن موقع...'
    },
    he: {
      areaSelected: '✅ אזור נבחר! לחץ על "נתח" כדי לקבל תובנות עסקיות.',
      selectionCleared: '🗑️ הבחירה נמחקה',
      searchPlaceholder: 'חפש מיקום...'
    }
  }

  const t = translations[selectedLanguage as keyof typeof translations] || translations.en

  useEffect(() => {
    const checkGoogleMaps = () => {
      if (window.google && window.google.maps) {
        console.log('Google Maps API loaded successfully')
        setIsGoogleMapsLoaded(true)
      } else {
        console.log('Waiting for Google Maps API to load...')
        setTimeout(checkGoogleMaps, 100)
      }
    }

    checkGoogleMaps()
  }, [])

  useEffect(() => {
    if (!isGoogleMapsLoaded || !mapRef.current) return

    console.log('Initializing Google Map with enhanced business data integration')
    
    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 40.7128, lng: -74.0060 },
      zoom: 13,
      mapTypeId: window.google.maps.MapTypeId.TERRAIN,
      mapTypeControl: true,
      mapTypeControlOptions: {
        style: window.google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
        position: window.google.maps.ControlPosition.TOP_RIGHT,
        mapTypeIds: [
          window.google.maps.MapTypeId.ROADMAP,
          window.google.maps.MapTypeId.TERRAIN,
          window.google.maps.MapTypeId.SATELLITE,
          window.google.maps.MapTypeId.HYBRID
        ]
      },
      streetViewControl: false,
      fullscreenControl: true,
      fullscreenControlOptions: {
        position: window.google.maps.ControlPosition.RIGHT_TOP
      },
      zoomControl: true,
      zoomControlOptions: {
        position: window.google.maps.ControlPosition.RIGHT_CENTER
      },
      scaleControl: true,
      styles: [
        {
          featureType: 'all',
          elementType: 'labels',
          stylers: [{ visibility: 'on' }]
        },
        {
          featureType: 'administrative',
          elementType: 'geometry.stroke',
          stylers: [{ color: '#c0c0c0' }, { weight: 1.5 }]
        },
        {
          featureType: 'road.highway',
          elementType: 'geometry.fill',
          stylers: [{ color: '#ff6600' }, { weight: 1.5 }]
        },
        {
          featureType: 'water',
          elementType: 'geometry.fill',
          stylers: [{ color: '#4285f4' }]
        },
        {
          featureType: 'poi',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#757575' }]
        }
      ]
    })

    mapInstance.current = map
    googleMapsService.current = new GoogleMapsService(map)

    // Initialize search box
    if (searchInputRef.current) {
      const searchBox = new window.google.maps.places.SearchBox(searchInputRef.current)
      searchBoxRef.current = searchBox
      
      map.addListener('bounds_changed', () => {
        searchBox.setBounds(map.getBounds()!)
      })

      searchBox.addListener('places_changed', () => {
        const places = searchBox.getPlaces()
        if (places.length === 0) return

        const bounds = new window.google.maps.LatLngBounds()
        places.forEach((place: any) => {
          if (!place.geometry || !place.geometry.location) return

          if (place.geometry.viewport) {
            bounds.union(place.geometry.viewport)
          } else {
            bounds.extend(place.geometry.location)
          }
        })
        map.fitBounds(bounds)
      })
    }

    const drawingManager = new window.google.maps.drawing.DrawingManager({
      drawingMode: null,
      drawingControl: true,
      drawingControlOptions: {
        position: window.google.maps.ControlPosition.TOP_CENTER,
        drawingModes: ['rectangle'],
      },
      rectangleOptions: {
        fillColor: '#0ea5e9',
        fillOpacity: 0.3,
        strokeWeight: 4,
        strokeColor: '#0284c7',
        strokeOpacity: 0.9,
        clickable: false,
        editable: true,
        draggable: true,
      },
    })

    // Enhanced CSS for larger, more visible drawing controls
    const style = document.createElement('style')
    style.textContent = `
      /* Make drawing manager controls much larger and more prominent */
      .gmnoprint .gm-control-active > div {
        width: 160px !important;
        height: 160px !important;
        transform: scale(4) !important;
        transform-origin: center !important;
        margin: 60px !important;
        border: 8px solid #1e40af !important;
        border-radius: 20px !important;
        background: linear-gradient(135deg, #3b82f6, #1d4ed8) !important;
        box-shadow: 0 16px 48px rgba(59, 130, 246, 0.9) !important;
        transition: all 0.3s ease !important;
        z-index: 1000 !important;
      }
      
      .gmnoprint .gm-control-active > div:hover {
        transform: scale(4.5) !important;
        box-shadow: 0 20px 60px rgba(59, 130, 246, 1) !important;
        border-color: #1e3a8a !important;
      }
      
      /* Make rectangle tool much more visible */
      .gmnoprint [title*="rectangle"] img,
      .gmnoprint [title*="Rectangle"] img {
        filter: brightness(0) invert(1) !important;
        width: 80px !important;
        height: 80px !important;
      }
      
      /* Position controls at top center */
      .gmnoprint div[controlwidth] {
        top: 80px !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        z-index: 2000 !important;
      }
      
      .gmnoprint .gm-control-active {
        z-index: 2001 !important;
      }
      
      /* Search box styling - positioned to avoid conflict */
      .map-search-container {
        position: absolute;
        top: 20px;
        left: 20px;
        z-index: 1500;
        width: 300px;
      }
      
      /* Make map type controls smaller and less prominent */
      .gm-style .gm-control-active > div[style*="background-color"] {
        transform: scale(0.6) !important;
        border: 1px solid #e5e7eb !important;
        border-radius: 4px !important;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1) !important;
      }
      
      /* Make zoom controls smaller */
      .gm-style .gmnoprint .gm-bundled-control div {
        transform: scale(0.7) !important;
        border: 1px solid #e5e7eb !important;
        border-radius: 3px !important;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1) !important;
      }
    `
    document.head.appendChild(style)

    drawingManager.setMap(map)
    drawingManagerRef.current = drawingManager

    drawingManager.addListener('rectanglecomplete', async (rectangle: any) => {
      console.log('Rectangle drawing completed')
      
      if (rectangleRef.current) {
        rectangleRef.current.setMap(null)
      }
      
      rectangleRef.current = rectangle
      
      const bounds = rectangle.getBounds()
      const ne = bounds.getNorthEast()
      const sw = bounds.getSouthWest()
      
      const selectedArea: SelectedArea = {
        bounds: {
          north: ne.lat(),
          south: sw.lat(),
          east: ne.lng(),
          west: sw.lng(),
        },
        center: {
          lat: bounds.getCenter().lat(),
          lng: bounds.getCenter().lng(),
        }
      }

      console.log('Area selected:', selectedArea)
      
      // Fetch business data immediately when area is selected
      try {
        if (googleMapsService.current) {
          console.log('Fetching business data for selected area...')
          const businessData = await googleMapsService.current.fetchBusinessDataInArea(selectedArea.bounds)
          console.log('Business data fetched:', businessData)
          
          // Store business data in the selected area object
          (selectedArea as any).businessData = businessData
        }
      } catch (error) {
        console.error('Error fetching business data:', error)
        toast.error('Failed to fetch business data, but analysis can still proceed')
      }

      onAreaSelected(selectedArea)
      toast.success(t.areaSelected)
      drawingManager.setDrawingMode(null)

      rectangle.addListener('bounds_changed', async () => {
        const newBounds = rectangle.getBounds()
        const newNe = newBounds.getNorthEast()
        const newSw = newBounds.getSouthWest()
        
        const updatedArea: SelectedArea = {
          bounds: {
            north: newNe.lat(),
            south: newSw.lat(),
            east: newNe.lng(),
            west: newSw.lng(),
          },
          center: {
            lat: newBounds.getCenter().lat(),
            lng: newBounds.getCenter().lng(),
          }
        }

        // Re-fetch business data for updated area
        try {
          if (googleMapsService.current) {
            const businessData = await googleMapsService.current.fetchBusinessDataInArea(updatedArea.bounds)
            ;(updatedArea as any).businessData = businessData
          }
        } catch (error) {
          console.error('Error fetching updated business data:', error)
        }

        console.log('Area updated:', updatedArea)
        onAreaSelected(updatedArea)
      })
    })

  }, [isGoogleMapsLoaded, onAreaSelected, t.areaSelected])

  if (!isGoogleMapsLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Loading Google Maps</h3>
          <p className="text-muted-foreground">Preparing interactive map interface...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Search Box - Repositioned to avoid conflict with instructions */}
      <div className="map-search-container">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder={t.searchPlaceholder}
            className="w-full pl-10 pr-4 py-3 bg-white/95 backdrop-blur-sm border border-gray-300 rounded-lg shadow-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      
      {/* Instructions Modal - Positioned to avoid search box conflict */}
      <div className="absolute top-20 left-4 z-10">
        <InstructionsModal selectedLanguage={selectedLanguage} />
      </div>

      {/* Clear Selection Button - Only show when area is selected but not yet analyzed */}
      {selectedArea && !isAnalyzed && (
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-3 shadow-lg z-10">
          <button
            onClick={() => {
              if (rectangleRef.current) {
                rectangleRef.current.setMap(null)
                rectangleRef.current = null
              }
              onAreaSelected(null)
              toast.info(t.selectionCleared)
            }}
            className="text-sm px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
          >
            Clear Selection
          </button>
        </div>
      )}
    </div>
  )
}

export default MapView