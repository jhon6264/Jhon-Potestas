import { Moon, Sun } from 'lucide-react'

function ThemeToggle({ theme, onToggleTheme }) {
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      className="icon-button"
      onClick={onToggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}

export default ThemeToggle
