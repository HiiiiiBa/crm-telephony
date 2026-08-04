import React, { useState } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Delete, X, User } from 'lucide-react';

interface PersistentDialerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PersistentDialer: React.FC<PersistentDialerProps> = ({ isOpen, onClose }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isCalling, setIsCalling] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  if (!isOpen) return null;

  const handleKeyPress = (digit: string) => {
    setPhoneNumber((prev) => prev + digit);
  };

  const handleDelete = () => {
    setPhoneNumber((prev) => prev.slice(0, -1));
  };

  const handleCall = () => {
    if (!phoneNumber) return;
    setIsCalling(true);
  };

  const handleHangup = () => {
    setIsCalling(false);
    setIsMuted(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl shadow-slate-950/80 backdrop-blur-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header bar */}
      <div className="px-4 py-3 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-slate-200">Dialer Téléphonie</span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-700/50 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Screen / Number Display */}
      <div className="p-4 text-center bg-slate-950/60 border-b border-slate-800/80">
        {isCalling ? (
          <div className="space-y-1 py-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center animate-pulse">
              <User className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-100">{phoneNumber}</p>
            <p className="text-[11px] text-emerald-400 font-medium">Appel en cours... 00:12</p>
          </div>
        ) : (
          <div className="relative py-2 flex items-center justify-between px-2">
            <input
              type="text"
              readOnly
              value={phoneNumber}
              placeholder="Composer un numéro..."
              className="w-full text-center bg-transparent text-lg font-bold text-slate-100 focus:outline-none placeholder-slate-600 tracking-wider"
            />
            {phoneNumber && (
              <button
                onClick={handleDelete}
                className="text-slate-400 hover:text-rose-400 p-1 transition"
              >
                <Delete className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Keypad */}
      {!isCalling ? (
        <div className="p-4 grid grid-cols-3 gap-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((digit) => (
            <button
              key={digit}
              onClick={() => handleKeyPress(digit)}
              className="h-11 rounded-xl bg-slate-800/60 hover:bg-indigo-600/30 hover:border-indigo-500/50 border border-slate-700/50 text-slate-200 font-semibold text-base transition duration-150 flex flex-col items-center justify-center active:scale-95"
            >
              {digit}
            </button>
          ))}
        </div>
      ) : null}

      {/* Control Actions */}
      <div className="p-4 bg-slate-900 flex items-center justify-center gap-4">
        {isCalling ? (
          <>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition ${
                isMuted
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <button
              onClick={handleHangup}
              className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 transition transform active:scale-95"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </>
        ) : (
          <button
            onClick={handleCall}
            disabled={!phoneNumber}
            className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm transition ${
              phoneNumber
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Phone className="w-4 h-4" />
            <span>Lancer l'appel</span>
          </button>
        )}
      </div>
    </div>
  );
};
