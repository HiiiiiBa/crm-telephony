import { TelephonyProvider } from './telephony.types.js';
import { MockTelephonyProvider } from './mock.telephony.provider.js';

let provider: TelephonyProvider = new MockTelephonyProvider();

export const getTelephonyProvider = (): TelephonyProvider => provider;

/** Permet d'injecter un provider alternatif (ex. Twilio) en tests ou en production. */
export const setTelephonyProvider = (p: TelephonyProvider): void => {
  provider = p;
};

export const initTelephonyProvider = (onStatusChange: Parameters<TelephonyProvider['setStatusChangeHandler']>[0]): void => {
  provider.setStatusChangeHandler(onStatusChange);
};
