import { Link } from 'react-router-dom'
import { animate } from 'animejs'
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileText,
  Mail,
  MapPin,
  MessageCircle,
  Moon,
  Sun,
  Trophy,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { site } from '../data/site'
import fallbackHero from '../assets/hero.png'
import GalleryCarousel from '../components/sections/GalleryCarousel'

const PROFILE_IMAGES = {
  light: '/assets/profile/Day.png',
  dark: '/assets/profile/Night.png',
}

const PROFILE_TRANSITION_VIDEOS = {
  'day-to-night': '/assets/profile/Day-To-Night.mp4',
  'night-to-day': '/assets/profile/Night-To-Day.mp4',
}

const profileImageDecodeCache = new Map()

function decodeProfileImage(src) {
  if (!src || typeof window === 'undefined') return Promise.resolve()
  if (profileImageDecodeCache.has(src)) return profileImageDecodeCache.get(src)

  const decodePromise = new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = async () => {
      try {
        if (image.decode) {
          await image.decode()
        }
      } catch {
        // The browser can still paint a loaded image even if decode() rejects.
      }
      resolve()
    }
    image.onerror = reject
    image.src = src
  })

  profileImageDecodeCache.set(src, decodePromise)
  return decodePromise
}

function waitForNextPaint() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve)
    })
  })
}

function getDomain(url = '') {
  return url
    .replace('https://', '')
    .replace('http://', '')
    .replace('github.com/', '')
    .replace(/\/$/, '')
    .split('/')
    .slice(0, 2)
    .join(' / ')
}

function VerifiedBadge() {
  return (
    <svg viewBox="0 0 22 22" className="verified-badge" aria-label="Verified profile">
      <path
        d="M20.4 11c0-.65-.22-1.28-.58-1.82-.35-.54-.85-.97-1.43-1.24.22-.61.27-1.27.14-1.9-.13-.63-.44-1.22-.88-1.69-.47-.45-1.05-.75-1.69-.88-.63-.13-1.29-.08-1.9.14-.27-.59-.7-1.09-1.24-1.44A3.45 3.45 0 0 0 11 1.6c-.65.02-1.27.22-1.81.57-.54.35-.97.85-1.24 1.44-.61-.22-1.27-.27-1.9-.14-.64.13-1.22.44-1.69.88-.45.47-.75 1.05-.88 1.69-.13.63-.08 1.29.14 1.9-.59.27-1.09.7-1.44 1.24-.36.54-.56 1.17-.58 1.82.02.65.22 1.28.58 1.82.35.54.85.97 1.44 1.24-.22.61-.27 1.26-.14 1.9.13.63.43 1.22.88 1.69.47.44 1.05.75 1.69.88.63.13 1.29.08 1.9-.14.27.58.7 1.08 1.24 1.44.54.35 1.17.55 1.82.57.65-.02 1.28-.22 1.82-.57.54-.35.97-.85 1.24-1.44.6.24 1.26.3 1.9.16.64-.13 1.22-.45 1.68-.91.46-.46.78-1.04.91-1.68.13-.64.08-1.3-.16-1.9.58-.27 1.08-.71 1.44-1.25.35-.54.55-1.17.57-1.82ZM9.66 14.85 6.23 11.42l1.3-1.3 2.07 2.07L14 7.4l1.35 1.25-5.69 6.2Z"
        fill="currentColor"
      />
    </svg>
  )
}

function SocialIcon({ type }) {
  const icons = {
    linkedin:
      'M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13Zm1.78 13.02H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z',
    github:
      'M12 .3a12 12 0 0 0-3.8 23.38c.6.1.82-.26.82-.58v-2.04c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.08 1.84 2.82 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.53.12-3.18 0 0 1.01-.32 3.3 1.23A11.5 11.5 0 0 1 12 5.58c1.02 0 2.04.14 3 .4 2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.81 5.63-5.49 5.92.43.37.82 1.1.82 2.22v3.3c0 .32.22.69.83.57A12 12 0 0 0 12 .3Z',
    facebook:
      'M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.96h-1.51c-1.49 0-1.96.93-1.96 1.89v2.27h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07Z',
  }

  return (
    <svg className="social-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d={icons[type]} fill="currentColor" />
    </svg>
  )
}

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

function DeveloperAccessCard() {
  const handlePointerMove = (event) => {
    const card = event.currentTarget
    const rect = card.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const rx = ((y / rect.height - 0.5) * -8).toFixed(2)
    const ry = ((x / rect.width - 0.5) * 8).toFixed(2)

    card.style.setProperty('--mx', `${x}px`)
    card.style.setProperty('--my', `${y}px`)
    card.style.setProperty('--rx', `${rx}deg`)
    card.style.setProperty('--ry', `${ry}deg`)
  }

  const resetTilt = (event) => {
    event.currentTarget.style.setProperty('--rx', '0deg')
    event.currentTarget.style.setProperty('--ry', '0deg')
  }

  return (
    <article
      className="access-card allow-rounded"
      onPointerMove={handlePointerMove}
      onPointerLeave={resetTilt}
      tabIndex="0"
      aria-label={`${site.name} developer access card`}
    >
      <img className="access-card-image" src="/assets/card/ID-card.png" alt={`${site.name} ID card`} />
      <div className="access-hover-shimmer"></div>
    </article>
  )
}

function HomePage({ theme, onToggleTheme }) {
  const [isAchievementOpen, setIsAchievementOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [experienceFade, setExperienceFade] = useState({ top: false, bottom: false })
  const [profileTransition, setProfileTransition] = useState(null)
  const [isProfileTransitionFinalizing, setIsProfileTransitionFinalizing] = useState(false)
  const [displayedProfileTheme, setDisplayedProfileTheme] = useState(theme)
  const [profileTransitionTarget, setProfileTransitionTarget] = useState(theme)
  const previousThemeRef = useRef(theme)
  const profileTransitionLockRef = useRef(false)
  const profileImageRef = useRef(null)
  const experienceListRef = useRef(null)
  const profileVideoRef = useRef(null)
  const featuredProjects = site.projects.filter((item) => item.featured).slice(0, 4)
  const certifications = site.achievements.slice(0, 4)
  const recommendationDuration = `${Math.max(site.recommendations.length, 1) * 8}s`
  const isProfileTransitioning = Boolean(profileTransition)
  const profileImage = PROFILE_IMAGES[displayedProfileTheme]
  const transitionVideo = PROFILE_TRANSITION_VIDEOS[profileTransition] ?? ''

  useEffect(() => {
    if (!toastMessage) return undefined

    const timeoutId = window.setTimeout(() => {
      setToastMessage('')
    }, 2200)

    return () => window.clearTimeout(timeoutId)
  }, [toastMessage])

  useEffect(() => {
    const list = experienceListRef.current
    if (!list) return undefined

    const updateFade = () => {
      const canScroll = list.scrollHeight > list.clientHeight + 1
      setExperienceFade({
        top: canScroll && list.scrollTop > 1,
        bottom: canScroll && list.scrollTop + list.clientHeight < list.scrollHeight - 1,
      })
    }

    updateFade()
    const resizeObserver = new ResizeObserver(updateFade)
    resizeObserver.observe(list)
    window.addEventListener('resize', updateFade)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateFade)
    }
  }, [])

  useEffect(() => {
    Object.values(PROFILE_IMAGES).forEach((src) => {
      decodeProfileImage(src).catch(() => undefined)
    })
  }, [])

  useEffect(() => {
    const previousTheme = previousThemeRef.current
    if (previousTheme !== theme) {
      setProfileTransitionTarget(theme)
      setIsProfileTransitionFinalizing(false)
      setProfileTransition(previousTheme === 'light' && theme === 'dark' ? 'day-to-night' : 'night-to-day')
    } else {
      setDisplayedProfileTheme(theme)
      setProfileTransitionTarget(theme)
      setIsProfileTransitionFinalizing(false)
      profileTransitionLockRef.current = false
    }
    previousThemeRef.current = theme
  }, [theme])

  useEffect(() => {
    const video = profileVideoRef.current
    if (!video || !profileTransition) return undefined

    video.currentTime = 0
    video.muted = true
    video.volume = 0
    const playPromise = video.play()

    if (playPromise?.catch) {
      playPromise.catch(() => {
        setDisplayedProfileTheme(profileTransitionTarget)
        setIsProfileTransitionFinalizing(true)
      })
    }

    return undefined
  }, [profileTransition, profileTransitionTarget])

  useEffect(() => {
    if (!isProfileTransitionFinalizing || displayedProfileTheme !== profileTransitionTarget) return undefined

    let isCancelled = false

    const revealTargetImage = async () => {
      try {
        if (profileImageRef.current?.decode) {
          await profileImageRef.current.decode()
        }
      } catch {
        // The already-loaded image can still paint even if decode() rejects.
      }

      await waitForNextPaint()
      if (isCancelled) return

      setProfileTransition(null)
      setIsProfileTransitionFinalizing(false)
      profileTransitionLockRef.current = false
    }

    revealTargetImage()

    return () => {
      isCancelled = true
    }
  }, [displayedProfileTheme, isProfileTransitionFinalizing, profileTransitionTarget])

  const finishProfileTransition = async () => {
    await decodeProfileImage(PROFILE_IMAGES[profileTransitionTarget]).catch(() => undefined)
    setDisplayedProfileTheme(profileTransitionTarget)
    setIsProfileTransitionFinalizing(true)
  }

  const handleProfileThemeToggle = () => {
    if (profileTransitionLockRef.current) return

    profileTransitionLockRef.current = true
    onToggleTheme()
  }

  const handleCopyEmail = async () => {
    await copyText(site.email)
    setToastMessage('Email Copied Successfully')
  }

  const handleOpenChat = () => {
    window.dispatchEvent(new CustomEvent('portfolio:open-chat'))
  }

  const handleProjectTilePointerMove = (event) => {
    const tile = event.currentTarget
    const rect = tile.getBoundingClientRect()

    tile.style.setProperty('--shine-x', `${event.clientX - rect.left}px`)
    tile.style.setProperty('--shine-y', `${event.clientY - rect.top}px`)
  }

  const showProjectTileShine = (event) => {
    animate(event.currentTarget, {
      '--shine-opacity': [0, 1],
      duration: 220,
      ease: 'outCubic',
    })
  }

  const hideProjectTileShine = (event) => {
    animate(event.currentTarget, {
      '--shine-opacity': 0,
      duration: 260,
      ease: 'outCubic',
    })
  }

  return (
    <main className="profile-page page-transition">
      <div className={`copy-toast allow-rounded ${toastMessage ? 'copy-toast-visible' : ''}`} role="status">
        {toastMessage}
      </div>
      <div className="profile-shell">
        <header className="profile-hero animate-fade-in">
          <div className="profile-media">
            <img
              ref={profileImageRef}
              className="profile-photo"
              src={profileImage}
              alt={site.name}
              onError={(event) => {
                event.currentTarget.src = fallbackHero
              }}
            />
            {profileTransition ? (
              <video
                key={profileTransition}
                ref={profileVideoRef}
                className="profile-transition-video"
                src={transitionVideo}
                muted
                playsInline
                preload="auto"
                onEnded={finishProfileTransition}
                onError={finishProfileTransition}
                aria-hidden="true"
              />
            ) : null}
          </div>

          <div className="profile-copy">
            <div className="profile-topline">
              <div>
                <div className="profile-name-row">
                  <h1>{site.name}</h1>
                  <VerifiedBadge />
                </div>
                <p className="profile-location">
                  <MapPin size={13} /> {site.location}
                </p>
              </div>
              <button
                type="button"
                className={`theme-switch allow-rounded ${theme === 'dark' ? 'theme-switch-dark' : ''}`}
                onClick={handleProfileThemeToggle}
                disabled={isProfileTransitioning}
                aria-label="Toggle theme"
              >
                <span>{theme === 'dark' ? <Moon size={12} /> : <Sun size={12} />}</span>
              </button>
            </div>

            <div className="profile-meta-row">
              <div className="profile-meta">{site.tagline}</div>
              <div className="achievement-wrap hero-achievement">
                <button
                  type="button"
                  className="achievement-badge allow-rounded"
                  onClick={() => setIsAchievementOpen((prev) => !prev)}
                  aria-expanded={isAchievementOpen}
                >
                  <Trophy size={14} />
                  <span>{site.badges[0]}</span>
                  <ChevronDown size={14} className={isAchievementOpen ? 'rotate-icon' : ''} />
                </button>
                {isAchievementOpen ? (
                  <div className="achievement-dropdown allow-rounded">
                    <p>
                      <span></span>
                      Other Achievements
                    </p>
                    {site.achievements.map((achievement) => (
                      <div className="achievement-row" key={`${achievement.title}-${achievement.year}`}>
                        <span className="achievement-dot"></span>
                        <strong>{achievement.title}</strong>
                        <small>{achievement.issuer}</small>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="profile-actions">
            <button type="button" className="action-btn action-primary allow-rounded" onClick={handleCopyEmail}>
              <Mail size={14} />
              <span>Send Email</span>
              <ChevronRight size={14} />
            </button>
            <a className="action-btn allow-rounded" href={site.resume} target="_blank" rel="noreferrer">
              <ExternalLink size={14} />
              <span>Hire Me</span>
            </a>
            <Link className="action-btn allow-rounded" to="/blog">
              <BookOpen size={14} />
              <span>Read my Blog</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        </header>

        <section className="bento-grid">
          <div className="bento-column bento-left-column">
            <article id="about" className="bento-card about-card animate-fade-in">
              <h2>About</h2>
              <div className="long-copy">
                {site.about.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </article>

            <article id="tech-stack" className="bento-card tech-card animate-fade-in animation-delay-300">
              <div className="panel-head">
                <h2>Tech Stack</h2>
                <Link to="/tech-stack">
                  View All <ChevronRight size={13} />
                </Link>
              </div>
              {site.techStack.slice(0, 3).map((group) => (
                <div className="stack-group" key={group.category}>
                  <h3>{group.category}</h3>
                  <div className="text-tags">
                    {(group.items.length ? group.items : ['Coming Soon']).slice(0, 7).map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                  </div>
                </div>
              ))}
            </article>

            <article id="projects" className="bento-card projects-card animate-fade-in animation-delay-400">
              <div className="panel-head">
                <h2>Recent Projects</h2>
                <Link to="/projects">
                  View All <ChevronRight size={13} />
                </Link>
              </div>
              <div className="project-grid">
                {featuredProjects.map((project) => (
                  <a
                    key={project.name}
                    href={project.link}
                    target="_blank"
                    rel="noreferrer"
                    className="project-tile"
                    onPointerEnter={showProjectTileShine}
                    onPointerMove={handleProjectTilePointerMove}
                    onPointerLeave={hideProjectTileShine}
                  >
                    <h3>{project.name}</h3>
                    <p>{project.description}</p>
                    <span className="domain-chip">{getDomain(project.link)}</span>
                  </a>
                ))}
              </div>
            </article>
          </div>

          <div className="bento-column bento-right-column">
            <aside className="visual-column animate-fade-in animation-delay-200">
              <DeveloperAccessCard />
              <div className="feature-strip allow-rounded">
                <strong>I'M BUILDING</strong>
                <span>Mobile and Web Projects Today!</span>
              </div>
            </aside>

            <article
              id="experience"
              className={`bento-card experience-card animate-fade-in animation-delay-300 ${
                experienceFade.top ? 'experience-fade-top' : ''
              } ${experienceFade.bottom ? 'experience-fade-bottom' : ''}`}
            >
              <h2>Experience</h2>
              <ul className="experience-list" ref={experienceListRef} onScroll={() => {
                const list = experienceListRef.current
                if (!list) return
                const canScroll = list.scrollHeight > list.clientHeight + 1
                setExperienceFade({
                  top: canScroll && list.scrollTop > 1,
                  bottom: canScroll && list.scrollTop + list.clientHeight < list.scrollHeight - 1,
                })
              }}>
                {site.experience.map((item, index) => (
                  <li key={`${item.year}-${item.title}`}>
                    <span className={`exp-box ${index === 0 ? 'exp-box-active' : ''}`}></span>
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.org}</p>
                    </div>
                    <span className="exp-year">{item.year}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>

          <article className="bento-card cert-card animate-fade-in animation-delay-500">
            <div className="panel-head">
              <h2>Recent Certifications</h2>
              <Link to="/certifications">
                View All <ChevronRight size={13} />
              </Link>
            </div>
            <div className="cert-list">
              {certifications.map((item) => (
                <div className="cert-item" key={`${item.title}-${item.year}`}>
                  <h3>{item.title}</h3>
                  <p>{item.issuer}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="bento-card recommendation-card animate-fade-in animation-delay-500">
            <h2>Recommendations</h2>
            <div className="recommendation-rotator" style={{ '--recommendation-duration': recommendationDuration }}>
              {site.recommendations.map((item, index) => (
                <article
                  key={`${item.name}-${item.role}`}
                  className="recommendation-item"
                  style={{ animationDelay: `${index * 8}s` }}
                >
                  <p>"{item.quote}"</p>
                  <div>
                    <h3>{item.name}</h3>
                    <span>{item.role}</span>
                  </div>
                </article>
              ))}
            </div>
            <div className="recommendation-dots" style={{ '--recommendation-duration': recommendationDuration }}>
              {site.recommendations.map((item, index) => (
                <span key={item.name} style={{ animationDelay: `${index * 8}s` }}></span>
              ))}
            </div>
          </article>

          <section id="contact" className="bento-card contact-card animate-fade-in animation-delay-600">
            <article>
              <h3>A member of</h3>
              <div className="mini-list">
                {site.memberships.slice(0, 3).map((item) => (
                  <span key={item}>
                    {item}
                    <ExternalLink size={10} />
                  </span>
                ))}
              </div>
            </article>
            <article>
              <h3>Social Links</h3>
              <div className="social-list">
                <span className="social-disabled">
                  <SocialIcon type="linkedin" /> LinkedIn
                </span>
                <a href={site.socials.github} target="_blank" rel="noreferrer">
                  <SocialIcon type="github" /> GitHub
                </a>
                <a href={site.socials.facebook} target="_blank" rel="noreferrer">
                  <SocialIcon type="facebook" /> Facebook
                </a>
              </div>
            </article>
            <article>
              <h3>Looking For</h3>
              <p>{site.availability.join(', ')}.</p>
            </article>
            <article>
              <h3>Email</h3>
              <div className="mini-list contact-email-list">
                <button type="button" onClick={handleCopyEmail}>
                  <Mail size={15} /> {site.email}
                </button>
                <button type="button" onClick={handleOpenChat}>
                  <MessageCircle size={15} /> Let's Talk
                </button>
                <Link to="/blog">
                  <FileText size={15} /> Blog
                </Link>
              </div>
            </article>
          </section>

          <GalleryCarousel items={site.gallery} />
        </section>

        <footer className="copyright-strip">(c) {new Date().getFullYear()} {site.name}. All rights reserved.</footer>
      </div>
    </main>
  )
}

export default HomePage
