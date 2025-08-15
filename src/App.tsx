import { useState } from 'react'
import { Button } from './components/ui/button'
import { Card, CardContent } from './components/ui/card'
import { Sparkles, Github, Code, Rocket } from 'lucide-react'
import { AuthProvider, useAuth } from './hooks/useAuth'
import AuthModal from './components/AuthModal'
import { Toaster } from './components/ui/sonner'

function HelloWorldContent() {
  const [count, setCount] = useState(0)
  const { user, signOut } = useAuth()

  console.log('HelloWorldContent rendered with user:', user)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center p-4">
      <Card className="w-full max-w-md backdrop-blur-lg bg-white/10 border-white/20 shadow-2xl">
        <CardContent className="p-8 text-center space-y-6">
          <div className="relative">
            <Sparkles className="w-16 h-16 text-yellow-300 mx-auto animate-pulse" />
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-pink-400 rounded-full animate-bounce" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-white drop-shadow-lg">
              Hello World! 🎉
            </h1>
            <p className="text-white/80 text-lg">
              欢迎来到我的 React 演示页面
            </p>
          </div>

          {user && (
            <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
              <p className="text-white font-medium">
                欢迎，{user.email}！
              </p>
              <Button 
                onClick={signOut}
                variant="outline" 
                className="mt-2 bg-white/10 border-white/30 text-white hover:bg-white/20"
              >
                退出登录
              </Button>
            </div>
          )}

          <div className="space-y-4">
            <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
              <p className="text-white/90 text-2xl font-semibold">
                点击次数: {count}
              </p>
              <Button 
                onClick={() => setCount(count + 1)}
                className="mt-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-2 px-6 rounded-full shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                点击我！
              </Button>
            </div>

            <div className="flex justify-center space-x-4 text-white/70">
              <div className="flex items-center space-x-1">
                <Code className="w-4 h-4" />
                <span className="text-sm">React</span>
              </div>
              <div className="flex items-center space-x-1">
                <Github className="w-4 h-4" />
                <span className="text-sm">TypeScript</span>
              </div>
              <div className="flex items-center space-x-1">
                <Rocket className="w-4 h-4" />
                <span className="text-sm">Tailwind</span>
              </div>
            </div>
          </div>

          <p className="text-white/60 text-sm">
            ✨ 这是一个响应式的 Hello World 页面 ✨
          </p>
        </CardContent>
      </Card>

      {/* 只有当用户未登录时才显示认证弹窗 */}
      {!user && <AuthModal />}
      
      <Toaster />
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <HelloWorldContent />
    </AuthProvider>
  )
}

export default App