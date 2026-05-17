import { extractTrustedLinksFromText, mergeChatLinks, normalizeChatLink } from '../data/chatLinks'
import { site } from '../data/site'

const workerUrl = import.meta.env.VITE_CHAT_WORKER_URL?.trim()
const FORMAT_FALLBACK = "I couldn't format that answer. Please ask me again."

function getChatEndpoint() {
  if (!workerUrl) return ''
  return workerUrl.endsWith('/chat') ? workerUrl : `${workerUrl.replace(/\/$/, '')}/chat`
}

async function sendMockChatMessage() {
  await new Promise((resolve) => {
    window.setTimeout(resolve, 650)
  })

  return {
    role: 'assistant',
    content: "I'm Jhon's AI. The live Worker is not connected in this local mode yet.",
    links: [],
    navigation: null,
  }
}

function cleanAssistantText(content) {
  return String(content || '')
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<think>[\s\S]*/gi, '')
    .trim()
}

function looksLikeStructuredPayload(content) {
  const text = String(content || '').trim()
  return (
    /^```json/i.test(text) ||
    /^\{\s*"(message|links|navigation)"/i.test(text) ||
    (/"message"\s*:/i.test(text) && /"links"\s*:/i.test(text))
  )
}

function parseStructuredPayload(content) {
  const text = cleanAssistantText(content)
  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fencedMatch ? fencedMatch[1] : text
  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')

  if (start === -1 || end === -1 || end <= start) return null

  try {
    const parsed = JSON.parse(candidate.slice(start, end + 1))
    if (!parsed || typeof parsed !== 'object') return null
    return 'message' in parsed || 'links' in parsed || 'navigation' in parsed ? parsed : null
  } catch {
    return null
  }
}

function decodeJsonStringFragment(value) {
  const fragment = String(value || '')
  const safeFragment = Array.from(fragment, (char) => (char.charCodeAt(0) < 32 ? ' ' : char)).join('')

  try {
    return JSON.parse(`"${safeFragment}"`)
  } catch {
    return fragment
      .replace(/\\"/g, '"')
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\\\/g, '\\')
  }
}

function extractLooseStringField(content, fieldName) {
  const pattern = new RegExp(`"${fieldName}"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)`, 'i')
  const match = String(content || '').match(pattern)
  return match ? decodeJsonStringFragment(match[1]).trim() : ''
}

function extractLooseLinks(content) {
  const text = String(content || '')
  const links = []
  const labeledLinkPattern =
    /"label"\s*:\s*"((?:\\.|[^"\\])*)[\s\S]{0,220}?"url"\s*:\s*"((?:\\.|[^"\\])*)/gi
  const urlPattern = /"url"\s*:\s*"((?:\\.|[^"\\])*)/gi
  let match = labeledLinkPattern.exec(text)

  while (match) {
    links.push({
      label: decodeJsonStringFragment(match[1]).trim(),
      url: decodeJsonStringFragment(match[2]).trim(),
    })
    match = labeledLinkPattern.exec(text)
  }

  if (!links.length) {
    match = urlPattern.exec(text)

    while (match) {
      links.push({ url: decodeJsonStringFragment(match[1]).trim() })
      match = urlPattern.exec(text)
    }
  }

  return links
}

function parseLooseStructuredPayload(content) {
  const text = cleanAssistantText(content)
  if (!looksLikeStructuredPayload(text)) return null

  const message = extractLooseStringField(text, 'message')
  const links = extractLooseLinks(text)

  if (!message && !links.length) return null

  return {
    message,
    links,
    navigation: null,
  }
}

function mergeStructuredReply(data) {
  const nestedPayload = parseStructuredPayload(data?.message)
  if (nestedPayload) {
    return {
      ...data,
      message: nestedPayload.message || '',
      links: Array.isArray(nestedPayload.links) ? nestedPayload.links : [],
      navigation: nestedPayload.navigation || null,
    }
  }

  const loosePayload = parseLooseStructuredPayload(data?.message)
  if (loosePayload) {
    return {
      ...data,
      message: loosePayload.message,
      links: loosePayload.links,
      navigation: null,
    }
  }

  return data
}

function inferLinksFromText(content) {
  const text = String(content || '').toLowerCase()
  const suggestsDestination = /\b(available|browse|check|download|find|go|link|list|open|page|profile|redirect|see|send|show|view|visit)\b/.test(
    text,
  )
  const links = []

  if (!suggestsDestination) return links

  if (/\b(resume|cv|hire me|pdf)\b/.test(text)) links.push({ label: 'Resume' })
  if (/\b(project|projects)\b/.test(text)) links.push({ label: 'Projects' })
  if (/\b(skill|skills|tech stack|technology|technologies)\b/.test(text)) links.push({ label: 'Tech Stack' })
  if (/\b(certificate|certification|certifications)\b/.test(text)) links.push({ label: 'Certifications' })
  if (/\b(blog|article|posts?)\b/.test(text)) links.push({ label: 'Blog' })
  if (/\bgithub\b/.test(text)) links.push({ label: 'GitHub' })
  if (/\bfacebook\b/.test(text)) links.push({ label: 'Facebook' })

  return links
}

function formatList(items) {
  if (items.length <= 1) return items[0] || ''
  if (items.length === 2) return `${items[0]} and ${items[1]}`

  return `${items.slice(0, -1).join(', ')}, and ${items.at(-1)}`
}

function isFormatFallback(content) {
  return /couldn['’]t format|could not format|trouble formatting/i.test(String(content || ''))
}

function getContextualFallback(links, sourceText) {
  const labels = links.map((link) => link.label.toLowerCase())
  const text = String(sourceText || '').toLowerCase()
  const hasLink = (label) => labels.includes(label.toLowerCase())

  if (hasLink('Projects') || /\b(project|projects)\b/.test(text)) {
    const featuredProjects = site.projects.filter((project) => project.featured).map((project) => project.name)
    return `Here are my featured projects: ${formatList(featuredProjects)}. You can open the Projects page for the full list.`
  }

  if (hasLink('Resume') || /\b(resume|cv|hire me)\b/.test(text)) {
    return 'My resume is available on the Resume/Hire Me page, and the PDF can be downloaded there.'
  }

  if (hasLink('Tech Stack') || /\b(skill|skills|tech stack|technology|technologies)\b/.test(text)) {
    const categories = site.techStack.map((group) => group.category)
    return `My tech stack is grouped into ${formatList(categories)}. You can open the Tech Stack page for the details.`
  }

  if (hasLink('Certifications') || /\b(certificate|certification|certifications)\b/.test(text)) {
    return 'You can view my certifications and achievements on the Certifications page.'
  }

  if (hasLink('Blog') || /\b(blog|article|posts?)\b/.test(text)) {
    return 'You can read my posts on the Blog page.'
  }

  if (hasLink('GitHub')) return 'You can view my public code and repositories on GitHub.'
  if (hasLink('Facebook')) return 'You can reach or view me through my Facebook profile.'

  return FORMAT_FALLBACK
}

export function normalizeAssistantReply(data) {
  const structuredData = mergeStructuredReply(data)
  const cleanedMessage = cleanAssistantText(structuredData?.message)
  const extracted = extractTrustedLinksFromText(cleanedMessage)
  const navigation = normalizeChatLink(structuredData?.navigation)
  const safeContent = looksLikeStructuredPayload(extracted.content || cleanedMessage)
    ? ''
    : extracted.content || cleanedMessage
  const inferredLinks = inferLinksFromText(`${safeContent} ${cleanedMessage}`)
  const links = mergeChatLinks(
    navigation ? [navigation] : [],
    structuredData?.links || [],
    extracted.links,
    inferredLinks,
  )
  const content =
    safeContent && !isFormatFallback(safeContent) ? safeContent : getContextualFallback(links, cleanedMessage)

  return {
    role: 'assistant',
    content,
    links,
    navigation,
    model: data?.model,
  }
}

export async function sendChatMessage(messages) {
  const endpoint = getChatEndpoint()
  if (!endpoint) return sendMockChatMessage()

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ messages }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data?.error || 'Chat request failed')
  }

  return normalizeAssistantReply(data)
}
