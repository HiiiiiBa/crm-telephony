import { CallStatus } from '../types/enums.js';

export type StatusChangeHandler = (callId: string, status: CallStatus) => Promise<void>;

export interface TelephonyProvider {
  setStatusChangeHandler(handler: StatusChangeHandler): void;
  initiateCall(callId: string, fromNumber: string, toNumber: string): Promise<void>;
  hangupCall(callId: string): Promise<void>;
  muteCall(callId: string): Promise<void>;
  unmuteCall(callId: string): Promise<void>;
  getCallStatus(callId: string): CallStatus | null;
  isMuted(callId: string): boolean;
}

export interface ActiveProviderCall {
  status: CallStatus;
  muted: boolean;
  fromNumber: string;
  toNumber: string;
}
