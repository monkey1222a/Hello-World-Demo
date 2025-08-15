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

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...')
        
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          if (mounted) setLoading(false)
          return
        }

        console.log('Initial session:', session)
        
        if (session?.user && mounted) {
          await fetchUserData(session.user)
        } else if (mounted) {
          setLoading(false)
        }
      } catch (error) {
        console.error('Error in initializeAuth:', error)
        if (mounted) setLoading(false)
      }
    }

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session)
        
        if (!mounted) return

        if (session?.user) {
          await fetchUserData(session.user)
        } else {
          setUser(null)
          setLoading(false)
        }
      }
    )

    initializeAuth()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const fetchUserData = async (supabaseUser: SupabaseUser) => {
    try {
      console.log('Fetching user data for:', supabaseUser.id, supabaseUser.email)
      
      // Check if user exists in our app_users table
      const { data: existingUser, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('id', supabaseUser.id)
        .maybeSingle()

      console.log('Existing user query result:', { existingUser, error })

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user data:', error)
        setLoading(false)
        return
      }

      if (!existingUser || existingUser === null) {
        console.log('User not found, creating new user record')
        
        // Create new user record in app_users table
        const newUserData = {
          id: supabaseUser.id,
          email: supabaseUser.email!,
          subscription: supabaseUser.email === 'cem@trdefi.com' ? 'enterprise' as const : 'free' as const,
          searches_used: 0,
          last_search_date: new Date().toISOString(),
          created_at: new Date().toISOString()
        }

        console.log('Creating new user with data:', newUserData)

        const { error: insertError } = await supabase
          .from('app_users')
          .insert(newUserData)

        if (insertError) {
          console.error('Error creating user record:', insertError)
          setLoading(false)
          return
        }

        setUser({
          id: newUserData.id,
          email: newUserData.email,
          subscription: newUserData.subscription,
          searchesUsed: newUserData.searches_used,
          lastSearchDate: newUserData.last_search_date,
          createdAt: newUserData.created_at
        })
      } else {
        console.log('Found existing user:', existingUser)
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
    
    if (email !== 'cem@trdefi.com' || password !== 'Monster8535!') {
      throw new Error('Invalid admin credentials')
    }

    // Create a mock admin user session without going through Supabase auth
    const adminUser: User = {
      id: 'admin-cem-trdefi',
      email: 'cem@trdefi.com',
      subscription: 'enterprise',
      searchesUsed: 0,
      lastSearchDate: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }

    setUser(adminUser)
    setLoading(false)
    console.log('Admin login successful')
    toast.success('✅ Admin access granted!')
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
      // Clear local user state immediately
      setUser(null)
      
      // For admin users, just show success message
      if (user?.email === 'cem@trdefi.com') {
        toast.success('Admin logged out successfully')
        return
      }

      // For regular users, sign out from Supabase
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Supabase sign out error:', error)
        // Don't throw error, user state is already cleared
      }
      
      toast.success('Logged out successfully')
    } catch (error) {
      console.error('Sign out error:', error)
      // Even if there's an error, user state is cleared - show success
      toast.success('Logged out successfully')
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