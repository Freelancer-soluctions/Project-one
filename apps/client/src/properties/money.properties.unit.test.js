import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { sumLineItems } from '@/utils/money';
import { currencyFormatter } from '@/modules/products/utils/currencyFormat';

/**
 * Propiedades del cálculo monetario REAL del repo (change `pbt-hardening`,
 * tarea 2.2). El SUT es `sumLineItems` — el mismo helper que usan
 * `SalesDialog` y `PurchaseDialog` para el campo `total` — más el formateador
 * `currencyFormatter` (es-MX/MXN) que pinta los importes.
 *
 * Los importes se generan como enteros para que la aritmética sea exacta en
 * punto flotante: así la propiedad de aditividad puede exigir igualdad estricta
 * en lugar de tolerancias que ocultarían bugs reales de acumulación.
 */

const priceArb = fc.integer({ min: 0, max: 100_000 });
const quantityArb = fc.integer({ min: 0, max: 1_000 });
const lineArb = fc.record({ price: priceArb, quantity: quantityArb });
const linesArb = fc.array(lineArb, { maxLength: 20 });

describe('sumLineItems properties', () => {
  it('an empty detail has zero total', () => {
    fc.assert(
      fc.property(linesArb, (lines) => {
        if (lines.length > 0) return;
        expect(sumLineItems(lines)).toBe(0);
      }),
      { examples: [[[]]] }
    );
  });

  it('a detail of non-negative prices and quantities never totals negative', () => {
    fc.assert(
      fc.property(linesArb, (lines) => {
        expect(sumLineItems(lines)).toBeGreaterThanOrEqual(0);
      })
    );
  });

  it('the total is additive over concatenation', () => {
    fc.assert(
      fc.property(linesArb, linesArb, (left, right) => {
        expect(sumLineItems([...left, ...right])).toBe(
          sumLineItems(left) + sumLineItems(right)
        );
      }),
      {
        examples: [
          // Contraejemplo histórico: la suma ingenua de 0.1 × 3 acumula error
          // binario, y sólo el redondeo a centavos del diálogo (toFixed(2)) lo
          // neutraliza. Se fija aquí como regresión.
          [[{ price: 0.1, quantity: 3 }], []],
        ],
      }
    );
  });

  it('a line totals the same as its quantity of single-unit lines', () => {
    fc.assert(
      fc.property(
        priceArb,
        fc.integer({ min: 0, max: 50 }),
        (price, quantity) => {
          const singleUnits = Array.from({ length: quantity }, () => ({
            price,
            quantity: 1,
          }));
          expect(sumLineItems([{ price, quantity }])).toBe(
            sumLineItems(singleUnits)
          );
        }
      ),
      {
        // Ley multiplicativa: 3 unidades de 0.1 no es `0.1 + 3`.
        examples: [
          [0.1, 3],
          [0, 10],
        ],
      }
    );
  });

  it('a zero price contributes nothing regardless of the quantity', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100_000 }), (quantity) => {
        expect(sumLineItems([{ price: 0, quantity }])).toBe(0);
      })
    );
  });

  it('numeric strings coming from the form inputs total the same as numbers', () => {
    fc.assert(
      fc.property(linesArb, (lines) => {
        const asStrings = lines.map((line) => ({
          price: String(line.price),
          quantity: String(line.quantity),
        }));
        expect(sumLineItems(asStrings)).toBe(sumLineItems(lines));
      })
    );
  });

  it('rows without a usable price or quantity contribute zero', () => {
    const unusable = fc.oneof(
      fc.constant(undefined),
      fc.constant(null),
      fc.constant(''),
      fc.constant('not-a-number'),
      fc.constant(Number.NaN)
    );

    fc.assert(
      fc.property(
        linesArb,
        fc.record({ price: priceArb, quantity: quantityArb }),
        unusable,
        unusable,
        (validLines, validLine, badPrice, badQuantity) => {
          const expected = sumLineItems(validLines);
          const withBrokenPrice = [
            ...validLines,
            { price: badPrice, quantity: validLine.quantity },
          ];
          const withBrokenQuantity = [
            ...validLines,
            { price: validLine.price, quantity: badQuantity },
          ];

          expect(sumLineItems(withBrokenPrice)).toBe(expected);
          expect(sumLineItems(withBrokenQuantity)).toBe(expected);
          expect(Number.isNaN(sumLineItems(withBrokenPrice))).toBe(false);
        }
      )
    );
  });

  it('rounding to cents always yields a value with at most two decimals', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            price: fc.integer({ min: 0, max: 100_000 }),
            quantity: fc.integer({ min: 0, max: 1_000 }),
          }),
          { maxLength: 20 }
        ),
        (lines) => {
          const total = Number(sumLineItems(lines).toFixed(2));
          expect(Math.abs(Math.round(total * 100) - total * 100)).toBeLessThan(
            1e-6
          );
        }
      )
    );
  });
});

describe('currencyFormatter properties', () => {
  const amountArb = fc.double({
    min: -1_000_000_000,
    max: 1_000_000_000,
    noNaN: true,
    noDefaultInfinity: true,
  });

  const parseAmount = (formatted) => Number(formatted.replace(/[^\d.-]/g, ''));

  it('always renders exactly two fraction digits', () => {
    fc.assert(
      fc.property(amountArb, (amount) => {
        expect(currencyFormatter.format(amount)).toMatch(/\.\d{2}$/);
      })
    );
  });

  it('round-trips back to the amount within half a cent', () => {
    fc.assert(
      fc.property(amountArb, (amount) => {
        const parsed = parseAmount(currencyFormatter.format(amount));
        expect(Math.abs(parsed - amount)).toBeLessThanOrEqual(0.005);
      })
    );
  });

  it('formatting is idempotent', () => {
    fc.assert(
      fc.property(amountArb, (amount) => {
        const once = currencyFormatter.format(amount);
        expect(currencyFormatter.format(parseAmount(once))).toBe(once);
      }),
      {
        examples: [[0.1 + 0.2], [1.005], [-0.005]],
      }
    );
  });
});
