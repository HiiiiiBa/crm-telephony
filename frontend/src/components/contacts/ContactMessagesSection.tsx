import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import { Message, MessageDirection, formatMessageDate } from '../../types/messages.types';
import { MessagesService } from '../../services/messages.service';

interface ContactMessagesSectionProps {
  contactId: string;
  contactName: string;
  messages: Message[];
  onMessageSent: () => void;
  autoFocus?: boolean;
}

export const ContactMessagesSection: React.FC<ContactMessagesSectionProps> = ({
  contactId,
  contactName,
  messages,
  onMessageSent,
  autoFocus = false,
}) => {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = content.trim();
    if (!text) return;

    setSending(true);
    setError(null);
    try {
      await MessagesService.sendMessage({ contactId, content: text });
      setContent('');
      onMessageSent();
    } catch (err: any) {
      setError(err.message || 'Impossible d\'envoyer le SMS.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
      <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-cyan-400" />
        Messages SMS — {contactName}
      </h3>

      <div
        ref={listRef}
        className="max-h-64 overflow-y-auto space-y-2 p-3 rounded-xl bg-slate-950/50 border border-slate-800"
      >
        {messages.length === 0 ? (
          <p className="text-center text-xs text-slate-500 py-4">Aucun message échangé pour l&apos;instant.</p>
        ) : (
          messages.map(msg => {
            const isOutbound = msg.direction === MessageDirection.OUTBOUND;
            return (
              <div
                key={msg.id}
                className={`max-w-[85%] p-2.5 rounded-xl text-xs ${
                  isOutbound
                    ? 'ml-auto bg-indigo-600 text-white rounded-br-sm'
                    : 'mr-auto bg-slate-800 text-slate-200 border border-slate-700/50 rounded-bl-sm'
                }`}
              >
                <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                <p className={`text-[9px] mt-1 ${isOutbound ? 'text-indigo-200/70' : 'text-slate-500'}`}>
                  {formatMessageDate(msg.createdAt)}
                  {isOutbound && msg.agent ? ` · ${msg.agent.firstName}` : ''}
                </p>
              </div>
            );
          })
        )}
      </div>

      {error && <p className="text-[11px] text-rose-400">{error}</p>}

      <form onSubmit={handleSend} className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Saisir un SMS..."
          maxLength={1600}
          disabled={sending}
          className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={sending || !content.trim()}
          className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition disabled:opacity-50 shadow-md shadow-indigo-600/30"
          title="Envoyer SMS"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
};
