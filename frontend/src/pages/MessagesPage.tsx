import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Send, User, MessageSquare, Loader2, ExternalLink } from 'lucide-react';
import {
  ConversationSummary,
  Message,
  MessageDirection,
  formatMessageDate,
} from '../types/messages.types';
import { MessagesService } from '../services/messages.service';

const formatConversationTime = (date: string): string => {
  const d = new Date(date);
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  if (isToday) {
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return 'Hier';

  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
};

const contactDisplayName = (c: ConversationSummary['contact']): string =>
  `${c.firstName} ${c.lastName}`.trim();

export const MessagesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialContactId = searchParams.get('contactId');

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(initialContactId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedConversation = conversations.find(c => c.contact.id === selectedContactId);

  const loadConversations = useCallback(async () => {
    setLoadingConversations(true);
    setError(null);
    try {
      const data = await MessagesService.getConversations();
      setConversations(data);
      setSelectedContactId(prev => {
        if (initialContactId && data.some(c => c.contact.id === initialContactId)) {
          return initialContactId;
        }
        if (prev && data.some(c => c.contact.id === prev)) {
          return prev;
        }
        return data.length > 0 ? data[0].contact.id : null;
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Impossible de charger les conversations.';
      setError(msg);
    } finally {
      setLoadingConversations(false);
    }
  }, [initialContactId]);

  const loadMessages = useCallback(async (contactId: string) => {
    setLoadingMessages(true);
    setError(null);
    try {
      const data = await MessagesService.getContactMessages(contactId);
      setMessages(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Impossible de charger les messages.';
      setError(msg);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (selectedContactId) {
      loadMessages(selectedContactId);
    } else {
      setMessages([]);
    }
  }, [selectedContactId, loadMessages]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContactId) return;
    const text = messageInput.trim();
    if (!text) return;

    setSending(true);
    setError(null);
    try {
      await MessagesService.sendMessage({ contactId: selectedContactId, content: text });
      setMessageInput('');
      await loadMessages(selectedContactId);
      await loadConversations();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Impossible d\'envoyer le SMS.';
      setError(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-[calc(100vh-7rem)] flex rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md overflow-hidden">
      <div className="w-80 border-r border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-800">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-400" />
            Conversations SMS
          </h3>
        </div>
        <div className="divide-y divide-slate-800/60 overflow-y-auto flex-1">
          {loadingConversations ? (
            <div className="flex items-center justify-center py-12 text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="p-4 text-xs text-slate-500 text-center">
              Aucune conversation. Envoyez un SMS depuis une fiche contact pour démarrer.
            </p>
          ) : (
            conversations.map(c => {
              const name = contactDisplayName(c.contact);
              const isSelected = selectedContactId === c.contact.id;
              return (
                <button
                  key={c.contact.id}
                  type="button"
                  onClick={() => setSelectedContactId(c.contact.id)}
                  className={`w-full p-3.5 text-left transition flex items-start gap-3 ${
                    isSelected ? 'bg-indigo-600/10 border-l-2 border-indigo-500' : 'hover:bg-slate-800/40'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 font-semibold text-xs shrink-0">
                    {c.contact.firstName.charAt(0)}
                    {c.contact.lastName.charAt(0)}
                  </div>
                  <div className="overflow-hidden flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-200 truncate">{name}</span>
                      <span className="text-[10px] text-slate-500 shrink-0">
                        {formatConversationTime(c.lastMessage.createdAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{c.lastMessage.content}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-slate-950/40 min-w-0">
        {!selectedConversation ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-2">
            <User className="w-10 h-10 opacity-40" />
            <p className="text-xs">Sélectionnez une conversation ou envoyez un SMS depuis un contact.</p>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/40 gap-3">
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-100 truncate">
                  {contactDisplayName(selectedConversation.contact)}
                </h4>
                <p className="text-[10px] text-indigo-400 font-mono truncate">
                  {selectedConversation.contact.phone}
                </p>
              </div>
              <Link
                to={`/contacts/${selectedConversation.contact.id}?sms=1`}
                className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-slate-400 hover:text-indigo-400 hover:bg-slate-800/60 transition"
                title="Voir la fiche contact"
              >
                <ExternalLink className="w-3 h-3" />
                Fiche
              </Link>
            </div>

            <div ref={listRef} className="flex-1 p-4 overflow-y-auto space-y-3">
              {loadingMessages ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
                </div>
              ) : messages.length === 0 ? (
                <p className="text-center text-xs text-slate-500 py-8">Aucun message dans cette conversation.</p>
              ) : (
                messages.map(msg => {
                  const isOutbound = msg.direction === MessageDirection.OUTBOUND;
                  return (
                    <div
                      key={msg.id}
                      className={`max-w-xs p-3 rounded-2xl text-xs ${
                        isOutbound
                          ? 'ml-auto bg-indigo-600 text-white shadow-md rounded-br-sm'
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

            {error && <p className="px-4 text-[11px] text-rose-400">{error}</p>}

            <form onSubmit={handleSend} className="p-3 border-t border-slate-800 bg-slate-900/60 flex items-center gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={e => setMessageInput(e.target.value)}
                placeholder="Saisir votre SMS..."
                maxLength={1600}
                disabled={sending}
                className="flex-1 px-4 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={sending || !messageInput.trim()}
                className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-md shadow-indigo-600/30 disabled:opacity-50"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
