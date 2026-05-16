import { ArrowLeft } from 'lucide-react'
import { animate } from 'animejs'
import { Link } from 'react-router-dom'
import { site } from '../data/site'
import { useStaggeredReveal } from '../hooks/useStaggeredReveal'

const journalNotes = [
  {
    title: 'My First Layout Problem',
    kicker: 'First Year',
    body:
      'When I started learning HTML and CSS as a first-year Information Technology student, responsiveness was one of my first real challenges. I used absolute positioning and media queries to move content around, and that early struggle helped me understand spacing, structure, and layout behavior.',
  },
  {
    title: 'The Project I Am Most Proud Of',
    kicker: 'Capstone',
    body:
      'My proudest project right now is our capstone project, the Document Tracking System. It is focused on signing and tracking school documents exclusively within our school, making the process more organized and easier to follow.',
  },
  {
    title: 'What I Am Exploring Now',
    kicker: 'Current Focus',
    body:
      'I am currently exploring mobile development and learning how to connect apps with AI agents through APIs or local LLMs. I want to understand how AI can support real app features, automate tasks, and make projects more useful.',
  },
  {
    title: 'A Small Bug That Taught Me Discipline',
    kicker: 'Developer Notes',
    body:
      'One issue I often encounter is Laravel routing, especially when filenames or JSX component names do not match because of uppercase and lowercase letters. It reminds me that small naming details can affect the whole project.',
  },
]

function BlogPage() {
  const revealRef = useStaggeredReveal()

  const handleIllustrationPointerMove = (event) => {
    const item = event.currentTarget
    const rect = item.getBoundingClientRect()

    item.style.setProperty('--shine-x', `${event.clientX - rect.left}px`)
    item.style.setProperty('--shine-y', `${event.clientY - rect.top}px`)
  }

  const showIllustrationShine = (event) => {
    handleIllustrationPointerMove(event)

    animate(event.currentTarget, {
      '--shine-opacity': [0, 1],
      duration: 220,
      ease: 'outCubic',
    })
  }

  const hideIllustrationShine = (event) => {
    animate(event.currentTarget, {
      '--shine-opacity': 0,
      duration: 260,
      ease: 'outCubic',
    })
  }

  const illustrationEvents = {
    onPointerEnter: showIllustrationShine,
    onPointerMove: handleIllustrationPointerMove,
    onPointerLeave: hideIllustrationShine,
  }

  return (
    <main className="stack-view blog-editorial">
      <div className="blog-paper" ref={revealRef}>
        <header className="blog-nav" data-stagger-item>
          <Link to="/">
            <ArrowLeft size={18} /> Back to Home
          </Link>
        </header>

        <section className="blog-masthead" data-stagger-item>
          <div className="blog-masthead-copy">
            <p className="blog-eyebrow">Personal Developer Journal</p>
            <h1>Building, Learning, and Becoming a Developer</h1>
            <p className="blog-deck">
              Notes from an Information Technology student exploring web development, mobile apps, AI-assisted
              projects, capstone systems, and creative work through video editing.
            </p>
          </div>
          <figure className="blog-sticker blog-sticker-laptop editorial-shine" {...illustrationEvents}>
            <img src="/assets/blog/laptop-sticker.svg" alt="Halftone laptop illustration" />
          </figure>
          <figure className="blog-sticker blog-sticker-phone editorial-shine" {...illustrationEvents}>
            <img src="/assets/blog/phone-sticker.svg" alt="Halftone phone illustration" />
          </figure>
        </section>

        <article className="blog-lead-story" data-stagger-item>
          <div>
            <p className="blog-section-label">Featured Story</p>
            <h2>Why I Build</h2>
          </div>
          <p>
            I chose web and mobile development because I genuinely enjoy building projects. Turning an idea into
            something people can use makes me feel alive, motivated, and eager to keep improving.
          </p>
        </article>

        <section className="blog-columns" aria-label="Developer journal entries" data-stagger-item>
          {journalNotes.map((note) => (
            <article key={note.title} className="blog-note">
              <p>{note.kicker}</p>
              <h2>{note.title}</h2>
              <span>{note.body}</span>
            </article>
          ))}
        </section>

        <section className="blog-pullquote" data-stagger-item>
          <figure className="blog-sticker blog-sticker-signal editorial-shine" {...illustrationEvents}>
            <img src="/assets/blog/signal-sticker.svg" alt="Halftone signal illustration" />
          </figure>
          <blockquote>
            AI does not replace learning. It helps me move faster, understand problems better, and build things I once
            thought were too difficult.
          </blockquote>
        </section>

        <section className="blog-about-grid" data-stagger-item>
          <article>
            <p className="blog-section-label">Tools I Use</p>
            <h2>VS Code, GitHub, and Codex</h2>
            <p>
              These are the tools I use most often to build, organize, debug, and improve my projects. They help me
              work faster while keeping my code and ideas easier to manage.
            </p>
          </article>
          <article>
            <p className="blog-section-label">About Me</p>
            <h2>Disciplined, Motivated, and Ready to Work</h2>
            <p>
              I am eager to find online work opportunities in app and web development. I also edit videos with CapCut
              and I am currently learning Adobe Premiere Pro and After Effects.
            </p>
          </article>
          <article>
            <p className="blog-section-label">Work Direction</p>
            <h2>Web, Apps, Video, and Software Engineering</h2>
            <p>
              I want to attract web and app development opportunities while continuing to grow in video editing and
              software engineering. Right now, I am placing more focus on video editing while still improving as a
              developer.
            </p>
          </article>
        </section>

        <section className="blog-illustration-strip" aria-label="Editorial illustrations" data-stagger-item>
          <figure className="blog-sticker editorial-shine" {...illustrationEvents}>
            <img src="/assets/blog/book-sticker.svg" alt="Halftone open book illustration" />
          </figure>
          <figure className="blog-sticker editorial-shine" {...illustrationEvents}>
            <img src="/assets/blog/hourglass-sticker.svg" alt="Halftone hourglass illustration" />
          </figure>
        </section>

        <footer className="blog-footer" data-stagger-item>
          (c) {new Date().getFullYear()} {site.name}. All rights reserved.
        </footer>
      </div>
    </main>
  )
}

export default BlogPage
