import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { User } from '../types/auth'
import { toast } from 'sonner'

interface AuthContextType {
  user: User | null
  loading: boolean
  signInWithOtp: (email: string) => Promise<void>
  verifyOtp: (email: string, token: string) => Promise<void>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<void>
  adminDirectLogin: (email: string, password: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [initializedRef, setInitializedRef] = useState(false)

  useEffect(() => {
    let authSubscription: any = null

    const initializeAuth = async () => {
      try {
        // 首先获取初始会话
        console.log('Initializing auth - getting initial session...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting initial session:', error)
          setLoading(false)
          return
        }

        console.log('Initial session:', session)
        
        // 处理初始会话
        if (session?.user) {
          await fetchUserData(session.user)
        } else {
          setUser(null)
          setLoading(false)
        }

        // 标记初始化完成
        setInitializedRef(true)

        // 初始化完成后，再设置状态监听器
        console.log('Setting up auth state listener...')
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('Auth state change event:', event, 'session:', session)
            
            // 只有在初始化完成后才处理状态变化
            if (initializedRef) {
              if (session?.user) {
                await fetchUserData(session.user)
              } else {
                setUser(null)
                setLoading(false)
              }
            }
          }
        )

        authSubscription = subscription
      } catch (error) {
        console.error('Error initializing auth:', error)
        setLoading(false)
      }
    }

    initializeAuth()

    // 清理函数
    return () => {
      if (authSubscription) {
        console.log('Cleaning up auth subscription')
        authSubscription.unsubscribe()
      }
    }
  }, []) // 移除 initializedRef 依赖，避免重复执行

  // 当 initializedRef 状态改变时，更新监听器的行为
  useEffect(() => {
    console.log('Auth initialization status changed:', initializedRef)
  }, [initializedRef])

  const fetchUserData = async (supabaseUser: SupabaseUser) => {
    try {
      console.log('Fetching user data for:', supabaseUser.id, supabaseUser.email)
      
      // 检查用户是否存在于 app_users 表中
      const { data: existingUser, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single()

      console.log('Existing user data:', existingUser, error)

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user data:', error)
        setLoading(false)
        return
      }

      if (!existingUser) {
        // 创建新用户记录
        const newUser = {
          id: supabaseUser.id,
          email: supabaseUser.email!,
          subscription: supabaseUser.email === 'cem@trdefi.com' ? 'enterprise' as const : 'free' as const,
          searches_used: 0,
          last_search_date: new Date().toISOString(),
          created_at: new Date().toISOString()
        }

        console.log('Creating new user:', newUser)

        const { error: insertError } = await supabase
          .from('app_users')
          .insert(newUser)

        if (insertError) {
          console.error('Error creating user record:', insertError)
          setLoading(false)
          return
        }

        setUser({
          id: newUser.id,
          email: newUser.email,
          subscription: newUser.subscription,
          searchesUsed: newUser.searches_used,
          lastSearchDate: newUser.last_search_date,
          createdAt: newUser.created_at
        })
      } else {
        setUser({
          id: existingUser.id,
          email: existingUser.email,
          subscription: existingUser.subscription,
          searchesUsed: existingUser.searches_used,
          lastSearchDate: existingUser.last_search_date,
          createdAt: existingUser.created_at
        })
      }
    } catch (error) {
      console.error('Error in fetchUserData:', error)
    } finally {
      setLoading(false)
    }
  }

  const adminDirectLogin = async (email: string, password: string) => {
    console.log('Admin direct login attempt for:', email)
    
    // 支持两个内置账号
    const validAccounts = [
      { email: 'cem@trdefi.com', password: 'Monster8535!', subscription: 'enterprise' as const },
      { email: 'test@geoscope.com', password: 'test123456', subscription: 'pro' as const }
    ]
    
    const account = validAccounts.find(acc => acc.email === email && acc.password === password)
    
    if (!account) {
      throw new Error('Invalid credentials')
    }

    // 创建模拟用户会话
    const adminUser: User = {
      id: email === 'cem@trdefi.com' ? 'admin-cem-trdefi' : 'test-user-geoscope',
      email: email,
      subscription: account.subscription,
      searchesUsed: 0,
      lastSearchDate: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }

    // 检查用户是否存在于数据库中，不存在则创建
    try {
      const { data: existingUser, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('email', email)
        .single()

      if (error && error.code === 'PGRST116') {
        // 用户不存在，创建用户
        const { error: insertError } = await supabase
          .from('app_users')
          .insert({
            id: adminUser.id,
            email: adminUser.email,
            subscription: adminUser.subscription,
            searches_used: adminUser.searchesUsed,
            last_search_date: adminUser.lastSearchDate,
            created_at: adminUser.createdAt
          })

        if (insertError) {
          console.error('Error creating user:', insertError)
        }
      }
    } catch (error) {
      console.error('Error checking/creating user:', error)
    }

    setUser(adminUser)
    setLoading(false)
    console.log('Direct login successful for:', email)
    if (email === 'cem@trdefi.com') {
      toast.success('✅ 管理员访问已授权！')
    } else {
      toast.success('✅ 测试账号登录成功！')
    }
  }

  const signInWithOtp = async (email: string) => {
    console.log('Sending OTP to email:', email)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: window.location.origin
      }
    })
    if (error) {
      console.error('Send OTP error:', error)
      throw error
    }
  }

  const verifyOtp = async (email: string, token: string) => {
    console.log('Verifying OTP for email:', email, 'token:', token)
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email'
    })
    if (error) {
      console.error('Verify OTP error:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      // 立即清除本地用户状态
      setUser(null)
      
      // 对于管理员用户，只显示成功消息
      if (user?.email === 'cem@trdefi.com') {
        toast.success('管理员退出成功')
        return
      }

      // 对于普通用户，从 Supabase 退出
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Supabase sign out error:', error)
        // 不抛出错误，用户状态已经清除
      }
      
      toast.success('退出成功')
    } catch (error) {
      console.error('Sign out error:', error)
      // 即使有错误，用户状态也已清除 - 显示成功
      toast.success('退出成功')
    }
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    })
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signInWithOtp,
      verifyOtp,
      signOut,
      signInWithGoogle,
      adminDirectLogin
    }}>
      {children}
    </AuthContext.Provider>
  )
}