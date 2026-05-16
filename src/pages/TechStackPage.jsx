import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { site } from '../data/site'

function TechStackPage() {
  return (
    <main className="stack-view">
      <div className="stack-width">
        <header className="stack-header">
          <Link to="/">
            <ArrowLeft size={18} /> Back to Home
          </Link>
          <h1>Tech Stack</h1>
        </header>

        <section className="stack-groups">
          {site.techStack.map((group) => (
            <article key={group.category} className="stack-group-view">
              <h2>{group.category}</h2>
              <div className="outlined-tags">
                {group.items.length ? (
                  group.items.map((item) => <span key={item}>{item}</span>)
                ) : (
                  <span>Coming Soon</span>
                )}
              </div>
            </article>
          ))}
        </section>

        <footer className="stack-footer">(c) {new Date().getFullYear()} {site.name}. All rights reserved.</footer>
      </div>
    </main>
  )
}

export default TechStackPage

