import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { User } from '../types/auth'

interface Subscription {
  id: string
  user_id: string
  email: string
  plan: 'basic' | 'pro'
  start_date: string
  end_date: string
  reports_used: number
  is_active: boolean
  created_at: string
}

export const useSubscription = (user: User | null) => {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchSubscription = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching subscription:', error)
        return
      }

      setSubscription(data)
    } catch (error) {
      console.error('Subscription fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkExpiredSubscriptions = async () => {
    if (!user) return

    try {
      // Call the edge function to check and update expired subscriptions
      const { error } = await supabase.rpc('handle_subscription_expiry')
      
      if (error) {
        console.error('Error checking expired subscriptions:', error)
      } else {
        // Refresh subscription data after checking expiry
        await fetchSubscription()
      }
    } catch (error) {
      console.error('Subscription expiry check error:', error)
    }
  }

  const incrementReportUsage = async () => {
    if (!user || !subscription) return false

    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          reports_used: subscription.reports_used + 1 
        })
        .eq('id', subscription.id)

      if (error) {
        console.error('Error incrementing report usage:', error)
        return false
      }

      // Update local state
      setSubscription(prev => prev ? { ...prev, reports_used: prev.reports_used + 1 } : null)
      return true
    } catch (error) {
      console.error('Report usage increment error:', error)
      return false
    }
  }

  const canUseFeature = (feature: 'unlimited_searches' | 'premium_reports') => {
    if (!user) return false
    if (user.email === 'cem@trdefi.com') return true // Admin access
    if (!subscription || !subscription.is_active) return false

    const now = new Date()
    const endDate = new Date(subscription.end_date)
    
    if (now > endDate) return false

    switch (feature) {
      case 'unlimited_searches':
        return subscription.plan === 'basic' || subscription.plan === 'pro'
      case 'premium_reports':
        return subscription.plan === 'pro' && subscription.reports_used < 30
      default:
        return false
    }
  }

  const getRemainingReports = () => {
    if (!subscription || subscription.plan !== 'pro') return 0
    return Math.max(0, 30 - subscription.reports_used)
  }

  useEffect(() => {
    if (user) {
      fetchSubscription()
      checkExpiredSubscriptions()
    }
  }, [user])

  return {
    subscription,
    loading,
    canUseFeature,
    getRemainingReports,
    incrementReportUsage,
    refreshSubscription: fetchSubscription
  }
}