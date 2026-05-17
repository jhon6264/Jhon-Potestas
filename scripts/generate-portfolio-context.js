import { writeFile } from 'node:fs/promises'
import { site } from '../src/data/site.js'

const siteUrl = 'https://jhonpotestas.vercel.app/'

function absoluteUrl(path) {
  return new URL(path, siteUrl).href
}

const context = {
  source: 'Live portfolio website content',
  note: 'Generated from src/data/site.js. Deploy the portfolio after content changes so the chat Worker can fetch the newest context.',
  profile: {
    displayName: site.name,
    location: site.location,
    email: site.email,
    tagline: site.tagline,
    focus: site.focus,
  },
  resume: {
    available: Boolean(site.resume),
    page: absoluteUrl('/resume'),
    downloadUrl: absoluteUrl(site.resume),
    fileName: 'JhonPotestas_Resume.pdf',
    guidance:
      'If a visitor asks for a resume, CV, hiring details, or where to download the resume, say that the resume is available on the Resume/Hire Me page and can be downloaded from the PDF link.',
  },
  socials: site.socials,
  about: site.about,
  experience: site.experience,
  techStack: site.techStack,
  projects: site.projects,
  achievements: site.achievements,
  recommendations: site.recommendations,
  memberships: site.memberships,
  availability: site.availability,
  pages: {
    home: absoluteUrl('/'),
    projects: absoluteUrl('/projects'),
    techStack: absoluteUrl('/tech-stack'),
    certifications: absoluteUrl('/certifications'),
    blog: absoluteUrl('/blog'),
    resume: absoluteUrl('/resume'),
  },
}

await writeFile('public/portfolio-context.json', `${JSON.stringify(context, null, 2)}\n`)
