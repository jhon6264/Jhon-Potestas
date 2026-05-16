import { useEffect, useMemo, useRef, useState } from 'react'
import { animate } from 'animejs'
import { ArrowRight, Check, Copy, MessageCircle, X } from 'lucide-react'
import { chatConfig } from '../../data/chatConfig'
import { sendChatMessage } from '../../services/chatClient'

const starterMessages = [
  {
    id: 1,
    role: 'assistant',
    content: chatConfig.introMessage,
  },
]

const promptSuggestions = [
  'Show me your projects',
  'What tech stack do you use?',
  'How can I contact you?',
  'Are you available for work?',
]

function shouldReduceMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
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
    await navigator.clipboard.writeText(code)
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

function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [shouldRenderPanel, setShouldRenderPanel] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState(starterMessages)
  const [isTyping, setIsTyping] = useState(false)
  const panelRef = useRef(null)
  const fabRef = useRef(null)
  const messageContainerRef = useRef(null)
  const nextMessageIdRef = useRef(2)
  const panelTransitionIdRef = useRef(0)
  const canSend = useMemo(
    () => input.trim().length > 0 && input.length <= chatConfig.maxMessageLength && !isTyping,
    [input, isTyping],
  )

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

    const userMessage = { id: nextMessageIdRef.current, role: 'user', content: value.trim() }
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
          content: 'The chat service is not available right now. Please try again later.',
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
