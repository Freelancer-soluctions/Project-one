import { describe, it, expect } from 'vitest';
import { selectableCatalogItems } from './catalog-options.js';

const ITEMS = [
  { id: 1, name: 'Analista', active: true },
  { id: 2, name: 'Retirado', active: false },
  { id: 3, name: 'Gerente', active: true },
];

describe('selectableCatalogItems', () => {
  it('offers only active catalog rows', () => {
    expect(selectableCatalogItems(ITEMS, undefined).map((i) => i.id)).toEqual([
      1, 3,
    ]);
  });

  it('keeps an inactive row when it is the employee current value', () => {
    expect(selectableCatalogItems(ITEMS, 2).map((i) => i.id)).toEqual([
      1, 2, 3,
    ]);
  });

  it('matches the current value whether it is a number or a string', () => {
    expect(selectableCatalogItems(ITEMS, '2').map((i) => i.id)).toContain(2);
  });

  it('treats rows without an active flag as selectable', () => {
    const legacy = [{ id: 9, name: 'Sin flag' }];
    expect(selectableCatalogItems(legacy, undefined)).toEqual(legacy);
  });
});
