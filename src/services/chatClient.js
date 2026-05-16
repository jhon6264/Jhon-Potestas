export async function sendChatMessage() {
  await new Promise((resolve) => {
    window.setTimeout(resolve, 650)
  })

  return {
    role: 'assistant',
    content: 'UI mode only for now. Next, we can connect this chat to a Cloudflare Worker that calls Groq.',
  }
}
