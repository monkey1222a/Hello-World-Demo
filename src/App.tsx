import { useState } from 'react'
import { Heart, Sparkles, Code } from 'lucide-react'
import { Button } from './components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'

function App() {
  const [clickCount, setClickCount] = useState(0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Main Hello World Card */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-2xl border-0 mb-8 animate-in fade-in-50 slide-in-from-bottom-10 duration-1000">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Sparkles className="w-16 h-16 text-yellow-500 animate-pulse" />
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-pink-500 rounded-full animate-bounce"></div>
              </div>
            </div>
            <CardTitle className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              Hello World
            </CardTitle>
            <p className="text-xl text-gray-600 font-medium">
              欢迎来到您的第一个React应用！
            </p>
          </CardHeader>
          
          <CardContent className="text-center space-y-6">
            <p className="text-lg text-gray-700 leading-relaxed">
              这是一个简单而美观的演示页面，展示了现代Web开发的魅力。
              点击下面的按钮来探索交互功能！
            </p>
            
            {/* Interactive Button */}
            <div className="space-y-4">
              <Button 
                onClick={() => setClickCount(prev => prev + 1)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                <Heart className="w-5 h-5 mr-2" />
                点击我 ({clickCount})
              </Button>
              
              {clickCount > 0 && (
                <div className="animate-in fade-in-50 slide-in-from-bottom-5 duration-500">
                  <p className="text-purple-600 font-semibold">
                    太棒了！您已经点击了 {clickCount} 次 🎉
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-6 text-center">
              <Code className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-800 mb-2">现代技术栈</h3>
              <p className="text-sm text-gray-600">React + TypeScript + Tailwind CSS</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-6 text-center">
              <Sparkles className="w-8 h-8 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-800 mb-2">响应式设计</h3>
              <p className="text-sm text-gray-600">适配所有设备尺寸</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-6 text-center">
              <Heart className="w-8 h-8 text-pink-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-800 mb-2">用户友好</h3>
              <p className="text-sm text-gray-600">直观的交互体验</p>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-white/80 text-sm">
            使用 OnSpace 平台构建 ✨ 
            <span className="ml-2">Powered by React & Supabase</span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default App