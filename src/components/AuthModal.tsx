import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Mail, Lock, Crown, AlertCircle, Globe, Key, CheckCircle, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../hooks/useAuth'
import LanguageSelector from './LanguageSelector'

interface AuthModalProps {
  isOpen: boolean
  selectedLanguage: string
  onLanguageChange: (language: string) => void
}

const AuthModal = ({ isOpen, selectedLanguage, onLanguageChange }: AuthModalProps) => {
  const [email, setEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showLanguageWarning, setShowLanguageWarning] = useState(false)
  const [step, setStep] = useState<'email' | 'verification' | 'admin_password'>('email')
  const { signInWithOtp, verifyOtp, signInWithGoogle, adminDirectLogin, user } = useAuth()

  const translations = {
    en: {
      welcomeToGeoScope: "Welcome to GeoScope",
      signIn: "Sign In",
      signUp: "Sign Up",
      email: "Email Address",
      verificationCode: "Verification Code",
      adminPassword: "Admin Password",
      enterEmail: "Enter your email address",
      enterVerificationCode: "Enter the 6-digit code sent to your email",
      enterAdminPassword: "Enter your admin password",
      sendCode: "Send Verification Code",
      verifyCode: "Verify Code",
      adminSignIn: "Admin Sign In",
      sendingCode: "Sending code...",
      verifyingCode: "Verifying code...",
      signingIn: "Signing in...",
      continueWithGoogle: "Continue with Google",
      languageRequired: "Language Selection Required",
      selectLanguage: "Please select your preferred language to continue",
      freeTierLimit: "Free tier has 1 search per 15 days period",
      subscriptionPlans: "Subscription Plans",
      freeSearches: "🆓 Free: 1 search per 15 days",
      basicUnlimited: "💚 Basic: Unlimited searches",
      proAnalyses: "💙 Pro: 30 analyses + Premium features",
      enterpriseContact: "💜 Enterprise: Contact for custom configuration",
      invalidEmail: "Please enter a valid email address",
      codeSent: "Verification code sent to your email",
      invalidCode: "Please enter a valid 6-digit code",
      invalidPassword: "Invalid admin password",
      orContinueWith: "Or continue with email",
      backToEmail: "Back to email entry",
      resendCode: "Resend code",
      codeExpired: "Code expired? Click to resend",
      adminAccess: "Admin Access Detected"
    },
    de: {
      welcomeToGeoScope: "Willkommen bei GeoScope",
      signIn: "Anmelden",
      signUp: "Registrieren",
      email: "E-Mail-Adresse",
      verificationCode: "Bestätigungscode",
      adminPassword: "Admin-Passwort",
      enterEmail: "Geben Sie Ihre E-Mail-Adresse ein",
      enterVerificationCode: "Geben Sie den 6-stelligen Code ein, der an Ihre E-Mail gesendet wurde",
      enterAdminPassword: "Geben Sie Ihr Admin-Passwort ein",
      sendCode: "Bestätigungscode Senden",
      verifyCode: "Code Bestätigen",
      adminSignIn: "Admin Anmeldung",
      sendingCode: "Code wird gesendet...",
      verifyingCode: "Code wird bestätigt...",
      signingIn: "Anmeldung läuft...",
      continueWithGoogle: "Mit Google fortfahren",
      languageRequired: "Sprachauswahl Erforderlich",
      selectLanguage: "Bitte wählen Sie Ihre bevorzugte Sprache aus",
      freeTierLimit: "Kostenlose Stufe hat 1 Suche pro 15 Tage",
      subscriptionPlans: "Abonnement-Pläne",
      freeSearches: "🆓 Kostenlos: 1 Suche pro 15 Tage",
      basicUnlimited: "💚 Basic: Unbegrenzte Suchen",
      proAnalyses: "💙 Pro: 30 Analysen + Premium-Funktionen",
      enterpriseContact: "💜 Enterprise: Kontakt für individuelle Konfiguration",
      invalidEmail: "Bitte geben Sie eine gültige E-Mail-Adresse ein",
      codeSent: "Bestätigungscode an Ihre E-Mail gesendet",
      invalidCode: "Bitte geben Sie einen gültigen 6-stelligen Code ein",
      invalidPassword: "Ungültiges Admin-Passwort",
      orContinueWith: "Oder weiter mit E-Mail",
      backToEmail: "Zurück zur E-Mail-Eingabe",
      resendCode: "Code erneut senden",
      codeExpired: "Code abgelaufen? Klicken zum erneuten Senden",
      adminAccess: "Admin-Zugang Erkannt"
    },
    tr: {
      welcomeToGeoScope: "GeoScope'a Hoş Geldiniz",
      signIn: "Giriş Yap",
      signUp: "Kayıt Ol",
      email: "E-posta Adresi",
      verificationCode: "Doğrulama Kodu",
      adminPassword: "Yönetici Şifresi",
      enterEmail: "E-posta adresinizi girin",
      enterVerificationCode: "E-postanıza gönderilen 6 haneli kodu girin",
      enterAdminPassword: "Yönetici şifrenizi girin",
      sendCode: "Doğrulama Kodu Gönder",
      verifyCode: "Kodu Doğrula",
      adminSignIn: "Yönetici Girişi",
      sendingCode: "Kod gönderiliyor...",
      verifyingCode: "Kod doğrulanıyor...",
      signingIn: "Giriş yapılıyor...",
      continueWithGoogle: "Google ile devam et",
      languageRequired: "Dil Seçimi Gerekli",
      selectLanguage: "Devam etmek için lütfen tercih ettiğiniz dili seçin",
      freeTierLimit: "Ücretsiz seviye her 15 günde 1 arama hakkı",
      subscriptionPlans: "Abonelik Planları",
      freeSearches: "🆓 Ücretsiz: Her 15 günde 1 arama",
      basicUnlimited: "💚 Temel: Sınırsız arama",
      proAnalyses: "💙 Pro: 30 analiz + Premium özellikler",
      enterpriseContact: "💜 Kurumsal: Özel konfigürasyon için iletişime geçin",
      invalidEmail: "Lütfen geçerli bir e-posta adresi girin",
      codeSent: "Doğrulama kodu e-postanıza gönderildi",
      invalidCode: "Lütfen geçerli bir 6 haneli kod girin",
      invalidPassword: "Geçersiz yönetici şifresi",
      orContinueWith: "Veya e-posta ile devam et",
      backToEmail: "E-posta girişine geri dön",
      resendCode: "Kodu tekrar gönder",
      codeExpired: "Kod süresi doldu mu? Tekrar göndermek için tıklayın",
      adminAccess: "Yönetici Erişimi Tespit Edildi"
    }
  }

  const t = translations[selectedLanguage as keyof typeof translations] || translations.en

  // Enhanced email validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
    return emailRegex.test(email.toLowerCase())
  }

  // Validation for verification code (6 digits)
  const validateCode = (code: string) => {
    return /^\d{6}$/.test(code)
  }

  // Check if email is admin
  const isAdminEmail = (email: string) => {
    return email.toLowerCase() === 'cem@trdefi.com'
  }

  useEffect(() => {
    if (!selectedLanguage) {
      setShowLanguageWarning(true)
    } else {
      setShowLanguageWarning(false)
    }
  }, [selectedLanguage])

  const handleSendCode = async () => {
    if (!selectedLanguage) {
      setShowLanguageWarning(true)
      toast.error(t.selectLanguage)
      return
    }

    if (!validateEmail(email)) {
      toast.error(t.invalidEmail)
      return
    }

    // Check if admin email
    if (isAdminEmail(email)) {
      setStep('admin_password')
      return
    }

    setIsLoading(true)
    
    try {
      await signInWithOtp(email)
      toast.success(t.codeSent)
      setStep('verification')
    } catch (error: any) {
      console.error('Send code error:', error)
      toast.error(error.message || 'Failed to send verification code')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    if (!validateCode(verificationCode)) {
      toast.error(t.invalidCode)
      return
    }

    setIsLoading(true)
    
    try {
      await verifyOtp(email, verificationCode)
      toast.success('✅ Successfully authenticated!')
    } catch (error: any) {
      console.error('Verify code error:', error)
      toast.error(error.message || 'Invalid verification code')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdminSignIn = async () => {
    if (!adminPassword) {
      toast.error(t.invalidPassword)
      return
    }

    setIsLoading(true)
    
    try {
      await adminDirectLogin(email, adminPassword)
      // Success is handled in the adminDirectLogin function
    } catch (error: any) {
      console.error('Admin sign in error:', error)
      toast.error(error.message || 'Admin authentication failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    if (!selectedLanguage) {
      setShowLanguageWarning(true)
      toast.error(t.selectLanguage)
      return
    }

    try {
      await signInWithGoogle()
    } catch (error: any) {
      console.error('Google auth error:', error)
      toast.error(error.message || 'Google authentication failed')
    }
  }

  const handleResendCode = async () => {
    setIsLoading(true)
    try {
      await signInWithOtp(email)
      toast.success(t.codeSent)
    } catch (error: any) {
      console.error('Resend code error:', error)
      toast.error(error.message || 'Failed to resend code')
    } finally {
      setIsLoading(false)
    }
  }

  if (user && selectedLanguage) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {t.welcomeToGeoScope}
          </DialogTitle>
        </DialogHeader>
        
        {/* Language Selector */}
        <div className={`space-y-4 ${showLanguageWarning ? 'border-2 border-red-300 rounded-lg p-3 bg-red-50' : ''}`}>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <Label className="font-medium">Select Language / Dil Seçin / Sprache wählen</Label>
          </div>
          <LanguageSelector 
            selectedLanguage={selectedLanguage}
            onLanguageChange={onLanguageChange}
          />
          {showLanguageWarning && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{t.selectLanguage}</span>
            </div>
          )}
        </div>

        {selectedLanguage && !user && (
          <>
            {/* Google Authentication */}
            <div className="space-y-4">
              <Button 
                onClick={handleGoogleAuth} 
                disabled={isLoading}
                variant="outline"
                className="w-full border-2 border-blue-500 text-blue-600 hover:bg-blue-50"
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {t.continueWithGoogle}
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    {t.orContinueWith}
                  </span>
                </div>
              </div>
            </div>

            {/* Email Verification Flow */}
            <div className="space-y-4">
              {step === 'email' ? (
                <>
                  <div>
                    <Label htmlFor="email">{t.email}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder={t.enterEmail}
                        className="pl-10"
                        value={email}
                        onChange={(e) => setEmail(e.target.value.trim())}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendCode()}
                        required
                      />
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleSendCode} 
                    disabled={isLoading || !validateEmail(email)}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        {t.sendingCode}
                      </>
                    ) : (
                      <>
                        <Key className="w-4 h-4 mr-2" />
                        {t.sendCode}
                      </>
                    )}
                  </Button>
                </>
              ) : step === 'admin_password' ? (
                <>
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Shield className="w-8 h-8 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-lg">{t.adminAccess}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {email}
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="adminPassword">{t.adminPassword}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="adminPassword"
                        type="password"
                        placeholder={t.enterAdminPassword}
                        className="pl-10"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAdminSignIn()}
                        required
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handleAdminSignIn} 
                    disabled={isLoading || !adminPassword}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50"
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        {t.signingIn}
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4 mr-2" />
                        {t.adminSignIn}
                      </>
                    )}
                  </Button>

                  <Button 
                    onClick={() => setStep('email')} 
                    variant="outline" 
                    className="w-full"
                  >
                    {t.backToEmail}
                  </Button>
                </>
              ) : (
                <>
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Mail className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-lg">{t.verificationCode}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Check your email: <strong>{email}</strong>
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="code">{t.verificationCode}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="code"
                        type="text"
                        placeholder={t.enterVerificationCode}
                        className="pl-10 text-center text-lg tracking-widest"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        onKeyPress={(e) => e.key === 'Enter' && handleVerifyCode()}
                        maxLength={6}
                        required
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handleVerifyCode} 
                    disabled={isLoading || !validateCode(verificationCode)}
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        {t.verifyingCode}
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {t.verifyCode}
                      </>
                    )}
                  </Button>

                  <div className="flex gap-2">
                    <Button 
                      onClick={() => setStep('email')} 
                      variant="outline" 
                      className="flex-1"
                    >
                      {t.backToEmail}
                    </Button>
                    <Button 
                      onClick={handleResendCode} 
                      disabled={isLoading}
                      variant="ghost" 
                      className="flex-1"
                    >
                      {t.resendCode}
                    </Button>
                  </div>

                  <p className="text-xs text-center text-muted-foreground">
                    {t.codeExpired}
                  </p>
                </>
              )}
            </div>

            <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                <h4 className="font-semibold text-sm text-blue-800">{t.freeTierLimit}</h4>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Crown className="w-4 h-4 text-yellow-500" />
                {t.subscriptionPlans}
              </h3>
              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>{t.freeSearches}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t.basicUnlimited}</span>
                  <span className="font-semibold">$9/month</span>
                </div>
                <div className="flex justify-between">
                  <span>{t.proAnalyses}</span>
                  <span className="font-semibold">$29/month</span>
                </div>
                <div className="flex justify-between">
                  <span>{t.enterpriseContact}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default AuthModal