/**
 * Attendee status state machine for event RSVP.
 * Defines valid transitions between CONFIRMED, WAITLIST, and CANCELLED states.
 */

export const validTransitions = {
  null: ['CONFIRMED', 'WAITLIST'] as const,
  CONFIRMED: ['CANCELLED'] as const,
  WAITLIST: ['CANCELLED', 'CONFIRMED'] as const,
  CANCELLED: ['CONFIRMED', 'WAITLIST'] as const,
} as const;

export type ValidTransitions = typeof validTransitions;

export const canTransition = (
  fromStatus: string | null,
  toStatus: string
): boolean => {
  const key =
    fromStatus === null || fromStatus === undefined ? 'null' : fromStatus;
  const allowed = validTransitions[key];
  if (!allowed) return false;
  return allowed.includes(toStatus);
};

/**
 * Returns the list of allowed next states from a given status.
 * @param {string|null} currentStatus - Current status (null for new registration)
 * @returns {string[]} Array of valid target states
 */
export const getAllowedNextStates = (
  currentStatus: string | null
): string[] => {
  const key =
    currentStatus === null || currentStatus === undefined
      ? 'null'
      : currentStatus;
  return validTransitions[key] || [];
};
