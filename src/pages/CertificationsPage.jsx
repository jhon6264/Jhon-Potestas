import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { site } from '../data/site'

function CertificationsPage() {
  return (
    <main className="stack-view">
      <div className="stack-width">
        <header className="stack-header">
          <Link to="/">
            <ArrowLeft size={18} /> Back to Home
          </Link>
          <h1>Certifications</h1>
        </header>

        <div className="projects-view-grid">
          {site.achievements.map((item) => (
            <article className="project-view-tile" key={`${item.title}-${item.year}`}>
              <h3>{item.title}</h3>
              <p>{item.issuer}</p>
              <p>{item.year}</p>
            </article>
          ))}
        </div>

        <footer className="stack-footer">(c) {new Date().getFullYear()} {site.name}. All rights reserved.</footer>
      </div>
    </main>
  )
}

export default CertificationsPage

