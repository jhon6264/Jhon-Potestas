import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { site } from '../data/site'
import { useStaggeredReveal } from '../hooks/useStaggeredReveal'

function TechStackPage() {
  const revealRef = useStaggeredReveal()

  return (
    <main className="stack-view" ref={revealRef}>
      <div className="stack-width">
        <header className="stack-header" data-stagger-item>
          <Link to="/">
            <ArrowLeft size={18} /> Back to Home
          </Link>
          <h1>Tech Stack</h1>
        </header>

        <section className="stack-groups">
          {site.techStack.map((group) => (
            <article key={group.category} className="stack-group-view" data-stagger-item>
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

