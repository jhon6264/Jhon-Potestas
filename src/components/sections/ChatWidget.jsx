import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { animate } from 'animejs'
import { ArrowRight, Check, Copy, ExternalLink, MessageCircle, X } from 'lucide-react'
import { chatConfig } from '../../data/chatConfig'
import { getInternalRoute } from '../../data/chatLinks'
import { normalizeAssistantReply, sendChatMessage } from '../../services/chatClient'

const CHAT_MESSAGES_STORAGE_KEY = 'jhon-portfolio-chat-messages'
const CHAT_OPEN_STORAGE_KEY = 'jhon-portfolio-chat-open'
const MAX_STORED_MESSAGES = 30

const starterMessages = [
  {
    id: 1,
    role: 'assistant',
    content: chatConfig.introMessage,
    links: [],
    navigation: null,
  },
]

const promptSuggestions = [
  'Show me your projects',
  'What tech stack do you use?',
  'How can I contact you?',
  'Are you available for work?',
]

function loadStoredChatOpen() {
  try {
    return sessionStorage.getItem(CHAT_OPEN_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

function normalizeStoredMessage(message) {
  if (!message || !['user', 'assistant'].includes(message.role) || typeof message.content !== 'string') {
    return null
  }

  if (message.role === 'assistant') {
    const normalizedReply = normalizeAssistantReply({
      message: message.content,
      links: message.links,
      navigation: message.navigation,
      model: message.model,
    })

    return {
      id: Number.isFinite(message.id) ? message.id : Date.now(),
      ...normalizedReply,
    }
  }

  return {
    id: Number.isFinite(message.id) ? message.id : Date.now(),
    role: message.role,
    content: message.content,
    links: Array.isArray(message.links) ? message.links : [],
    navigation: message.navigation || null,
    model: message.model,
  }
}

function loadStoredMessages() {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(CHAT_MESSAGES_STORAGE_KEY) || '[]')
    const storedMessages = Array.isArray(parsed) ? parsed.map(normalizeStoredMessage).filter(Boolean) : []
    return storedMessages.length ? storedMessages : starterMessages
  } catch {
    return starterMessages
  }
}

function getNextMessageId(messages) {
  return messages.reduce((nextId, message) => Math.max(nextId, Number(message.id) + 1 || nextId), 1)
}

function shouldReduceMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
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

function renderInlineMarkdown(text) {
  const parts = String(text).split(/(\*\*[^*]+\*\*|`[^`]+`)/g)

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>
    }

    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={`${part}-${index}`}>{part.slice(1, -1)}</code>
    }

    return part
  })
}

function parseMarkdownBlocks(content) {
  const blocks = []
  const pattern = /```(\w+)?\n([\s\S]*?)```/g
  let lastIndex = 0
  let match = pattern.exec(content)

  while (match) {
    if (match.index > lastIndex) {
      blocks.push({ type: 'text', content: content.slice(lastIndex, match.index) })
    }

    blocks.push({
      type: 'code',
      language: match[1] || 'text',
      code: match[2].replace(/\n$/, ''),
    })
    lastIndex = pattern.lastIndex
    match = pattern.exec(content)
  }

  if (lastIndex < content.length) {
    blocks.push({ type: 'text', content: content.slice(lastIndex) })
  }

  return blocks.filter((block) => block.content?.trim() || block.code?.trim())
}

function TextBlock({ content }) {
  const blocks = String(content)
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)

  return blocks.map((block, index) => {
    const lines = block.split('\n').map((line) => line.trim()).filter(Boolean)
    const isList = lines.every((line) => /^([-*]\s+|\d+\.\s+)/.test(line))

    if (isList) {
      const isOrdered = lines.every((line) => /^\d+\.\s+/.test(line))
      const ListTag = isOrdered ? 'ol' : 'ul'

      return (
        <ListTag key={`${block}-${index}`}>
          {lines.map((line) => (
            <li key={line}>{renderInlineMarkdown(line.replace(/^([-*]\s+|\d+\.\s+)/, ''))}</li>
          ))}
        </ListTag>
      )
    }

    return <p key={`${block}-${index}`}>{renderInlineMarkdown(lines.join(' '))}</p>
  })
}

function CodeBlock({ code, language }) {
  const [isCopied, setIsCopied] = useState(false)

  const handleCopy = async () => {
    await copyText(code)
    setIsCopied(true)
    window.setTimeout(() => setIsCopied(false), 1400)
  }

  return (
    <div className="chat-code-block">
      <div className="chat-code-head">
        <span>{language}</span>
        <button type="button" onClick={handleCopy} aria-label="Copy code">
          {isCopied ? <Check size={15} /> : <Copy size={15} />}
          <span>{isCopied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  )
}

function ChatMessageContent({ content }) {
  const blocks = parseMarkdownBlocks(String(content))

  return (
    <div className="chat-markdown">
      {blocks.map((block, index) => {
        if (block.type === 'code') {
          return <CodeBlock key={`${block.language}-${index}`} code={block.code} language={block.language} />
        }

        return <TextBlock key={`${block.content}-${index}`} content={block.content} />
      })}
    </div>
  )
}

function ChatLinkCard({ link, onOpen }) {
  const [isCopied, setIsCopied] = useState(false)
  const isExternal = link.kind === 'external'

  const handleCopy = async (event) => {
    event.stopPropagation()
    await copyText(link.url)
    setIsCopied(true)
    window.setTimeout(() => setIsCopied(false), 1400)
  }

  return (
    <div className={`chat-link-card chat-link-card-${link.kind || 'external'}`}>
      <button type="button" className="chat-link-open" onClick={() => onOpen(link)} aria-label={`Open ${link.label}`}>
        <span className="chat-link-label-row">
          <span className="chat-link-label">{link.label}</span>
          {isExternal ? <ExternalLink size={15} /> : <ArrowRight size={15} />}
        </span>
        {link.description ? <span className="chat-link-description">{link.description}</span> : null}
        <span className="chat-link-url">{link.displayUrl || link.url}</span>
      </button>
      <button type="button" className="chat-link-copy" onClick={handleCopy} aria-label={`Copy ${link.label} link`}>
        {isCopied ? <Check size={15} /> : <Copy size={15} />}
        <span>{isCopied ? 'Copied' : 'Copy'}</span>
      </button>
    </div>
  )
}

function ChatMessageLinks({ links, onOpenLink }) {
  if (!Array.isArray(links) || !links.length) return null

  return (
    <div className="chat-link-list" aria-label="Related links">
      {links.map((link) => (
        <ChatLinkCard key={link.url} link={link} onOpen={onOpenLink} />
      ))}
    </div>
  )
}

function ChatWidget() {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(() => loadStoredChatOpen())
  const [shouldRenderPanel, setShouldRenderPanel] = useState(() => loadStoredChatOpen())
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState(() => loadStoredMessages())
  const [isTyping, setIsTyping] = useState(false)
  const panelRef = useRef(null)
  const fabRef = useRef(null)
  const messageContainerRef = useRef(null)
  const nextMessageIdRef = useRef(getNextMessageId(messages))
  const panelTransitionIdRef = useRef(0)
  const canSend = useMemo(
    () => input.trim().length > 0 && input.length <= chatConfig.maxMessageLength && !isTyping,
    [input, isTyping],
  )

  useEffect(() => {
    try {
      sessionStorage.setItem(CHAT_OPEN_STORAGE_KEY, String(isOpen))
    } catch {
      // Session persistence is optional.
    }
  }, [isOpen])

  useEffect(() => {
    try {
      sessionStorage.setItem(
        CHAT_MESSAGES_STORAGE_KEY,
        JSON.stringify(messages.slice(-MAX_STORED_MESSAGES)),
      )
    } catch {
      // Session persistence is optional.
    }
  }, [messages])

  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight
    }
  }, [messages, isTyping, isOpen])

  useEffect(() => {
    const handleOpenChat = () => {
      panelTransitionIdRef.current += 1
      setShouldRenderPanel(true)
      setIsOpen(true)
    }

    window.addEventListener('portfolio:open-chat', handleOpenChat)

    return () => {
      window.removeEventListener('portfolio:open-chat', handleOpenChat)
    }
  }, [])

  useEffect(() => {
    if (!isOpen || !panelRef.current || shouldReduceMotion()) return undefined

    animate(panelRef.current, {
      opacity: [0, 1],
      translateY: [18, 0],
      scale: [0.98, 1],
      duration: 320,
      ease: 'outCubic',
    })

    if (fabRef.current) {
      animate(fabRef.current, {
        scale: [0.94, 1],
        duration: 260,
        ease: 'outBack',
      })
    }
  }, [isOpen])

  useEffect(() => {
    if (!messageContainerRef.current || shouldReduceMotion()) return undefined

    const latestMessage = messageContainerRef.current.querySelector('.chat-message:last-of-type')
    if (!latestMessage) return undefined

    const messageAnimation = animate(latestMessage, {
      opacity: [0, 1],
      translateY: [10, 0],
      duration: 260,
      ease: 'outCubic',
    })

    return () => {
      messageAnimation.revert()
    }
  }, [messages, isTyping])

  const sendMessage = async (value) => {
    if (!value) return

    const userMessage = { id: nextMessageIdRef.current, role: 'user', content: value.trim(), links: [] }
    nextMessageIdRef.current += 1
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setInput('')
    setIsTyping(true)

    try {
      const reply = await sendChatMessage(nextMessages)
      const replyId = nextMessageIdRef.current
      nextMessageIdRef.current += 1
      setMessages((prev) => [...prev, { id: replyId, ...reply }])
    } catch {
      const fallbackId = nextMessageIdRef.current
      nextMessageIdRef.current += 1
      setMessages((prev) => [
        ...prev,
        {
          id: fallbackId,
          role: 'assistant',
          content: "I couldn't answer right now. Please try again.",
          links: [],
          navigation: null,
        },
      ])
    } finally {
      setIsTyping(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    await sendMessage(input.trim())
  }

  const openChat = () => {
    panelTransitionIdRef.current += 1
    setShouldRenderPanel(true)
    setIsOpen(true)
  }

  const closeChat = () => {
    if (!panelRef.current || shouldReduceMotion()) {
      setIsOpen(false)
      setShouldRenderPanel(false)
      return
    }

    panelTransitionIdRef.current += 1
    const transitionId = panelTransitionIdRef.current
    setIsOpen(false)
    animate(panelRef.current, {
      opacity: [1, 0],
      translateY: [0, 16],
      scale: [1, 0.98],
      duration: 220,
      ease: 'inCubic',
      onComplete: () => {
        if (transitionId === panelTransitionIdRef.current) {
          setShouldRenderPanel(false)
        }
      },
    })
  }

  const handleOpenLink = (link) => {
    if (link.kind === 'internal') {
      navigate(getInternalRoute(link))
      setShouldRenderPanel(true)
      setIsOpen(true)
      return
    }

    window.open(link.url, '_blank', 'noopener,noreferrer')
    closeChat()
  }

  const toggleChat = () => {
    if (isOpen) {
      closeChat()
      return
    }

    openChat()
  }

  return (
    <div className="chat-shell" aria-live="polite">
      {shouldRenderPanel ? (
        <section className="chat-panel" ref={panelRef} role="dialog" aria-label="Portfolio assistant">
          <header className="chat-header">
            <img className="chat-header-avatar" src={chatConfig.avatar} alt={chatConfig.displayName} />
            <div className="chat-header-copy">
              <p className="chat-title">{chatConfig.title}</p>
              <p className="chat-subtitle">
                <span aria-hidden="true"></span>
                Online
              </p>
            </div>
            <button type="button" className="chat-close-button" onClick={closeChat} aria-label="Close chat">
              <X size={22} />
            </button>
          </header>
          <div className="chat-messages" ref={messageContainerRef}>
            {messages.map((message) => (
              <article key={message.id} className={`chat-message chat-message-${message.role}`}>
                {message.role === 'assistant' ? <p className="chat-message-author">{chatConfig.displayName}</p> : null}
                <div className={`chat-bubble chat-bubble-${message.role}`}>
                  <ChatMessageContent content={message.content} />
                  {message.role === 'assistant' ? (
                    <ChatMessageLinks links={message.links} onOpenLink={handleOpenLink} />
                  ) : null}
                </div>
              </article>
            ))}
            {isTyping ? (
              <article className="chat-message chat-message-assistant">
                <p className="chat-message-author">{chatConfig.displayName}</p>
                <div className="chat-bubble chat-bubble-assistant chat-thinking" aria-label="Assistant is typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </article>
            ) : null}
          </div>
          {messages.length === 1 && !isTyping ? (
            <div className="chat-prompts" aria-label="Suggested prompts">
              {promptSuggestions.map((prompt) => (
                <button key={prompt} type="button" onClick={() => sendMessage(prompt)}>
                  {prompt}
                </button>
              ))}
            </div>
          ) : null}
          <form className="chat-composer" onSubmit={handleSubmit}>
            <div className="chat-composer-row">
              <label htmlFor="chat-input" className="sr-only">
                Type a message
              </label>
              <input
                id="chat-input"
                type="text"
                value={input}
                maxLength={chatConfig.maxMessageLength}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Type a message..."
              />
              <button type="submit" disabled={!canSend} aria-label="Send message">
                <ArrowRight size={24} />
              </button>
            </div>
            <div className="chat-composer-meta">
              <span>{chatConfig.hint}</span>
              <span>
                {input.length}/{chatConfig.maxMessageLength}
              </span>
            </div>
          </form>
        </section>
      ) : null}

      <button
        type="button"
        ref={fabRef}
        className="chat-fab"
        onClick={toggleChat}
        aria-label={isOpen ? 'Close assistant' : 'Open assistant'}
        aria-expanded={isOpen}
      >
        <MessageCircle size={18} />
        <span>{chatConfig.title}</span>
      </button>
    </div>
  )
}

export default ChatWidget
