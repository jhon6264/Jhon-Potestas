const GROQ_CHAT_COMPLETIONS_URL = 'https://api.groq.com/openai/v1/chat/completions'
const FALLBACK_MODELS = [
  'qwen/qwen3-32b',
  'llama-3.3-70b-versatile',
  'meta-llama/llama-4-scout-17b-16e-instruct',
]
const DEFAULT_ALLOWED_ORIGINS = ['https://jhonpotestas.vercel.app', 'http://localhost:5173', 'http://127.0.0.1:5173']
const DEFAULT_PORTFOLIO_CONTEXT_URL = 'https://jhonpotestas.vercel.app/portfolio-context.json'
const MAX_HISTORY_MESSAGES = 12
const MAX_MESSAGE_CHARS = 1200
const MAX_PORTFOLIO_CONTEXT_CHARS = 9000
const PORTFOLIO_CONTEXT_TIMEOUT_MS = 2500

const SYSTEM_PROMPT = `You are the portfolio assistant for Jhon Potestas.
Use a friendly and professional attitude: warm, clear, respectful, and practical.
Silently identify the user's intent before answering: greeting, acknowledgment, portfolio question, project question, tech-stack question, contact question, code request, or unrelated question.
Before answering, check the attached live portfolio context. The Worker fetches that context during each chat request, so treat it as the newest available deployed portfolio content.
Use the live portfolio context as the source of truth for Jhon's resume, pages, projects, tech stack, experience, contact details, availability, and other portfolio content.
If the live portfolio context conflicts with the fallback known details in this prompt, the live portfolio context wins.
If a visitor asks about a resume, CV, hiring page, or downloadable resume, check the resume section in the live portfolio context first. If resume.available is true, say the resume is available on the Resume/Hire Me page and can be downloaded from the listed PDF link.
If the visitor asks whether your information is current, say you check the deployed portfolio context during each chat request, and new portfolio changes appear after the portfolio is deployed.
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
Avoid Markdown links unless the user asks for links; write plain URLs or plain email only when contact details are requested.
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
- Facebook: https://www.facebook.com/jhoncristopher.relativopotestas.7/`

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
    .trim()
}

function getPortfolioContextUrl(env) {
  return String(env.PORTFOLIO_CONTEXT_URL || DEFAULT_PORTFOLIO_CONTEXT_URL).trim()
}

async function fetchPortfolioContext(env) {
  const contextUrl = getPortfolioContextUrl(env)
  if (!contextUrl) return ''

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

    if (!response.ok) return ''

    const contentType = response.headers.get('content-type') || ''
    const contextText = contentType.includes('application/json')
      ? JSON.stringify(await response.json(), null, 2)
      : await response.text()

    return contextText.slice(0, MAX_PORTFOLIO_CONTEXT_CHARS)
  } catch {
    return ''
  } finally {
    clearTimeout(timeoutId)
  }
}

function buildSystemPrompt(portfolioContext) {
  const liveContext =
    portfolioContext ||
    'Live portfolio context was unavailable for this request. Use the fallback known public details, and do not invent details that are not listed.'

  return `${SYSTEM_PROMPT}

Live portfolio context checked for this request:
${liveContext}`
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
      max_completion_tokens: 350,
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

      const result = await answerWithFallbackModels({
        env,
        messages: [{ role: 'system', content: buildSystemPrompt(portfolioContext) }, ...messages],
      })

      return jsonResponse(request, env, {
        message: result.content,
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
