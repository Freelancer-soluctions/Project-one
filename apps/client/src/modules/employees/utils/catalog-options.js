/**
 * Options offered by a position/department select.
 *
 * Inactive catalog rows are hidden from new assignments, but the employee's
 * current value stays selectable so an existing link is never shown as blank.
 *
 * @param {Array<{id: number, name: string, active?: boolean}>} items - Catalog rows from the options endpoint.
 * @param {number|string|null|undefined} currentValue - The employee's current catalog id.
 * @returns {Array} Rows the select should offer.
 */
export const selectableCatalogItems = (items, currentValue) =>
  items.filter(
    (item) =>
      item.active !== false ||
      (currentValue != null && String(item.id) === String(currentValue))
  );
