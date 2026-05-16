import { Route, Routes, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import ChatWidget from './components/sections/ChatWidget'
import HomePage from './pages/HomePage'
import ProjectsPage from './pages/ProjectsPage'
import TechStackPage from './pages/TechStackPage'
import CertificationsPage from './pages/CertificationsPage'
import BlogPage from './pages/BlogPage'
import NotFoundPage from './pages/NotFoundPage'
import { useTheme } from './hooks/useTheme'

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    const root = document.documentElement
    const previousScrollBehavior = root.style.scrollBehavior

    root.style.scrollBehavior = 'auto'
    window.scrollTo(0, 0)

    return () => {
      root.style.scrollBehavior = previousScrollBehavior
    }
  }, [pathname])

  return null
}

function App() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="app-shell">
      <ScrollToTop />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomePage theme={theme} onToggleTheme={toggleTheme} />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/tech-stack" element={<TechStackPage />} />
          <Route path="/certifications" element={<CertificationsPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <ChatWidget />
    </div>
  )
}

export default App
