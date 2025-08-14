import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Check, Crown, Zap, Star, ExternalLink, CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { User } from '../types/auth'

interface SubscriptionPlansProps {
  user: User | null
  selectedLanguage: string
  onSubscriptionUpdate?: () => void
}

const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({ 
  user, 
  selectedLanguage, 
  onSubscriptionUpdate 
}) => {
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const translations = {
    en: {
      subscriptionPlans: "Subscription Plans",
      currentPlan: "Current Plan",
      freePlan: "Free Plan",
      basicPlan: "Basic Plan",
      proPlan: "Pro Plan",
      oneSearchPer15Days: "1 search every 15 days",
      unlimitedSearches: "Unlimited searches for 30 days",
      premiumReportsPaid: "Premium Reports: $5 each",
      includedReports: "30 Premium Reports included",
      upgradeToBasic: "Upgrade to Basic - $9/month",
      upgradeToPro: "Upgrade to Pro - $29/month",
      paymentProcessing: "Processing Payment...",
      paymentConfirmation: "Payment Confirmation",
      paymentInstructions: "Please complete your payment and click confirm below",
      confirmPayment: "I've Completed Payment",
      paymentSuccess: "Payment confirmed! Your subscription is now active.",
      paymentError: "Failed to activate subscription. Please try again.",
      contactSupport: "Need help? Contact info@trdefi.com",
      planActive: "Active until",
      planExpired: "Expired",
      reportsUsed: "reports used this month"
    },
    tr: {
      subscriptionPlans: "Abonelik Planları",
      currentPlan: "Mevcut Plan",
      freePlan: "Ücretsiz Plan",
      basicPlan: "Temel Plan", 
      proPlan: "Pro Plan",
      oneSearchPer15Days: "Her 15 günde 1 arama",
      unlimitedSearches: "30 gün boyunca sınırsız arama",
      premiumReportsPaid: "Premium Raporlar: Her biri $5",
      includedReports: "30 Premium Rapor dahil",
      upgradeToBasic: "Temel'e Yükselt - $9/ay",
      upgradeToPro: "Pro'ya Yükselt - $29/ay",
      paymentProcessing: "Ödeme İşleniyor...",
      paymentConfirmation: "Ödeme Onayı",
      paymentInstructions: "Lütfen ödemenizi tamamlayın ve aşağıdaki onay butonuna tıklayın",
      confirmPayment: "Ödemeyi Tamamladım",
      paymentSuccess: "Ödeme onaylandı! Aboneliğiniz artık aktif.",
      paymentError: "Abonelik aktifleştirilemedi. Lütfen tekrar deneyin.",
      contactSupport: "Yardım mı gerekiyor? info@trdefi.com ile iletişime geçin",
      planActive: "Aktif:",
      planExpired: "Süresi Doldu",
      reportsUsed: "bu ay kullanılan rapor"
    }
  }

  const t = translations[selectedLanguage as keyof typeof translations] || translations.en

  const plans = [
    {
      id: 'free',
      name: t.freePlan,
      price: '$0',
      period: '/forever',
      features: [
        t.oneSearchPer15Days,
        t.premiumReportsPaid
      ],
      color: 'gray',
      paymentLink: null,
      icon: Crown
    },
    {
      id: 'basic',
      name: t.basicPlan,
      price: '$9',
      period: '/month',
      features: [
        t.unlimitedSearches,
        t.premiumReportsPaid
      ],
      color: 'green',
      paymentLink: 'https://wise.com/pay/r/qE_ll8Z6Q9-tbcc',
      icon: Zap
    },
    {
      id: 'pro',
      name: t.proPlan,
      price: '$29',
      period: '/month',
      features: [
        t.unlimitedSearches,
        t.includedReports
      ],
      color: 'blue',
      paymentLink: 'https://wise.com/pay/r/0rnsqTp7XLYFgwU',
      icon: Star,
      popular: true
    }
  ]

  const handleUpgrade = (plan: any) => {
    if (!user) {
      toast.error('Please log in to upgrade your subscription')
      return
    }

    if (!plan.paymentLink) return

    console.log('Opening Wise payment for plan:', plan.name, 'URL:', plan.paymentLink)
    
    // Open payment link in new tab
    const paymentWindow = window.open(plan.paymentLink, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes')
    
    if (paymentWindow) {
      setShowPaymentConfirmation(plan.id)
      toast.info('Payment window opened. Complete your payment and return here to confirm.')
    } else {
      toast.error('Unable to open payment window. Please disable popup blocker and try again.')
    }
  }

  const confirmPayment = async (planId: string) => {
    if (!user) return

    setIsProcessing(true)

    try {
      // Calculate subscription dates
      const startDate = new Date()
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + 30) // 30 days from now

      console.log('Creating subscription:', { planId, startDate, endDate })

      // Insert subscription record
      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          email: user.email,
          plan: planId,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          reports_used: 0,
          is_active: true
        })

      if (subscriptionError) {
        console.error('Subscription creation error:', subscriptionError)
        throw new Error('Failed to create subscription record')
      }

      // Update user's current plan
      const { error: userError } = await supabase
        .from('app_users')
        .update({
          subscription: planId,
          current_plan: planId,
          subscription_end: endDate.toISOString(),
          reports_used_this_month: 0
        })
        .eq('id', user.id)

      if (userError) {
        console.error('User update error:', userError)
        throw new Error('Failed to update user subscription')
      }

      toast.success(t.paymentSuccess)
      setShowPaymentConfirmation(null)
      
      if (onSubscriptionUpdate) {
        onSubscriptionUpdate()
      }

      // Refresh the page to update user state
      window.location.reload()

    } catch (error) {
      console.error('Payment confirmation error:', error)
      toast.error(t.paymentError)
    } finally {
      setIsProcessing(false)
    }
  }

  const getCurrentPlanDetails = () => {
    if (!user) return null

    const currentPlan = plans.find(p => p.id === user.subscription) || plans[0]
    
    return {
      ...currentPlan,
      isActive: user.subscription !== 'free',
      endDate: user.subscription !== 'free' ? user.lastSearchDate : null,
      reportsUsed: (user as any).reportsUsedThisMonth || 0
    }
  }

  const currentPlan = getCurrentPlanDetails()

  return (
    <>
      <div className="space-y-6">
        {/* Current Plan Status */}
        {currentPlan && (
          <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <currentPlan.icon className="w-5 h-5" />
                {t.currentPlan}: {currentPlan.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  {currentPlan.isActive && currentPlan.endDate && (
                    <p className="text-sm text-green-600">
                      {t.planActive} {new Date(currentPlan.endDate).toLocaleDateString()}
                    </p>
                  )}
                  {currentPlan.id === 'pro' && (
                    <p className="text-xs text-gray-600 mt-1">
                      {currentPlan.reportsUsed}/30 {t.reportsUsed}
                    </p>
                  )}
                </div>
                <Badge className={`${
                  currentPlan.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {currentPlan.isActive ? 'Active' : 'Free'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Subscription Plans Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative ${
                plan.popular ? 'border-2 border-blue-500 shadow-lg' : 'border border-gray-200'
              } ${
                currentPlan?.id === plan.id ? 'ring-2 ring-blue-400' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white px-3 py-1">Most Popular</Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center ${
                  plan.color === 'gray' ? 'bg-gray-100' :
                  plan.color === 'green' ? 'bg-green-100' : 'bg-blue-100'
                }`}>
                  <plan.icon className={`w-6 h-6 ${
                    plan.color === 'gray' ? 'text-gray-600' :
                    plan.color === 'green' ? 'text-green-600' : 'text-blue-600'
                  }`} />
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="text-3xl font-bold">
                  {plan.price}
                  <span className="text-sm font-normal text-gray-500">{plan.period}</span>
                </div>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                {plan.paymentLink && currentPlan?.id !== plan.id && (
                  <Button 
                    onClick={() => handleUpgrade(plan)}
                    className={`w-full ${
                      plan.color === 'green' 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    {plan.id === 'basic' ? t.upgradeToBasic : t.upgradeToPro}
                  </Button>
                )}
                
                {currentPlan?.id === plan.id && (
                  <Button disabled className="w-full bg-gray-400">
                    Current Plan
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact Support */}
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            {t.contactSupport}
          </p>
        </div>
      </div>

      {/* Payment Confirmation Modal */}
      <Dialog open={!!showPaymentConfirmation} onOpenChange={() => setShowPaymentConfirmation(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ExternalLink className="w-5 h-5 text-blue-600" />
              {t.paymentConfirmation}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
              <p className="text-sm text-gray-700 mb-4">
                {t.paymentInstructions}
              </p>
              
              <Button 
                onClick={() => showPaymentConfirmation && confirmPayment(showPaymentConfirmation)}
                disabled={isProcessing}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    {t.paymentProcessing}
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    {t.confirmPayment}
                  </>
                )}
              </Button>
            </div>
            
            <p className="text-xs text-center text-gray-500">
              {t.contactSupport}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default SubscriptionPlans