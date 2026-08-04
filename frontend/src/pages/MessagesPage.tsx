import React, { useState } from 'react';
import { Send, User, MessageSquare } from 'lucide-react';

export const MessagesPage: React.FC = () => {
  const [selectedContact, setSelectedContact] = useState('Sophie Martin');
  const [messageInput, setMessageInput] = useState('');

  const conversations = [
    { name: 'Sophie Martin', phone: '+33 6 12 34 56 78', lastMsg: 'Bonjour, avez-vous pu réviser notre proposition ?', time: '10:45' },
    { name: 'Alexandre Dubois', phone: '+33 6 98 76 54 32', lastMsg: 'Merci pour le rappel rapide.', time: 'Hier' },
  ];

  return (
    <div className="h-[calc(100vh-7rem)] flex rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md overflow-hidden">
      {/* Conversations List */}
      <div className="w-80 border-r border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-800">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-400" />
            Conversations SMS
          </h3>
        </div>
        <div className="divide-y divide-slate-800/60 overflow-y-auto flex-1">
          {conversations.map((c) => (
            <button
              key={c.name}
              onClick={() => setSelectedContact(c.name)}
              className={`w-full p-3.5 text-left transition flex items-start gap-3 ${
                selectedContact === c.name ? 'bg-indigo-600/10 border-l-2 border-indigo-500' : 'hover:bg-slate-800/40'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 font-semibold text-xs">
                <User className="w-4 h-4" />
              </div>
              <div className="overflow-hidden flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200">{c.name}</span>
                  <span className="text-[10px] text-slate-500">{c.time}</span>
                </div>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">{c.lastMsg}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Active Conversation Chat area */}
      <div className="flex-1 flex flex-col bg-slate-950/40">
        {/* Chat header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
          <div>
            <h4 className="text-xs font-bold text-slate-100">{selectedContact}</h4>
            <p className="text-[10px] text-indigo-400 font-mono">+33 6 12 34 56 78</p>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Prêt pour Twilio SMS
          </span>
        </div>

        {/* Message Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          <div className="max-w-xs p-3 rounded-2xl bg-slate-800 text-slate-200 text-xs self-start border border-slate-700/50">
            Bonjour, nous souhaiterions confirmer notre RDV de démonstration.
          </div>
          <div className="max-w-xs p-3 rounded-2xl bg-indigo-600 text-white text-xs ml-auto shadow-md">
            Bonjour Sophie ! Parfait, la démo aura lieu aujourd'hui à 14h30.
          </div>
        </div>

        {/* Message Input Box */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/60 flex items-center gap-2">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Saisir votre SMS..."
            className="flex-1 px-4 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
          />
          <button className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-md shadow-indigo-600/30">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
