export interface User {
  id: string
  email: string
  subscription: 'free' | 'basic' | 'pro' | 'enterprise'
  searchesUsed: number
  lastSearchDate: string
  createdAt: string
}

export interface AuthState {
  user: User | null
  loading: boolean
}