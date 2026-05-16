import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { site } from '../data/site'

function BlogPage() {
  return (
    <main className="stack-view">
      <div className="stack-width">
        <header className="stack-header">
          <Link to="/">
            <ArrowLeft size={18} /> Back to Home
          </Link>
          <h1>Blog</h1>
        </header>

        <article className="project-view-tile">
          <h3>No posts yet</h3>
          <p>Blog posts will be added soon.</p>
        </article>

        <footer className="stack-footer">(c) {new Date().getFullYear()} {site.name}. All rights reserved.</footer>
      </div>
    </main>
  )
}

export default BlogPage

