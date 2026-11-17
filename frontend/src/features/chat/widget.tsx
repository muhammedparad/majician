import { useEffect, useRef, useState, type FormEvent } from 'react';
import { api } from '../../api/client';
import { Spinner } from '../motion/primitives';

type ChatMessage = { role: 'user' | 'model'; text: string };
type ChatResponse = { answer: string; provider?: 'gemini' | 'faq' };

const SUGGESTIONS = [
  'How do animal shares work?',
  'How can I pay installments?',
  'How do I track my animal?',
  'How do I connect Telegram?',
];

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [provider, setProvider] = useState<'gemini' | 'faq' | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    inputRef.current?.focus();
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, busy, open]);

  async function send(raw: string) {
    const message = raw.trim();
    if (!message || busy) return;
    const history = messages.slice(-10);
    setError('');
    setBusy(true);
    setQuestion('');
    setMessages(previous => [...previous.slice(-18), { role: 'user', text: message }]);
    try {
      const result = await api<ChatResponse>(
        '/chatbot/message',
        'POST',
        history.length ? { message, history } : { message },
        true,
      );
      if (result.provider) setProvider(result.provider);
      setMessages(previous => [...previous.slice(-19), { role: 'model', text: result.answer }]);
    } catch (err) {
      setMessages(previous => previous.slice(0, -1));
      setQuestion(message);
      setError(err instanceof Error ? err.message : 'Could not reach the assistant. Please try again.');
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void send(question);
  }

  return <aside className="chat">
    {open && <section className="panel chat-panel" aria-label="Udhiyya Assistant">
      <div className="chat-head">
        <div>
          <h2>Udhiyya Assistant</h2>
          <span className="chat-sub">{provider === 'faq' ? 'Quick Help' : 'Powered by Gemini'}</span>
        </div>
        <div className="chat-head-actions">
          {messages.length > 0 && <button type="button" className="chat-link" onClick={() => { setMessages([]); setError(''); }}>Clear</button>}
          <button type="button" className="chat-close" aria-label="Close assistant" onClick={() => setOpen(false)}>×</button>
        </div>
      </div>

      <div className="messages chat-messages" ref={listRef} aria-live="polite">
        {!messages.length ? <div className="chat-empty">
          <p>Ask about Udhiyya programs, shares, installments, animal tracking, meat distribution, or your account.</p>
          <div className="chat-chips">
            {SUGGESTIONS.map(prompt => (
              <button key={prompt} type="button" className="chat-chip" disabled={busy} onClick={() => void send(prompt)}>
                {prompt}
              </button>
            ))}
          </div>
        </div> : messages.map((item, index) => (
          <div key={index} className={item.role === 'user' ? 'chat-row user' : 'chat-row model'}>
            <p className={item.role === 'user' ? 'chat-bubble chat-question' : 'chat-bubble chat-answer'}>
              {item.text}
            </p>
          </div>
        ))}
        {busy && <div className="chat-row model">
          <p className="chat-bubble chat-answer chat-typing"><Spinner /> <span>Thinking…</span></p>
        </div>}
      </div>

      {error && <p className="notice error" role="alert">{error}</p>}

      <form onSubmit={handleSubmit} className="chat-form">
        <label className="sr-only" htmlFor="chat-input">Your question</label>
        <input
          id="chat-input"
          ref={inputRef}
          name="message"
          type="text"
          maxLength={500}
          placeholder="Ask a question…"
          value={question}
          disabled={busy}
          onChange={event => setQuestion(event.target.value)}
        />
        <button type="submit" disabled={busy || !question.trim()}>
          {busy ? '…' : 'Send'}
        </button>
      </form>
    </section>}
    <button type="button" onClick={() => setOpen(value => !value)} aria-expanded={open}>
      {open ? 'Close help' : 'Ask AI'}
    </button>
  </aside>;
}

