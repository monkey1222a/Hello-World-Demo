import { MapPin, Zap, Settings, LogOut, Mail, Shield, Users, Database, CreditCard } from 'lucide-react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import SubscriptionPlans from './SubscriptionPlans'

interface HeaderProps {
  user: any
  onLogout?: () => void
  selectedLanguage: string
  onLanguageChange: (language: string) => void
}

const GeoScopeLogo = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="18" fill="url(#gradient1)" stroke="#1e40af" strokeWidth="2"/>
    <circle cx="20" cy="20" r="12" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.8"/>
    <circle cx="20" cy="20" r="6" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.6"/>
    <rect x="18" y="8" width="4" height="24" fill="#ffffff" rx="2" opacity="0.9"/>
    <rect x="8" y="18" width="24" height="4" fill="#ffffff" rx="2" opacity="0.9"/>
    <circle cx="20" cy="20" r="3" fill="#fbbf24"/>
    <defs>
      <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3b82f6"/>
        <stop offset="50%" stopColor="#1d4ed8"/>
        <stop offset="100%" stopColor="#1e3a8a"/>
      </linearGradient>
    </defs>
  </svg>
)

interface AppUser {
  id: string
  email: string
  subscription: string
  searches_used: number
  last_search_date: string
  created_at: string
  current_plan?: string
  subscription_end?: string
  reports_used_this_month?: number
}

interface Subscription {
  id: string
  user_id: string
  email: string
  plan: string
  start_date: string
  end_date: string
  reports_used: number
  is_active: boolean
  created_at: string
}

const AdminPanel = () => {
  const [users, setUsers] = useState<AppUser[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    freeUsers: 0,
    basicUsers: 0,
    proUsers: 0,
    totalSearches: 0,
    activeSubscriptions: 0
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      // Fetch users
      const { data: userData, error: userError } = await supabase
        .from('app_users')
        .select('*')
        .order('created_at', { ascending: false })

      if (userError) throw userError

      // Fetch subscriptions  
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: false })

      if (subscriptionError) throw subscriptionError

      setUsers(userData || [])
      setSubscriptions(subscriptionData || [])
      
      // Calculate stats
      const totalUsers = userData?.length || 0
      const freeUsers = userData?.filter(u => u.current_plan === 'free' || !u.current_plan).length || 0
      const basicUsers = userData?.filter(u => u.current_plan === 'basic').length || 0
      const proUsers = userData?.filter(u => u.current_plan === 'pro').length || 0
      const totalSearches = userData?.reduce((sum, u) => sum + u.searches_used, 0) || 0
      const activeSubscriptions = subscriptionData?.filter(s => s.is_active).length || 0

      setStats({
        totalUsers,
        freeUsers,
        basicUsers,
        proUsers,
        totalSearches,
        activeSubscriptions
      })
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{stats.totalUsers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Total Searches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{stats.totalSearches}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Free Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-600">{stats.freeUsers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Basic Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{stats.basicUsers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pro Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{stats.proUsers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Active Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">{stats.activeSubscriptions}</p>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            User Database (Supabase)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{user.email}</p>
                  <p className="text-xs text-gray-500">
                    Joined: {new Date(user.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    Last search: {new Date(user.last_search_date).toLocaleDateString()}
                  </p>
                  {user.subscription_end && (
                    <p className="text-xs text-gray-500">
                      Subscription until: {new Date(user.subscription_end).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <Badge className={`text-xs mb-1 ${
                    user.current_plan === 'enterprise' ? 'bg-purple-100 text-purple-800' :
                    user.current_plan === 'pro' ? 'bg-blue-100 text-blue-800' :
                    user.current_plan === 'basic' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {(user.current_plan || 'free').toUpperCase()}
                  </Badge>
                  <p className="text-xs text-gray-500">{user.searches_used} searches</p>
                  {user.reports_used_this_month && (
                    <p className="text-xs text-gray-500">{user.reports_used_this_month} reports</p>
                  )}
                </div>
              </div>
            ))}
            {users.length === 0 && (
              <p className="text-center text-gray-500 py-8">No users found</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-green-600" />
            Active Subscriptions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {subscriptions.filter(s => s.is_active).map((subscription) => (
              <div key={subscription.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                <div>
                  <p className="font-medium text-sm">{subscription.email}</p>
                  <p className="text-xs text-gray-600">
                    Plan: {subscription.plan.toUpperCase()}
                  </p>
                  <p className="text-xs text-gray-600">
                    Started: {new Date(subscription.start_date).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-600">
                    Expires: {new Date(subscription.end_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <Badge className={`text-xs mb-1 ${
                    subscription.plan === 'pro' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {subscription.plan === 'pro' ? `${subscription.reports_used}/30 reports` : 'Unlimited'}
                  </Badge>
                  <p className="text-xs text-green-600 font-medium">Active</p>
                </div>
              </div>
            ))}
            {subscriptions.filter(s => s.is_active).length === 0 && (
              <p className="text-center text-gray-500 py-8">No active subscriptions</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const Header = ({ user, onLogout, selectedLanguage, onLanguageChange }: HeaderProps) => {
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [showSubscriptionPlans, setShowSubscriptionPlans] = useState(false)
  const { signOut } = useAuth()
  
  console.log('Header component rendered with user:', user)

  const isAdmin = user?.email === 'cem@trdefi.com'

  const getSubscriptionColor = (subscription: string) => {
    switch (subscription) {
      case 'basic': return 'bg-green-100 text-green-800'
      case 'pro': return 'bg-blue-100 text-blue-800'
      case 'enterprise': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleLogout = async () => {
    try {
      console.log('Header logout clicked for user:', user?.email)
      
      // Call the signOut function from useAuth
      await signOut()
      
      // Call the onLogout prop if provided
      if (onLogout) {
        onLogout()
      }
      
    } catch (error) {
      console.error('Logout error in Header:', error)
      toast.error('Logout failed')
    }
  }

  const translations = {
    en: {
      subscriptionPlans: "Subscription Plans",
      signOut: "Sign Out",
      contact: "Contact (info@trdefi.com)",
      adminDashboard: "Admin Dashboard"
    },
    de: {
      subscriptionPlans: "Abonnement-Pläne",
      signOut: "Abmelden",
      contact: "Kontakt (info@trdefi.com)",
      adminDashboard: "Admin Dashboard"
    },
    tr: {
      subscriptionPlans: "Abonelik Planları",
      signOut: "Çıkış Yap",
      contact: "İletişim (info@trdefi.com)",
      adminDashboard: "Yönetici Paneli"
    }
  }

  const t = translations[selectedLanguage as keyof typeof translations] || translations.en

  return (
    <>
      <header className="h-16 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 border-b border-blue-700 px-6 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <GeoScopeLogo />
            <div>
              <h1 className="text-xl font-bold text-white">GeoScope</h1>
              <p className="text-sm text-blue-100">Business Analyzer</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-3">
              {isAdmin && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-white hover:bg-white/10"
                  onClick={() => setShowAdminPanel(true)}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  {t.adminDashboard}
                </Button>
              )}
              
              <Badge className={`text-xs font-medium ${getSubscriptionColor(user.subscription)}`}>
                {user.subscription.toUpperCase()}
              </Badge>
              
              <div className="text-white text-sm">
                <span className="font-medium">{user.email}</span>
                {user.subscription === 'free' && (
                  <div className="text-xs text-blue-200">
                    {user.searchesUsed}/1 searches used
                  </div>
                )}
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                    <Settings className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => setShowSubscriptionPlans(true)}>
                    <Zap className="w-4 h-4 mr-2" />
                    {t.subscriptionPlans}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    {t.signOut}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => window.location.href = 'mailto:info@trdefi.com'}>
                    <Mail className="w-4 h-4 mr-2" />
                    {t.contact}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm text-blue-100">
            <Zap className="w-4 h-4" />
            <span>Powered by Gemini AI</span>
          </div>
        </div>
      </header>

      {/* Admin Panel Modal */}
      <Dialog open={showAdminPanel} onOpenChange={setShowAdminPanel}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              {t.adminDashboard}
            </DialogTitle>
          </DialogHeader>
          <AdminPanel />
        </DialogContent>
      </Dialog>

      {/* Subscription Plans Modal */}
      <Dialog open={showSubscriptionPlans} onOpenChange={setShowSubscriptionPlans}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-600" />
              {t.subscriptionPlans}
            </DialogTitle>
          </DialogHeader>
          <SubscriptionPlans selectedLanguage={selectedLanguage} user={user} />
        </DialogContent>
      </Dialog>
    </>
  )
}

export default Header