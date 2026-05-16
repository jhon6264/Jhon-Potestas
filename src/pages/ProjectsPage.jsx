import { useMemo, useState } from 'react'
import { ArrowLeft, Check, Copy, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { projectFilters, site } from '../data/site'
import { useStaggeredReveal } from '../hooks/useStaggeredReveal'

async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value)
      return
    } catch {
      // Fall back for browsers that block the Clipboard API outside secure gestures.
    }
  }

  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}

function ProjectsPage() {
  const [activeFilter, setActiveFilter] = useState('All')
  const [copiedLink, setCopiedLink] = useState('')
  const revealRef = useStaggeredReveal()

  const filteredProjects = useMemo(() => {
    if (activeFilter === 'All') return site.projects
    return site.projects.filter((project) => project.category.includes(activeFilter))
  }, [activeFilter])

  const handleCopy = async (link) => {
    await copyText(link)
    setCopiedLink(link)
    window.setTimeout(() => setCopiedLink(''), 1400)
  }

  return (
    <main className="stack-view" ref={revealRef}>
      <div className="stack-width">
        <header className="stack-header" data-stagger-item>
          <Link to="/">
            <ArrowLeft size={18} /> Back to Home
          </Link>
          <h1>Projects</h1>
        </header>

        <div className="outlined-tags" data-stagger-item>
          {projectFilters.map((filter) => (
            <button
              key={filter}
              type="button"
              className={`outline-btn ${activeFilter === filter ? 'outline-btn-active' : ''}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="projects-view-grid">
          {filteredProjects.map((project) => (
            <article className="project-view-tile" key={project.name} data-stagger-item>
              <h3>{project.name}</h3>
              <p>{project.description}</p>
              <div className="project-link-row">
                <a className="project-url" href={project.link} target="_blank" rel="noreferrer">
                  {project.link}
                  <ExternalLink size={13} />
                </a>
                <button type="button" className="copy-link-btn" onClick={() => handleCopy(project.link)}>
                  {copiedLink === project.link ? <Check size={15} /> : <Copy size={15} />}
                  <span className="sr-only">Copy project link</span>
                </button>
              </div>
            </article>
          ))}
        </div>

        <footer className="stack-footer">(c) {new Date().getFullYear()} {site.name}. All rights reserved.</footer>
      </div>
    </main>
  )
}

export default ProjectsPage
