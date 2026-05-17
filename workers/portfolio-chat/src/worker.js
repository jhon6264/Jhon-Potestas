const GROQ_CHAT_COMPLETIONS_URL = 'https://api.groq.com/openai/v1/chat/completions'
const FALLBACK_MODELS = [
  'llama-3.3-70b-versatile',
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'qwen/qwen3-32b',
]
const DEFAULT_ALLOWED_ORIGINS = ['https://jhonpotestas.vercel.app', 'http://localhost:5173', 'http://127.0.0.1:5173']
const DEFAULT_PORTFOLIO_CONTEXT_URL = 'https://jhonpotestas.vercel.app/portfolio-context.json'
const PORTFOLIO_ORIGIN = 'https://jhonpotestas.vercel.app'
const MAX_HISTORY_MESSAGES = 12
const MAX_MESSAGE_CHARS = 1200
const MAX_PORTFOLIO_CONTEXT_CHARS = 9000
const PORTFOLIO_CONTEXT_TIMEOUT_MS = 2500
const MAX_LINKS = 4
const INTERNAL_ROUTES = new Set(['/', '/projects', '/tech-stack', '/certifications', '/blog', '/resume'])
const FORMAT_FALLBACK = "I couldn't format that answer. Please ask me again."

const SYSTEM_PROMPT = `You are the portfolio assistant for Jhon Potestas.
Use a friendly and professional attitude: warm, clear, respectful, and practical.
If someone asks who you are, say: "I'm Jhon's AI."
Speak as Jhon's AI using first person where natural: "my resume", "my projects", "my skills", and "my portfolio".
Do not mention or reveal any full private name that is not present in the live portfolio context. Use "Jhon Potestas" in chat.
Silently identify the user's intent before answering: greeting, acknowledgment, portfolio question, project question, tech-stack question, contact question, code request, or unrelated question.
Before answering, check the attached live portfolio context. The Worker fetches that context during each chat request, so treat it as the newest available deployed portfolio content.
Use the live portfolio context as the source of truth for Jhon's resume, pages, projects, tech stack, experience, contact details, availability, and other portfolio content.
If the live portfolio context conflicts with the fallback known details in this prompt, the live portfolio context wins.
Never include hidden reasoning, chain-of-thought, or <think> tags in the answer.
If a visitor asks about a resume, CV, hiring page, or downloadable resume, check the resume section in the live portfolio context first. If resume.available is true, say the resume is available on the Resume/Hire Me page and can be downloaded from the listed PDF link.
If the visitor asks whether your information is current, say you check the deployed portfolio context during each chat request, and new portfolio changes appear after the portfolio is deployed.
You can answer programming questions. Keep general programming answers practical, concise, and separate from claims about Jhon's personal experience unless the live portfolio context supports those claims.
When you need to provide a URL, do not write Markdown links like [text](url) in the message. Put links in the JSON links array instead.
When the user asks to redirect, send them to a link, open a link, or go to a page, ask for confirmation in the message and include the target as a link card. The frontend will handle navigation after the user clicks.
Internal portfolio URLs should use kind "internal". GitHub, Facebook, and repository URLs should use kind "external".
Adapt the response length to the user's question:
- For greetings like "hi", "hey", "hello", or "yo": reply with one short greeting and ask what they want to know. Do not mention projects, skills, links, or contact details.
- For acknowledgments like "okay", "nice", "thanks", or "got it": reply in one short sentence. Do not add new information.
- For simple questions, answer in 1-2 short sentences.
- For normal portfolio questions, answer in 2-4 concise sentences.
- If the question asks for details, give a structured but concise answer.
- Avoid long explanations unless the user explicitly asks for depth.
Keep the tone human and helpful without sounding overly promotional.
Answer only what the user asked. Do not add contact info, project lists, links, summaries, or pitches unless requested.
Focus on Jhon's projects, tech stack, experience, contact details, education, and portfolio content.
If someone asks about unrelated topics, briefly answer only when helpful, then steer back to Jhon's work.
Do not invent achievements, employment, certifications, links, or private details.
If information is not available in the portfolio context, say that Jhon has not added that detail yet.
Use simple formatting only when it improves readability.
Use plain paragraphs for short answers and bullets only for lists.
Do not write Markdown links or raw URLs in the message. Use the JSON links array for URLs. Write the email as plain text only when contact details are requested.
If the user asks for code, put code in fenced Markdown code blocks with a language tag, like \`\`\`js, \`\`\`jsx, \`\`\`html, or \`\`\`css. Keep code concise and explain only what is necessary.
Avoid emojis unless the user uses them first or the tone clearly calls for one.

Fallback known public details:
- Display name: Jhon Potestas
- Location: Davao Del Sur, Philippines
- Email: Spyam17@gmail.com
- Role/tagline: Student, Junior App Developer, Junior Web Developer
- Resume: available on the Resume/Hire Me page, with a downloadable PDF
- Focus: mobile app development with AI and LLM integration, AI agents for project subtasks, and advanced video editing workflows
- Frontend: JavaScript, React, Next.js, Tailwind CSS, Bootstrap 5, Webpack, ESLint, Prettier
- Backend: Node.js, Python, PHP, Java, Express.js, Laravel, MySQL
- Cloud/tools: Firebase, Cloudflare Worker, Git, GitHub, VS Code, Antigravity, Cline, Codex, Discord
- Featured projects: SMCBI Document Tracking System, Owly, SmartLock, RiderX, Pakman Lite 3D, PokeTalk
- GitHub: https://github.com/jhon6264
- Facebook: https://www.facebook.com/jhoncristopher.relativopotestas.7/

Return only valid JSON with this shape:
{
  "message": "short assistant text with no markdown links",
  "links": [
    {
      "label": "Resume",
      "url": "https://jhonpotestas.vercel.app/resume",
      "kind": "internal",
      "description": "Open my resume page"
    }
  ],
  "navigation": null
}
Use an empty links array when there are no links. Set navigation to null unless you are suggesting one clear destination.`

function jsonResponse(request, env, body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...getCorsHeaders(request, env),
    },
  })
}

function getCorsHeaders(request, env) {
  const origin = request.headers.get('Origin')
  const allowedOrigins = String(env.ALLOWED_ORIGINS || DEFAULT_ALLOWED_ORIGINS.join(','))
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  const allowedOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0]

  return {
    'access-control-allow-origin': allowedOrigin,
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'Content-Type',
    'access-control-max-age': '86400',
    vary: 'Origin',
  }
}

function normalizeMessages(rawMessages) {
  if (!Array.isArray(rawMessages)) return []

  return rawMessages
    .filter((message) => message && ['user', 'assistant'].includes(message.role) && typeof message.content === 'string')
    .slice(-MAX_HISTORY_MESSAGES)
    .map((message) => ({
      role: message.role,
      content: message.content.trim().slice(0, MAX_MESSAGE_CHARS),
    }))
    .filter((message) => message.content.length > 0)
}

function cleanAssistantText(content) {
  return String(content || '')
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<think>[\s\S]*/gi, '')
    .trim()
}

function getPortfolioContextUrl(env) {
  return String(env.PORTFOLIO_CONTEXT_URL || DEFAULT_PORTFOLIO_CONTEXT_URL).trim()
}

async function fetchPortfolioContext(env) {
  const contextUrl = getPortfolioContextUrl(env)
  if (!contextUrl) return { text: '', data: null }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), PORTFOLIO_CONTEXT_TIMEOUT_MS)

  try {
    const response = await fetch(contextUrl, {
      signal: controller.signal,
      headers: {
        accept: 'application/json',
        'cache-control': 'no-cache',
      },
      cf: { cacheTtl: 0 },
    })

    if (!response.ok) return { text: '', data: null }

    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const data = await response.json()

      return {
        text: JSON.stringify(data, null, 2).slice(0, MAX_PORTFOLIO_CONTEXT_CHARS),
        data,
      }
    }

    return { text: (await response.text()).slice(0, MAX_PORTFOLIO_CONTEXT_CHARS), data: null }
  } catch {
    return { text: '', data: null }
  } finally {
    clearTimeout(timeoutId)
  }
}

function buildSystemPrompt(portfolioContextText) {
  const liveContext =
    portfolioContextText ||
    'Live portfolio context was unavailable for this request. Use the fallback known public details, and do not invent details that are not listed.'

  return `${SYSTEM_PROMPT}

Live portfolio context checked for this request:
${liveContext}`
}

function normalizeAbsoluteUrl(url) {
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

function classifyLink(url) {
  const absoluteUrl = normalizeAbsoluteUrl(url)
  if (!absoluteUrl) return ''

  const parsed = new URL(absoluteUrl)
  return parsed.origin === PORTFOLIO_ORIGIN && INTERNAL_ROUTES.has(parsed.pathname) ? 'internal' : 'external'
}

function compactText(value, fallback = '') {
  return String(value || fallback)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120)
}

function isGenericLabel(label) {
  return /^(here|this link|link|link here|open link)$/i.test(label) || /^https?:\/\//i.test(label)
}

function labelKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '')
}

function findTrustedLinkByLabel(label, registry) {
  const key = labelKey(label)
  if (!key) return null

  const aliases = {
    blog: 'Blog',
    blogpage: 'Blog',
    certifications: 'Certifications',
    certification: 'Certifications',
    certificationpage: 'Certifications',
    cv: 'Resume',
    facebook: 'Facebook',
    github: 'GitHub',
    hire: 'Resume',
    hireme: 'Resume',
    homepage: 'Home',
    home: 'Home',
    pdf: 'Resume PDF',
    projects: 'Projects',
    projectpage: 'Projects',
    resumepage: 'Resume',
    resume: 'Resume',
    resumepdf: 'Resume PDF',
    skills: 'Tech Stack',
    tech: 'Tech Stack',
    techstack: 'Tech Stack',
    technologies: 'Tech Stack',
  }
  const directMatch = [...registry.values()].find((link) => labelKey(link.label) === key)
  const targetLabel = aliases[key]

  if (directMatch) return directMatch
  if (!targetLabel) return null

  return [...registry.values()].find((link) => link.label === targetLabel) || null
}

function addTrustedLink(registry, label, url, description = '') {
  const absoluteUrl = normalizeAbsoluteUrl(url)
  if (!absoluteUrl) return

  registry.set(trimTrailingSlash(absoluteUrl), {
    label: compactText(label, 'Link'),
    url: absoluteUrl,
    kind: classifyLink(absoluteUrl),
    description: compactText(description),
  })
}

function buildTrustedLinks(portfolioContextData) {
  const registry = new Map()
  addTrustedLink(registry, 'Home', '/', 'Open my home page')
  addTrustedLink(registry, 'Projects', '/projects', 'Open my projects page')
  addTrustedLink(registry, 'Tech Stack', '/tech-stack', 'Open my tech stack page')
  addTrustedLink(registry, 'Certifications', '/certifications', 'Open my certifications page')
  addTrustedLink(registry, 'Blog', '/blog', 'Open my blog')
  addTrustedLink(registry, 'Resume', '/resume', 'Open my resume page')
  addTrustedLink(registry, 'Resume PDF', '/assets/resume/JhonPotestas_Resume.pdf', 'Open my resume PDF')
  addTrustedLink(registry, 'GitHub', 'https://github.com/jhon6264', 'Open my GitHub profile')
  addTrustedLink(
    registry,
    'Facebook',
    'https://www.facebook.com/jhoncristopher.relativopotestas.7/',
    'Open my Facebook profile',
  )

  const pages = portfolioContextData?.pages || {}
  Object.entries(pages).forEach(([label, url]) => {
    addTrustedLink(registry, label.replace(/([A-Z])/g, ' $1'), url, `Open my ${label} page`)
  })

  const resume = portfolioContextData?.resume || {}
  addTrustedLink(registry, 'Resume', resume.page, 'Open my resume page')
  addTrustedLink(registry, 'Resume PDF', resume.downloadUrl, 'Open my resume PDF')

  const socials = portfolioContextData?.socials || {}
  Object.entries(socials).forEach(([label, url]) => {
    if (url) addTrustedLink(registry, label, url, `Open my ${label}`)
  })

  const projects = Array.isArray(portfolioContextData?.projects) ? portfolioContextData.projects : []
  projects.forEach((project) => {
    addTrustedLink(registry, project.name, project.link, project.description)
  })

  return registry
}

function findTrustedLink(url, registry) {
  const absoluteUrl = normalizeAbsoluteUrl(url)
  if (!absoluteUrl) return null

  const normalized = trimTrailingSlash(absoluteUrl)
  return registry.get(normalized) || registry.get(`${normalized}/`) || null
}

function sanitizeLinks(rawLinks, registry) {
  if (!Array.isArray(rawLinks)) return []

  const seen = new Set()
  const links = []

  rawLinks.forEach((rawLink) => {
    const urlMatch = findTrustedLink(rawLink?.url, registry)
    const labelMatch = findTrustedLinkByLabel(rawLink?.label || rawLink, registry)
    const trustedLink =
      labelMatch && urlMatch && urlMatch.label === 'Home' && labelMatch.label !== 'Home'
        ? labelMatch
        : urlMatch || labelMatch
    if (!trustedLink || seen.has(trustedLink.url)) return

    const requestedLabel = compactText(rawLink?.label)
    seen.add(trustedLink.url)
    links.push({
      ...trustedLink,
      label: isGenericLabel(requestedLabel) ? trustedLink.label : compactText(requestedLabel, trustedLink.label),
      description: compactText(rawLink?.description, trustedLink.description),
    })
  })

  return links.slice(0, MAX_LINKS)
}

function sanitizeNavigation(rawNavigation, registry) {
  if (!rawNavigation || typeof rawNavigation !== 'object') return null

  const urlMatch = findTrustedLink(rawNavigation.url, registry)
  const labelMatch = findTrustedLinkByLabel(rawNavigation.label, registry)
  const trustedLink =
    labelMatch && urlMatch && urlMatch.label === 'Home' && labelMatch.label !== 'Home'
      ? labelMatch
      : urlMatch || labelMatch
  if (!trustedLink) return null

  return {
    ...trustedLink,
    label: isGenericLabel(compactText(rawNavigation.label))
      ? trustedLink.label
      : compactText(rawNavigation.label, trustedLink.label),
    description: compactText(rawNavigation.description, trustedLink.description),
    requiresConfirmation: rawNavigation.requiresConfirmation !== false,
  }
}

function extractJsonObject(content) {
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

function looksLikeStructuredPayload(content) {
  const text = String(content || '').trim()
  return (
    /^```json/i.test(text) ||
    /^\{\s*"(message|links|navigation)"/i.test(text) ||
    (/"message"\s*:/i.test(text) && /"links"\s*:/i.test(text))
  )
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

function extractLoosePayload(content) {
  const text = cleanAssistantText(content)
  if (!looksLikeStructuredPayload(text)) return null

  const message = extractLooseStringField(text, 'message')
  const links = extractLooseLinks(text)

  if (!message && !links.length) return null

  return { message, links, navigation: null }
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

function getContextualFallback(links, sourceText, portfolioContextData) {
  const labels = links.map((link) => String(link.label || '').toLowerCase())
  const text = String(sourceText || '').toLowerCase()
  const hasLink = (label) => labels.includes(label.toLowerCase())

  if (hasLink('Projects') || /\b(project|projects)\b/.test(text)) {
    const projects = Array.isArray(portfolioContextData?.projects) ? portfolioContextData.projects : []
    const featuredProjects = projects
      .filter((project) => project.featured !== false)
      .map((project) => project.name)
      .filter(Boolean)
    const projectNames = featuredProjects.length
      ? featuredProjects
      : ['SMCBI Document Tracking System', 'Owly', 'SmartLock', 'RiderX', 'Pakman Lite 3D', 'PokeTalk']

    return `Here are my featured projects: ${formatList(projectNames)}. You can open the Projects page for the full list.`
  }

  if (hasLink('Resume') || /\b(resume|cv|hire me)\b/.test(text)) {
    return 'My resume is available on the Resume/Hire Me page, and the PDF can be downloaded there.'
  }

  if (hasLink('Tech Stack') || /\b(skill|skills|tech stack|technology|technologies)\b/.test(text)) {
    const groups = Array.isArray(portfolioContextData?.techStack) ? portfolioContextData.techStack : []
    const categories = groups.map((group) => group.category).filter(Boolean)
    const summary = categories.length
      ? `My tech stack is grouped into ${formatList(categories)}.`
      : 'My tech stack includes frontend, backend, cloud, AI, and developer tools.'

    return `${summary} You can open the Tech Stack page for the details.`
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

function sanitizeAssistantPayload(content, registry, portfolioContextData) {
  const parsed = extractJsonObject(content)
  const loosePayload = parsed ? null : extractLoosePayload(content)
  const rawMessage = parsed?.message || loosePayload?.message || cleanAssistantText(content)
  const cleanedMessage = cleanAssistantText(rawMessage).slice(0, 1200)
  const links = sanitizeLinks(
    [
      ...(Array.isArray(parsed?.links) ? parsed.links : []),
      ...(Array.isArray(loosePayload?.links) ? loosePayload.links : []),
      ...inferLinksFromText(`${cleanedMessage} ${content}`),
    ],
    registry,
  )
  const navigation = sanitizeNavigation(parsed?.navigation || loosePayload?.navigation, registry)
  const message =
    cleanedMessage && !looksLikeStructuredPayload(cleanedMessage) && !isFormatFallback(cleanedMessage)
      ? cleanedMessage
      : getContextualFallback(links, cleanedMessage || content, portfolioContextData)

  return {
    message,
    links,
    navigation,
  }
}

async function callGroq({ apiKey, model, messages }) {
  const response = await fetch(GROQ_CHAT_COMPLETIONS_URL, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.5,
      max_completion_tokens: 600,
    }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message = data?.error?.message || `Groq request failed with status ${response.status}`
    throw new Error(message)
  }

  const content = cleanAssistantText(data?.choices?.[0]?.message?.content)
  if (!content) throw new Error('Groq returned an empty response')

  return content
}

async function answerWithFallbackModels({ env, messages }) {
  const errors = []

  for (const model of FALLBACK_MODELS) {
    try {
      const content = await callGroq({
        apiKey: env.GROQ_API_KEY,
        model,
        messages,
      })

      return { content, model }
    } catch (error) {
      errors.push(`${model}: ${error.message}`)
    }
  }

  throw new Error(errors.join(' | '))
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: getCorsHeaders(request, env),
      })
    }

    const url = new URL(request.url)
    if (url.pathname !== '/chat') {
      return jsonResponse(request, env, { error: 'Not found' }, 404)
    }

    if (request.method !== 'POST') {
      return jsonResponse(request, env, { error: 'Method not allowed' }, 405)
    }

    if (!env.GROQ_API_KEY) {
      return jsonResponse(request, env, { error: 'Missing GROQ_API_KEY Worker secret' }, 500)
    }

    const body = await request.json().catch(() => null)
    const messages = normalizeMessages(body?.messages)

    if (!messages.length || messages[messages.length - 1].role !== 'user') {
      return jsonResponse(request, env, { error: 'Request must include messages ending with a user message' }, 400)
    }

    try {
      const portfolioContext = await fetchPortfolioContext(env)
      const trustedLinks = buildTrustedLinks(portfolioContext.data)

      const result = await answerWithFallbackModels({
        env,
        messages: [{ role: 'system', content: buildSystemPrompt(portfolioContext.text) }, ...messages],
      })
      const assistantPayload = sanitizeAssistantPayload(result.content, trustedLinks, portfolioContext.data)

      return jsonResponse(request, env, {
        message: assistantPayload.message,
        links: assistantPayload.links,
        navigation: assistantPayload.navigation,
        model: result.model,
      })
    } catch (error) {
      return jsonResponse(
        request,
        env,
        {
          error: 'All Groq models failed',
          detail: error.message,
        },
        502,
      )
    }
  },
}
