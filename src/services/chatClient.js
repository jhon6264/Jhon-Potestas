import { extractTrustedLinksFromText, mergeChatLinks, normalizeChatLink } from '../data/chatLinks'

const workerUrl = import.meta.env.VITE_CHAT_WORKER_URL?.trim()

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

function normalizeAssistantReply(data) {
  const extracted = extractTrustedLinksFromText(data?.message || '')
  const navigation = normalizeChatLink(data?.navigation)
  const links = mergeChatLinks(navigation ? [navigation] : [], data?.links || [], extracted.links)

  return {
    role: 'assistant',
    content: extracted.content || data?.message || 'I could not format that answer. Please try again.',
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
