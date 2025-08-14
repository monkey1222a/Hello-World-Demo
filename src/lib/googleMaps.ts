interface PlaceDetails {
  name: string
  placeId: string
  category: string
  rating?: number
  totalRatings?: number
  address: string
  location: {
    lat: number
    lng: number
  }
  businessStatus?: string
  priceLevel?: number
  website?: string
  phoneNumber?: string
  openingHours?: string[]
  photos?: string[]
}

interface BusinessData {
  totalBusinesses: number
  categoryDistribution: Record<string, number>
  averageRating: number
  priceDistribution: Record<string, number>
  topBusinesses: PlaceDetails[]
  businessDensity: number
  coordinates: {
    lat: number
    lng: number
  }[]
}

export class GoogleMapsService {
  private placesService: google.maps.places.PlacesService | null = null
  private geocoder: google.maps.Geocoder | null = null

  constructor(map: google.maps.Map) {
    if (window.google && window.google.maps) {
      this.placesService = new window.google.maps.places.PlacesService(map)
      this.geocoder = new window.google.maps.Geocoder()
    }
  }

  async fetchBusinessDataInArea(bounds: {
    north: number
    south: number
    east: number
    west: number
  }): Promise<BusinessData> {
    console.log('Starting comprehensive business data fetch for bounds:', bounds)
    
    if (!this.placesService || !this.geocoder) {
      throw new Error('Google Maps services not initialized')
    }

    const businessData: BusinessData = {
      totalBusinesses: 0,
      categoryDistribution: {},
      averageRating: 0,
      priceDistribution: {},
      topBusinesses: [],
      businessDensity: 0,
      coordinates: []
    }

    // Calculate area size for density calculation
    const areaSize = this.calculateAreaSize(bounds)
    console.log('Area size calculated:', areaSize, 'km²')

    // Create search bounds
    const searchBounds = new window.google.maps.LatLngBounds(
      new window.google.maps.LatLng(bounds.south, bounds.west),
      new window.google.maps.LatLng(bounds.north, bounds.east)
    )

    // Search for different types of businesses
    const businessTypes = [
      'restaurant', 'store', 'cafe', 'bank', 'hospital', 'school',
      'gas_station', 'pharmacy', 'supermarket', 'shopping_mall',
      'gym', 'beauty_salon', 'real_estate_agency', 'lawyer',
      'accounting', 'electronics_store', 'clothing_store', 'bakery'
    ]

    const allPlaces: PlaceDetails[] = []

    for (const businessType of businessTypes) {
      try {
        const places = await this.searchPlacesByType(businessType, searchBounds)
        console.log(`Found ${places.length} places for type: ${businessType}`)
        allPlaces.push(...places)
        
        // Small delay to avoid API rate limits
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        console.error(`Error fetching places for type ${businessType}:`, error)
      }
    }

    // Remove duplicates based on place ID
    const uniquePlaces = allPlaces.reduce((acc, place) => {
      if (!acc.find(p => p.placeId === place.placeId)) {
        acc.push(place)
      }
      return acc
    }, [] as PlaceDetails[])

    console.log(`Total unique businesses found: ${uniquePlaces.length}`)

    // Process the data
    businessData.totalBusinesses = uniquePlaces.length
    businessData.businessDensity = uniquePlaces.length / areaSize

    // Category distribution
    uniquePlaces.forEach(place => {
      const category = place.category || 'Other'
      businessData.categoryDistribution[category] = (businessData.categoryDistribution[category] || 0) + 1
      businessData.coordinates.push(place.location)
    })

    // Average rating calculation
    const ratedPlaces = uniquePlaces.filter(p => p.rating)
    if (ratedPlaces.length > 0) {
      businessData.averageRating = ratedPlaces.reduce((sum, p) => sum + (p.rating || 0), 0) / ratedPlaces.length
    }

    // Price level distribution
    uniquePlaces.forEach(place => {
      if (place.priceLevel !== undefined) {
        const priceLabel = this.getPriceLevelLabel(place.priceLevel)
        businessData.priceDistribution[priceLabel] = (businessData.priceDistribution[priceLabel] || 0) + 1
      }
    })

    // Top businesses (highest rated with most reviews)
    businessData.topBusinesses = uniquePlaces
      .filter(p => p.rating && p.totalRatings)
      .sort((a, b) => {
        const scoreA = (a.rating || 0) * Math.log(a.totalRatings || 1)
        const scoreB = (b.rating || 0) * Math.log(b.totalRatings || 1)
        return scoreB - scoreA
      })
      .slice(0, 10)

    console.log('Business data processing complete:', businessData)
    return businessData
  }

  private async searchPlacesByType(type: string, bounds: google.maps.LatLngBounds): Promise<PlaceDetails[]> {
    return new Promise((resolve, reject) => {
      if (!this.placesService) {
        reject(new Error('Places service not available'))
        return
      }

      const request: google.maps.places.PlaceSearchRequest = {
        bounds: bounds,
        type: type as any,
        maxPriceLevel: 4,
        minPriceLevel: 0
      }

      this.placesService.nearbySearch(request, async (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          const detailedPlaces: PlaceDetails[] = []
          
          for (const place of results.slice(0, 20)) { // Limit to 20 per type to avoid quota issues
            try {
              const details = await this.getPlaceDetails(place.place_id!)
              if (details) {
                detailedPlaces.push(details)
              }
            } catch (error) {
              console.error('Error getting place details:', error)
            }
          }
          
          resolve(detailedPlaces)
        } else {
          console.warn(`Places search failed for type ${type}:`, status)
          resolve([])
        }
      })
    })
  }

  private async getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
    return new Promise((resolve) => {
      if (!this.placesService) {
        resolve(null)
        return
      }

      const request: google.maps.places.PlaceDetailsRequest = {
        placeId: placeId,
        fields: [
          'name', 'place_id', 'types', 'rating', 'user_ratings_total',
          'formatted_address', 'geometry', 'business_status', 'price_level',
          'website', 'formatted_phone_number', 'opening_hours', 'photos'
        ]
      }

      this.placesService.getDetails(request, (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          const placeDetails: PlaceDetails = {
            name: place.name || 'Unknown',
            placeId: place.place_id || '',
            category: this.getCategoryFromTypes(place.types || []),
            rating: place.rating,
            totalRatings: place.user_ratings_total,
            address: place.formatted_address || '',
            location: {
              lat: place.geometry?.location?.lat() || 0,
              lng: place.geometry?.location?.lng() || 0
            },
            businessStatus: place.business_status,
            priceLevel: place.price_level,
            website: place.website,
            phoneNumber: place.formatted_phone_number,
            openingHours: place.opening_hours?.weekday_text,
            photos: place.photos?.map(photo => photo.getUrl({ maxWidth: 400, maxHeight: 300 })).slice(0, 3)
          }
          resolve(placeDetails)
        } else {
          resolve(null)
        }
      })
    })
  }

  private getCategoryFromTypes(types: string[]): string {
    const categoryMap: Record<string, string> = {
      'restaurant': 'Restaurant',
      'food': 'Restaurant',
      'meal_takeaway': 'Restaurant',
      'cafe': 'Cafe',
      'store': 'Retail',
      'shopping_mall': 'Shopping',
      'supermarket': 'Grocery',
      'bank': 'Finance',
      'atm': 'Finance',
      'hospital': 'Healthcare',
      'pharmacy': 'Healthcare',
      'doctor': 'Healthcare',
      'school': 'Education',
      'university': 'Education',
      'gas_station': 'Automotive',
      'car_repair': 'Automotive',
      'gym': 'Fitness',
      'beauty_salon': 'Beauty',
      'hair_care': 'Beauty',
      'real_estate_agency': 'Real Estate',
      'lawyer': 'Professional Services',
      'accounting': 'Professional Services'
    }

    for (const type of types) {
      if (categoryMap[type]) {
        return categoryMap[type]
      }
    }

    return 'Other'
  }

  private getPriceLevelLabel(priceLevel: number): string {
    const labels = ['Free', 'Inexpensive', 'Moderate', 'Expensive', 'Very Expensive']
    return labels[priceLevel] || 'Unknown'
  }

  private calculateAreaSize(bounds: {
    north: number
    south: number
    east: number
    west: number
  }): number {
    // Calculate area in square kilometers using Haversine formula approximation
    const latDiff = bounds.north - bounds.south
    const lngDiff = bounds.east - bounds.west
    
    const avgLat = (bounds.north + bounds.south) / 2
    const latKm = latDiff * 111 // 1 degree lat = ~111 km
    const lngKm = lngDiff * 111 * Math.cos(avgLat * Math.PI / 180)
    
    return Math.abs(latKm * lngKm)
  }

  async validateAddress(address: string): Promise<{
    isValid: boolean
    formattedAddress: string
    coordinates?: { lat: number, lng: number }
  }> {
    if (!this.geocoder) {
      throw new Error('Geocoder not initialized')
    }

    return new Promise((resolve) => {
      this.geocoder!.geocode({ address }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          resolve({
            isValid: true,
            formattedAddress: results[0].formatted_address,
            coordinates: {
              lat: results[0].geometry.location.lat(),
              lng: results[0].geometry.location.lng()
            }
          })
        } else {
          resolve({
            isValid: false,
            formattedAddress: address
          })
        }
      })
    })
  }
}