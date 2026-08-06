import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { CallsService } from '../services/calls.service';
import { ActiveCall, CallStatus, formatCallDuration, isActiveStatus } from '../types/calls.types';
import { useAuth } from './AuthContext';

interface CallContextType {
  activeCall: ActiveCall | null;
  callDuration: number;
  isMuted: boolean;
  error: string | null;
  startCall: (phoneNumber: string, contactId?: string) => Promise<void>;
  hangup: () => Promise<void>;
  mute: () => Promise<void>;
  unmute: () => Promise<void>;
  clearError: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

const TERMINAL_STATUSES = [CallStatus.COMPLETED, CallStatus.FAILED, CallStatus.MISSED, CallStatus.VOICEMAIL];

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { updatePresenceStatus } = useAuth();
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const syncCall = useCallback(async (callId: string) => {
    try {
      const call = await CallsService.getCall(callId);
      setActiveCall(prev => prev ? { ...call, isMuted: prev.isMuted } : null);

      if (TERMINAL_STATUSES.includes(call.status as CallStatus)) {
        clearTimers();
        updatePresenceStatus('ONLINE');
        setTimeout(() => setActiveCall(null), 1500);
        return;
      }

      if (call.status === CallStatus.CONNECTED && call.startedAt) {
        const elapsed = Math.floor((Date.now() - new Date(call.startedAt).getTime()) / 1000);
        setCallDuration(Math.max(0, elapsed));
      }
    } catch {
      // ignore polling errors
    }
  }, [clearTimers, updatePresenceStatus]);

  const startDurationTimer = useCallback((startedAt: string) => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
      setCallDuration(Math.max(0, elapsed));
    }, 1000);
  }, []);

  const startCall = useCallback(async (phoneNumber: string, contactId?: string) => {
    setError(null);
    clearTimers();
    try {
      const call = await CallsService.startCall({ phoneNumber, contactId });
      const active: ActiveCall = { ...call, isMuted: false };
      setActiveCall(active);
      setCallDuration(0);
      setIsMuted(false);
      updatePresenceStatus('ON_CALL');

      pollRef.current = setInterval(() => syncCall(call.id), 1000);

      if (call.status === CallStatus.CONNECTED && call.startedAt) {
        startDurationTimer(call.startedAt);
      }
    } catch (e: any) {
      setError(e.message || 'Impossible de lancer l\'appel.');
      throw e;
    }
  }, [clearTimers, syncCall, startDurationTimer, updatePresenceStatus]);

  const hangup = useCallback(async () => {
    if (!activeCall) return;
    setError(null);
    try {
      await CallsService.hangupCall(activeCall.id);
      clearTimers();
      setActiveCall(null);
      setIsMuted(false);
      setCallDuration(0);
      updatePresenceStatus('ONLINE');
    } catch (e: any) {
      setError(e.message || 'Erreur lors du raccrochage.');
    }
  }, [activeCall, clearTimers, updatePresenceStatus]);

  const mute = useCallback(async () => {
    if (!activeCall) return;
    try {
      await CallsService.muteCall(activeCall.id);
      setIsMuted(true);
      setActiveCall(prev => prev ? { ...prev, isMuted: true } : null);
    } catch (e: any) { setError(e.message); }
  }, [activeCall]);

  const unmute = useCallback(async () => {
    if (!activeCall) return;
    try {
      await CallsService.unmuteCall(activeCall.id);
      setIsMuted(false);
      setActiveCall(prev => prev ? { ...prev, isMuted: false } : null);
    } catch (e: any) { setError(e.message); }
  }, [activeCall]);

  // Démarre le timer quand le statut passe à CONNECTED
  useEffect(() => {
    if (activeCall?.status === CallStatus.CONNECTED && activeCall.startedAt && !timerRef.current) {
      startDurationTimer(activeCall.startedAt);
    }
    if (activeCall && !isActiveStatus(activeCall.status)) {
      clearTimers();
    }
  }, [activeCall?.status, activeCall?.startedAt, startDurationTimer, clearTimers]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  return (
    <CallContext.Provider value={{
      activeCall, callDuration, isMuted, error,
      startCall, hangup, mute, unmute,
      clearError: () => setError(null),
    }}>
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error('useCall doit être utilisé dans un CallProvider');
  return ctx;
};

export { formatCallDuration };
