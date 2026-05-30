import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import lightImage from '@/assets/light.jpg'
import darkImage from '@/assets/dark.jpg'
import { Button } from '../components/ui/button'
import { useTheme } from '../components/ThemeProvider'

export default function Home() {
  const { theme } = useTheme()
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Check if theme is dark or if system prefers dark mode
    const darkMode =
      theme === 'dark' ||
      (theme === 'system' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    setIsDark(darkMode)
  }, [theme])

  return (
    <div
      className="flex flex-col items-center justify-center w-screen h-screen bg-cover bg-center bg-no-repeat transition-all duration-500"
      style={{
        backgroundImage: `url(${isDark ? darkImage : lightImage})`,
      }}
    >
      {/* Overlay for better text readability */}
      <div className={`absolute inset-0`}></div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center">
        <h1 className="text-5xl font-bold text-white drop-shadow-lg">
          Welcome to Safar
        </h1>
        <p className="mt-4 text-lg text-white drop-shadow-md">
          Discover amazing destinations and share your travel experiences
        </p>
        <Link to="/index">
          <Button className='my-2' variant="secondary">Get Started</Button>
        </Link>
      </div>
    </div>
  )
}