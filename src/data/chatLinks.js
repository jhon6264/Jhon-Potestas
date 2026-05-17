import { site } from './site'

const PORTFOLIO_ORIGIN = 'https://jhonpotestas.vercel.app'
const INTERNAL_ROUTES = new Set(['/', '/projects', '/tech-stack', '/certifications', '/blog', '/resume'])

function absoluteUrl(url) {
  if (typeof url !== 'string' || !url.trim()) return ''

  try {
    return new URL(url.trim(), PORTFOLIO_ORIGIN).href
  } catch {
    return ''
  }
}

function trimTrailingSlash(url) {
  return url.endsWith('/') ? url.slice(0, -1) : url
}

function compactLabel(value, fallback = 'Link') {
  return String(value || fallback)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80)
}

function isGenericLabel(label) {
  return /^(here|this link|link|link here|open link)$/i.test(label) || /^https?:\/\//i.test(label)
}

function getKind(url) {
  try {
    const parsed = new URL(url)
    const currentOrigin = typeof window === 'undefined' ? PORTFOLIO_ORIGIN : window.location.origin
    const isPortfolioOrigin = parsed.origin === PORTFOLIO_ORIGIN || parsed.origin === currentOrigin
    return isPortfolioOrigin && INTERNAL_ROUTES.has(parsed.pathname) ? 'internal' : 'external'
  } catch {
    return 'external'
  }
}

function toDisplayUrl(url) {
  try {
    const parsed = new URL(url)
    if (getKind(url) === 'internal') return parsed.pathname === '/' ? 'Home page' : parsed.pathname
    return parsed.hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function addLink(registry, label, url, description = '') {
  const normalizedUrl = absoluteUrl(url)
  if (!normalizedUrl) return

  const key = trimTrailingSlash(normalizedUrl)
  registry.set(key, {
    label: compactLabel(label),
    url: normalizedUrl,
    kind: getKind(normalizedUrl),
    description: compactLabel(description, ''),
    displayUrl: toDisplayUrl(normalizedUrl),
  })
}

export function buildTrustedLinkRegistry() {
  const registry = new Map()

  addLink(registry, 'Home', '/', 'Open my home page')
  addLink(registry, 'Projects', '/projects', 'Open my projects page')
  addLink(registry, 'Tech Stack', '/tech-stack', 'Open my tech stack page')
  addLink(registry, 'Certifications', '/certifications', 'Open my certifications page')
  addLink(registry, 'Blog', '/blog', 'Open my blog')
  addLink(registry, 'Resume', '/resume', 'Open my resume page')
  addLink(registry, 'Resume PDF', site.resume, 'Open my resume PDF')
  addLink(registry, 'GitHub', site.socials.github, 'Open my GitHub profile')
  addLink(registry, 'Facebook', site.socials.facebook, 'Open my Facebook profile')

  site.projects.forEach((project) => {
    addLink(registry, project.name, project.link, project.description)
  })

  return registry
}

export function normalizeChatLink(rawLink, registry = buildTrustedLinkRegistry()) {
  const normalizedUrl = absoluteUrl(rawLink?.url || rawLink)
  if (!normalizedUrl) return null

  const trustedLink = registry.get(trimTrailingSlash(normalizedUrl))
  if (!trustedLink) return null
  const requestedLabel = compactLabel(rawLink?.label, '')

  return {
    ...trustedLink,
    label: isGenericLabel(requestedLabel) ? trustedLink.label : compactLabel(requestedLabel, trustedLink.label),
    description: compactLabel(rawLink?.description, trustedLink.description),
  }
}

export function mergeChatLinks(...linkGroups) {
  const registry = buildTrustedLinkRegistry()
  const seen = new Set()
  const links = []

  linkGroups.flat().forEach((link) => {
    const normalizedLink = normalizeChatLink(link, registry)
    if (!normalizedLink || seen.has(normalizedLink.url)) return

    seen.add(normalizedLink.url)
    links.push(normalizedLink)
  })

  return links
}

export function getInternalRoute(link) {
  try {
    const parsed = new URL(link.url)
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return '/'
  }
}

export function extractTrustedLinksFromText(content) {
  const text = String(content || '')
  const links = []
  const markdownPattern = /\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^)\s]+)\)/g
  const urlPattern = /https?:\/\/[^\s)]+|\/(?:resume|projects|tech-stack|certifications|blog)(?:[^\s)]*)?/g

  const strippedMarkdown = text.replace(markdownPattern, (match, label, url) => {
    links.push({ label, url })
    return label
  })

  const strippedText = strippedMarkdown.replace(urlPattern, (url) => {
    links.push({ url })
    return ''
  })

  return {
    content: strippedText.replace(/[ \t]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim(),
    links: mergeChatLinks(links),
  }
}
