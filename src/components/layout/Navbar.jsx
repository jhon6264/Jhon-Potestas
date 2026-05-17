import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { useState } from 'react'
import { site } from '../../data/site'
import ThemeToggle from '../ui/ThemeToggle'

const links = [
  { id: 'about', label: 'About' },
  { id: 'experience', label: 'Experience' },
  { id: 'tech-stack', label: 'Tech Stack' },
  { id: 'projects', label: 'Projects' },
  { id: 'contact', label: 'Contact' },
]

function Navbar({ theme, onToggleTheme }) {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const onHome = location.pathname === '/'

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link className="brand" to="/">
          <span className="brand-dot" aria-hidden="true"></span>
          {site.name}
        </Link>

        <button
          type="button"
          className="icon-button mobile-only"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label="Toggle navigation"
          aria-expanded={isOpen}
        >
          <Menu size={18} />
        </button>

        <nav className={`nav-links ${isOpen ? 'nav-links-open' : ''}`} aria-label="Primary">
          {links.map((item) =>
            onHome ? (
              <a key={item.id} href={`#${item.id}`} onClick={() => setIsOpen(false)}>
                {item.label}
              </a>
            ) : (
              <NavLink key={item.id} to={`/#${item.id}`} onClick={() => setIsOpen(false)}>
                {item.label}
              </NavLink>
            )
          )}
          <NavLink to="/blog" onClick={() => setIsOpen(false)}>
            Blog
          </NavLink>
          <ThemeToggle theme={theme} onToggleTheme={onToggleTheme} />
        </nav>
      </div>
    </header>
  )
}

export default Navbar
