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
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session)
      if (session?.user) {
        fetchUserData(session.user)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session)
        if (session?.user) {
          await fetchUserData(session.user)
        } else {
          setUser(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserData = async (supabaseUser: SupabaseUser) => {
    try {
      console.log('Fetching user data for:', supabaseUser.id, supabaseUser.email)
      
      // Check if user exists in our app_users table
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
        // Create new user record in app_users table
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

    // Check if admin user exists in database, if not create it
    try {
      const { data: existingUser, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('email', 'cem@trdefi.com')
        .single()

      if (error && error.code === 'PGRST116') {
        // User doesn't exist, create admin user
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
          console.error('Error creating admin user:', insertError)
        }
      }
    } catch (error) {
      console.error('Error checking/creating admin user:', error)
    }

    setUser(adminUser)
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