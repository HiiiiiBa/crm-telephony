import { CallStatus } from '../types/enums.js';
import { TelephonyProvider, StatusChangeHandler, ActiveProviderCall } from './telephony.types.js';

const CONNECT_DELAY_MS = 1500;

/**
 * Provider de développement simulant le cycle de vie d'un appel.
 * Remplaçable par TwilioVoiceProvider sans modifier CallsService.
 */
export class MockTelephonyProvider implements TelephonyProvider {
  private calls = new Map<string, ActiveProviderCall>();
  private onStatusChange?: StatusChangeHandler;

  setStatusChangeHandler(handler: StatusChangeHandler): void {
    this.onStatusChange = handler;
  }

  async initiateCall(callId: string, fromNumber: string, toNumber: string): Promise<void> {
    this.calls.set(callId, {
      status: CallStatus.RINGING,
      muted: false,
      fromNumber,
      toNumber,
    });

    // Simule la connexion après un court délai
    setTimeout(async () => {
      const call = this.calls.get(callId);
      if (call && call.status === CallStatus.RINGING) {
        call.status = CallStatus.CONNECTED;
        await this.onStatusChange?.(callId, CallStatus.CONNECTED);
      }
    }, CONNECT_DELAY_MS);
  }

  async hangupCall(callId: string): Promise<void> {
    const call = this.calls.get(callId);
    if (call) {
      call.status = CallStatus.COMPLETED;
    }
    this.calls.delete(callId);
  }

  async muteCall(callId: string): Promise<void> {
    const call = this.calls.get(callId);
    if (call) call.muted = true;
  }

  async unmuteCall(callId: string): Promise<void> {
    const call = this.calls.get(callId);
    if (call) call.muted = false;
  }

  getCallStatus(callId: string): CallStatus | null {
    return this.calls.get(callId)?.status ?? null;
  }

  isMuted(callId: string): boolean {
    return this.calls.get(callId)?.muted ?? false;
  }

  /** Utilitaire test : simuler un échec d'appel */
  async simulateFailure(callId: string): Promise<void> {
    const call = this.calls.get(callId);
    if (call) {
      call.status = CallStatus.FAILED;
      await this.onStatusChange?.(callId, CallStatus.FAILED);
      this.calls.delete(callId);
    }
  }
}
