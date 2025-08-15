import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Mail, Lock, CheckCircle, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../hooks/useAuth'

const AuthModal = () => {
  const [email, setEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<'email' | 'verification' | 'admin_password'>('email')
  const { signInWithOtp, verifyOtp, adminDirectLogin, user } = useAuth()

  console.log('AuthModal rendered with user:', user)

  // 如果用户已登录，不渲染任何内容
  if (user) {
    return null
  }

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

  const handleSendCode = async () => {
    if (!validateEmail(email)) {
      toast.error('请输入有效的邮箱地址')
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
      toast.success('验证码已发送到您的邮箱')
      setStep('verification')
    } catch (error: any) {
      console.error('Send code error:', error)
      toast.error(error.message || '发送验证码失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    if (!validateCode(verificationCode)) {
      toast.error('请输入有效的6位数字验证码')
      return
    }

    setIsLoading(true)
    
    try {
      await verifyOtp(email, verificationCode)
      toast.success('✅ 登录成功！')
    } catch (error: any) {
      console.error('Verify code error:', error)
      toast.error(error.message || '验证码无效')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdminSignIn = async () => {
    if (!adminPassword) {
      toast.error('请输入管理员密码')
      return
    }

    setIsLoading(true)
    
    try {
      await adminDirectLogin(email, adminPassword)
      // Success is handled in the adminDirectLogin function
    } catch (error: any) {
      console.error('Admin sign in error:', error)
      toast.error(error.message || '管理员认证失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    setIsLoading(true)
    try {
      await signInWithOtp(email)
      toast.success('验证码已重新发送')
    } catch (error: any) {
      console.error('Resend code error:', error)
      toast.error(error.message || '重新发送失败')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            用户登录
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {step === 'email' ? (
            <>
              <div>
                <Label htmlFor="email">邮箱地址</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="请输入您的邮箱地址"
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
                    发送中...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    发送验证码
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
                <h3 className="font-semibold text-lg">管理员访问</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {email}
                </p>
              </div>

              <div>
                <Label htmlFor="adminPassword">管理员密码</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="adminPassword"
                    type="password"
                    placeholder="请输入管理员密码"
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
                    登录中...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    管理员登录
                  </>
                )}
              </Button>

              <Button 
                onClick={() => setStep('email')} 
                variant="outline" 
                className="w-full"
              >
                返回邮箱输入
              </Button>
            </>
          ) : (
            <>
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Mail className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-lg">验证码</h3>
                <p className="text-sm text-gray-600 mt-1">
                  请查看邮箱: <strong>{email}</strong>
                </p>
              </div>

              <div>
                <Label htmlFor="code">验证码</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="code"
                    type="text"
                    placeholder="请输入6位数字验证码"
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
                    验证中...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    验证登录
                  </>
                )}
              </Button>

              <div className="flex gap-2">
                <Button 
                  onClick={() => setStep('email')} 
                  variant="outline" 
                  className="flex-1"
                >
                  返回
                </Button>
                <Button 
                  onClick={handleResendCode} 
                  disabled={isLoading}
                  variant="ghost" 
                  className="flex-1"
                >
                  重新发送
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                没收到验证码？点击重新发送
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AuthModal