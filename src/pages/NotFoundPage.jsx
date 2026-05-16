import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <main className="stack-view">
      <div className="stack-width">
        <header className="stack-header">
          <Link to="/">Back to Home</Link>
          <h1>Not Found</h1>
        </header>
        <article className="project-view-tile">
          <h3>Page Not Found</h3>
          <p>The page does not exist or has been moved.</p>
        </article>
      </div>
    </main>
  )
}

export default NotFoundPage
