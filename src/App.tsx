import React, { useState } from 'react'
import { Button } from './components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { Heart, Star, Sparkles } from 'lucide-react'

function App() {
  const [clicked, setClicked] = useState(false)
  const [count, setCount] = useState(0)

  const handleClick = () => {
    setClicked(true)
    setCount(prev => prev + 1)
    setTimeout(() => setClicked(false), 500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className={`transition-all duration-500 ${clicked ? 'scale-125 rotate-12' : 'scale-100'}`}>
              <Sparkles className="w-16 h-16 text-purple-500" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Hello World!
          </CardTitle>
          <p className="text-gray-600">欢迎来到我的演示页面</p>
        </CardHeader>
        
        <CardContent className="space-y-6 text-center">
          <div className="space-y-4">
            <p className="text-lg text-gray-700">
              这是一个简单而美丽的演示页面
            </p>
            
            <div className="flex items-center justify-center gap-2 text-pink-500">
              <Heart className="w-5 h-5" />
              <span>用 React + TypeScript 构建</span>
              <Heart className="w-5 h-5" />
            </div>
          </div>

          <div className="space-y-4">
            <Button 
              onClick={handleClick}
              className={`w-full transition-all duration-300 ${
                clicked 
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 scale-105' 
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:scale-105'
              }`}
              size="lg"
            >
              <Star className="w-4 h-4 mr-2" />
              点击我试试！
            </Button>
            
            {count > 0 && (
              <div className="animate-fade-in">
                <p className="text-purple-600 font-semibold">
                  你已经点击了 {count} 次！ 🎉
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              ✨ 响应式设计 • 现代化UI • 丝滑动画
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default App