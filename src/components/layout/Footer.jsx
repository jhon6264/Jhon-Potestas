import { BriefcaseBusiness, Code2, Users } from 'lucide-react'
import { site } from '../../data/site'

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div>
          <p className="footer-title">{site.name}</p>
          <p className="footer-copy">
            Student and junior developer focused on web, mobile, and AI-powered projects.
          </p>
        </div>
        <div className="footer-links">
          <a href={site.socials.github} target="_blank" rel="noreferrer" aria-label="GitHub">
            <Code2 size={16} />
          </a>
          <a href={site.socials.facebook} target="_blank" rel="noreferrer" aria-label="Facebook">
            <Users size={16} />
          </a>
          {site.socials.linkedin ? (
            <a href={site.socials.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn">
              <BriefcaseBusiness size={16} />
            </a>
          ) : null}
        </div>
      </div>
      <p className="copyright"> © {new Date().getFullYear()} {site.name}. All rights reserved.</p>
    </footer>
  )
}

export default Footer
