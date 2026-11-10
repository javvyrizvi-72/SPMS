import { useEffect, useRef, useState } from 'react'
import { MessageCircle, X, Send, Bot, Sparkles } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { sendChat, getChatInfo, getErrorMessage } from '../../services/api'

const DEFAULT_SUGGESTIONS = {
  guest: ['How do I register?', 'Show available jobs', 'What is PlaceMe?'],
  student: ['Which jobs am I eligible for?', 'Show my applications', 'Do I have any interviews?', 'How do I upload my resume?'],
  company: ['How many applicants do I have?', 'How do I post a job?', 'How do I schedule an interview?'],
  admin: ['Show platform statistics', 'Any pending approvals?', 'How do I approve a company?'],
}

const greeting = (user) =>
  `Hi${user ? ` ${user.name.split(' ')[0]}` : ''}! I'm the PlaceMe Assistant. ${
    !user ? 'Ask me how to register or what jobs are open.'
      : user.role === 'student' ? 'I can show jobs you are eligible for, your applications and interviews.'
      : user.role === 'company' ? 'I can help with posting jobs, applicants and interviews.'
      : 'I can show platform statistics and explain approvals.'
  }`

const ChatBot = () => {
  const { user } = useAuth()
  const role = user?.role || 'guest'
  const storeKey = `placeme-chat-${user?._id || 'guest'}`
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState(DEFAULT_SUGGESTIONS[role])
  const [mode, setMode] = useState(null)
  const endRef = useRef(null)
  const inputRef = useRef(null)

  // separate conversation per user (guest, each logged-in user)
  useEffect(() => {
    let saved = null
    try { saved = JSON.parse(sessionStorage.getItem(storeKey)) } catch { /* ignore */ }
    setMessages(saved?.length ? saved : [{ role: 'bot', text: greeting(user) }])
    setSuggestions(DEFAULT_SUGGESTIONS[role])
  }, [storeKey]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (messages.length) sessionStorage.setItem(storeKey, JSON.stringify(messages.slice(-30)))
  }, [messages, storeKey])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading, open])

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
    if (mode === null) getChatInfo().then(({ data }) => setMode(data.mode)).catch(() => {})
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const send = async (text) => {
    const msg = (text ?? input).trim()
    if (!msg || loading) return
    const history = messages.filter((m) => !m.error).slice(-8).map((m) => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.text }))
    setMessages((prev) => [...prev, { role: 'user', text: msg }])
    setInput('')
    setLoading(true)
    try {
      const { data } = await sendChat(msg, history)
      setMessages((prev) => [...prev, { role: 'bot', text: data.reply }])
      if (data.suggestions?.length) setSuggestions(data.suggestions)
      if (data.mode) setMode(data.mode === 'ai' ? 'ai' : 'basic')
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'bot', error: true, text: getErrorMessage(err, 'The assistant is unavailable right now.') }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {open && (
        <div className="fixed z-[60] bottom-24 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[380px] h-[520px] max-h-[75vh] bg-navy-800 border border-navy-600 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
          <div className="h-[3px] bg-gradient-to-r from-gold-600 via-gold-300 to-gold-600" />
          <div className="flex items-center gap-3 px-4 py-3 bg-navy-900 border-b border-navy-700">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold-300 to-gold-600 flex items-center justify-center">
              <Bot size={20} className="text-navy-950" />
            </div>
            <div className="flex-1 leading-tight">
              <p className="font-semibold text-white text-sm">PlaceMe Assistant</p>
              <p className="text-[11px] text-navy-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                {mode === 'ai' ? <><Sparkles size={10} className="text-gold-400" /> AI mode</> : 'Online · quick-help mode'}
              </p>
            </div>
            <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-navy-700 text-navy-300" aria-label="Close chat">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                  m.role === 'user'
                    ? 'bg-gradient-to-r from-gold-400 to-gold-500 text-navy-950 rounded-br-sm font-medium'
                    : m.error ? 'bg-red-500/10 text-red-300 border border-red-500/30 rounded-bl-sm'
                    : 'bg-navy-700 text-navy-100 rounded-bl-sm'
                }`}>{m.text}</div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-navy-700 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
                  {[0, 1, 2].map((d) => <span key={d} className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-bounce" style={{ animationDelay: `${d * 0.15}s` }} />)}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="px-3 pt-2 flex gap-2 overflow-x-auto">
            {suggestions.map((s) => (
              <button key={s} onClick={() => send(s)} disabled={loading}
                className="shrink-0 text-xs px-3 py-1.5 rounded-full border border-gold-500/40 text-gold-300 hover:bg-gold-500/10 transition-colors disabled:opacity-50">
                {s}
              </button>
            ))}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); send() }} className="p-3 flex gap-2">
            <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} maxLength={500}
              placeholder="Ask about jobs, applications..." className="input-field !py-2 text-sm" />
            <button type="submit" disabled={loading || !input.trim()} className="btn-primary !px-3.5" aria-label="Send">
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      <button onClick={() => setOpen((o) => !o)} aria-label={open ? 'Close assistant' : 'Open assistant'}
        className="fixed z-[60] bottom-5 right-4 sm:right-6 w-14 h-14 rounded-full bg-gradient-to-br from-gold-300 to-gold-600 text-navy-950 shadow-gold flex items-center justify-center hover:scale-105 transition-transform">
        {open ? <X size={24} /> : <MessageCircle size={26} />}
      </button>
    </>
  )
}

export default ChatBot
