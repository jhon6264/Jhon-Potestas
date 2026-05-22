import { ArrowLeft, Download } from 'lucide-react'
import { Link } from 'react-router-dom'
import { site } from '../data/site'

function ResumePage() {
  return (
    <main className="stack-view resume-view">
      <div className="stack-width resume-width">
        <header className="stack-header resume-header">
          <Link to="/">
            <ArrowLeft size={18} /> Back to Home
          </Link>
          <h1>Resume</h1>
          <a className="resume-download" href={site.resume} download="Jhon_PotestasResume.pdf">
            <Download size={17} />
            <span>Download</span>
          </a>
        </header>

        <section className="resume-frame" aria-label={`${site.name} resume PDF`}>
          <object data={`${site.resume}#toolbar=1&navpanes=0`} type="application/pdf">
            <p>
              Your browser cannot display this PDF.{' '}
              <a href={site.resume} download="Jhon_PotestasResume.pdf">
                Download the resume
              </a>
              .
            </p>
          </object>
        </section>
      </div>
    </main>
  )
}

export default ResumePage
