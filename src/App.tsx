import React from 'react'
import HelloWorld from './components/HelloWorld'

console.log('📱 App 组件渲染中...')

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <HelloWorld />
    </div>
  )
}

export default App