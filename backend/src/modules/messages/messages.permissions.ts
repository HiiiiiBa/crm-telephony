import { buildContactVisibilityFilter } from '../contacts/contacts.permissions.js';
import { AuthContext } from './messages.types.js';

/** Visibilité SMS via les contacts assignés (même règles que les contacts). */
export async function buildMessageContactFilter(auth: AuthContext): Promise<Record<string, unknown>> {
  return buildContactVisibilityFilter(auth);
}
