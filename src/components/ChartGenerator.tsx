import React from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ResponsiveContainer } from 'recharts'

interface BusinessData {
  totalBusinesses: number
  categoryDistribution: Record<string, number>
  averageRating: number
  priceDistribution: Record<string, number>
  topBusinesses: any[]
  businessDensity: number
  coordinates: { lat: number, lng: number }[]
}

interface ChartGeneratorProps {
  businessData: BusinessData
  selectedLanguage: string
}

const ChartGenerator: React.FC<ChartGeneratorProps> = ({ businessData, selectedLanguage }) => {
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7300']

  const translations = {
    en: {
      businessCategories: "Business Categories Distribution",
      priceRanges: "Price Range Distribution", 
      topRatedBusinesses: "Top Rated Businesses",
      businessDensity: "Business Density Analysis",
      ratingDistribution: "Rating Distribution"
    },
    tr: {
      businessCategories: "İş Kategorisi Dağılımı",
      priceRanges: "Fiyat Aralığı Dağılımı",
      topRatedBusinesses: "En Yüksek Puanlı İşletmeler", 
      businessDensity: "İşletme Yoğunluğu Analizi",
      ratingDistribution: "Puan Dağılımı"
    },
    de: {
      businessCategories: "Geschäftskategorien-Verteilung",
      priceRanges: "Preisbereich-Verteilung",
      topRatedBusinesses: "Bestbewertete Unternehmen",
      businessDensity: "Geschäftsdichte-Analyse", 
      ratingDistribution: "Bewertungsverteilung"
    }
  }

  const t = translations[selectedLanguage as keyof typeof translations] || translations.en

  // Prepare data for charts
  const categoryData = Object.entries(businessData.categoryDistribution).map(([name, value]) => ({
    name,
    value,
    percentage: ((value / businessData.totalBusinesses) * 100).toFixed(1)
  }))

  const priceData = Object.entries(businessData.priceDistribution).map(([name, value]) => ({
    name,
    value,
    percentage: ((value / businessData.totalBusinesses) * 100).toFixed(1)
  }))

  const topBusinessData = businessData.topBusinesses.slice(0, 8).map(business => ({
    name: business.name.length > 15 ? business.name.substring(0, 15) + '...' : business.name,
    rating: business.rating || 0,
    reviews: business.totalRatings || 0
  }))

  const densityData = [
    {
      name: 'Current Area',
      density: businessData.businessDensity,
      benchmark: 15 // Average benchmark
    }
  ]

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
          <p className="font-semibold">{label}</p>
          {payload.map((pld: any, index: number) => (
            <p key={index} style={{ color: pld.color }}>
              {pld.name}: {pld.value} {pld.name === 'percentage' ? '%' : ''}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-8 p-6 bg-white">
      {/* Business Categories Pie Chart */}
      <div className="chart-container">
        <h3 className="text-lg font-bold text-center mb-4 text-gray-800">
          {t.businessCategories}
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={categoryData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percentage }) => `${name}: ${percentage}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {categoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Price Distribution Bar Chart */}
      {priceData.length > 0 && (
        <div className="chart-container">
          <h3 className="text-lg font-bold text-center mb-4 text-gray-800">
            {t.priceRanges}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={priceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="value" fill="#00C49F" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top Rated Businesses */}
      {topBusinessData.length > 0 && (
        <div className="chart-container">
          <h3 className="text-lg font-bold text-center mb-4 text-gray-800">
            {t.topRatedBusinesses}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topBusinessData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 5]} />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="rating" fill="#FFBB28" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Business Density Comparison */}
      <div className="chart-container">
        <h3 className="text-lg font-bold text-center mb-4 text-gray-800">
          {t.businessDensity}
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={densityData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="density" fill="#8884D8" name="Businesses per km²" />
            <Bar dataKey="benchmark" fill="#FF8042" name="City Average" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">{businessData.totalBusinesses}</div>
          <div className="text-sm text-gray-600">Total Businesses</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600">{businessData.averageRating.toFixed(1)}</div>
          <div className="text-sm text-gray-600">Average Rating</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-600">{businessData.businessDensity.toFixed(1)}</div>
          <div className="text-sm text-gray-600">Density (per km²)</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-orange-600">{Object.keys(businessData.categoryDistribution).length}</div>
          <div className="text-sm text-gray-600">Categories</div>
        </div>
      </div>
    </div>
  )
}

export default ChartGenerator