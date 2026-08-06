import { SmsProvider } from './sms.types.js';
import { MockSmsProvider } from './mock.sms.provider.js';

let provider: SmsProvider = new MockSmsProvider();

export const getSmsProvider = (): SmsProvider => provider;

export const setSmsProvider = (p: SmsProvider): void => {
  provider = p;
};

export const initSmsProvider = (): void => {
  provider = new MockSmsProvider();
};
