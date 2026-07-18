/**
 * Attendee status state machine for event RSVP.
 * Defines valid transitions between CONFIRMED, WAITLIST, and CANCELLED states.
 */

const validTransitions = {
  null: ['CONFIRMED', 'WAITLIST'],
  CONFIRMED: ['CANCELLED'],
  WAITLIST: ['CANCELLED', 'CONFIRMED'],
  CANCELLED: ['CONFIRMED', 'WAITLIST'],
};

/**
 * Checks if a transition from one status to another is valid.
 * @param {string|null} fromStatus - Current status (null for new registration)
 * @param {string} toStatus - Target status
 * @returns {boolean} True if transition is valid
 */
export const canTransition = (fromStatus, toStatus) => {
  const key = fromStatus === null || fromStatus === undefined ? 'null' : fromStatus;
  const allowed = validTransitions[key];
  if (!allowed) return false;
  return allowed.includes(toStatus);
};

/**
 * Returns the list of allowed next states from a given status.
 * @param {string|null} currentStatus - Current status (null for new registration)
 * @returns {string[]} Array of valid target states
 */
export const getAllowedNextStates = (currentStatus) => {
  const key = currentStatus === null || currentStatus === undefined ? 'null' : currentStatus;
  return validTransitions[key] || [];
};

