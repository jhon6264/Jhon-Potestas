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
    content: 'UI mode only for now. Next, we can connect this chat to a Cloudflare Worker that calls Groq.',
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

  return {
    role: 'assistant',
    content: data.message,
    model: data.model,
  }
}
