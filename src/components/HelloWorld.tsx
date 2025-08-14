import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Heart, Sparkles, Code } from 'lucide-react'

const HelloWorld: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [clickCount, setClickCount] = useState(0)

  useEffect(() => {
    console.log('🎨 HelloWorld 组件已挂载')
    const timer = setTimeout(() => setIsVisible(true), 300)
    return () => clearTimeout(timer)
  }, [])

  const handleClick = () => {
    console.log('👆 用户点击了按钮，当前点击次数:', clickCount + 1)
    setClickCount(prev => prev + 1)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className={`max-w-md w-full shadow-2xl border-0 bg-white/80 backdrop-blur-sm transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}>
        <CardContent className="p-8 text-center space-y-6">
          {/* 标题区域 */}
          <div className="space-y-4">
            <div className="flex justify-center items-center space-x-2">
              <Sparkles className="w-8 h-8 text-yellow-500 animate-pulse" />
              <Code className="w-8 h-8 text-blue-500" />
              <Heart className="w-8 h-8 text-red-500 animate-pulse" />
            </div>
            
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Hello World!
            </h1>
            
            <p className="text-gray-600 text-lg">
              欢迎来到我的第一个React应用 🎉
            </p>
          </div>

          {/* 交互区域 */}
          <div className="space-y-4">
            <Button 
              onClick={handleClick}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
              size="lg"
            >
              点击我！✨
            </Button>
            
            {clickCount > 0 && (
              <div className={`p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 transition-all duration-500 ${
                clickCount > 0 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}>
                <p className="text-green-700 font-medium">
                  太棒了！你已经点击了 <span className="font-bold text-green-800">{clickCount}</span> 次 🎯
                </p>
              </div>
            )}
          </div>

          {/* 底部信息 */}
          <div className="pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              由 <span className="font-semibold text-blue-600">OnSpace AI</span> 强力驱动
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default HelloWorld