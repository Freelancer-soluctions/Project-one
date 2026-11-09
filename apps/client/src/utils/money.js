/**
 * Cálculo monetario de líneas de detalle (ventas y compras).
 *
 * Vive aquí —y no dentro de cada diálogo— porque es el SUT real de las
 * propiedades de `src/properties/money.properties.unit.test.js`: una propiedad
 * que reimplementa el cálculo en el test no prueba nada del producto. Antes
 * estaba duplicado, idéntico, en `SalesDialog.jsx` y `PurchaseDialog.jsx`
 * (change `pbt-hardening`, tarea 2.2).
 *
 * Reglas de dominio que el cálculo garantiza:
 * - Una fila sin precio o sin cantidad numérica aporta 0 (nunca `NaN`).
 * - Los valores llegan como string desde los inputs del formulario, así que se
 *   normalizan con `Number(...)` antes de multiplicar.
 *
 * @param {Array<{ price?: unknown, quantity?: unknown }>} details Filas del detalle.
 * @returns {number} Total sin redondear (los diálogos aplican `toFixed(2)`).
 */
export const sumLineItems = (details) =>
  details.reduce((sum, detail) => {
    const price = Number(detail.price) || 0;
    const quantity = Number(detail.quantity) || 0;
    return sum + price * quantity;
  }, 0);
