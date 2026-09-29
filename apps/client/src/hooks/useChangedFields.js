import { useCallback, useMemo, useState } from 'react';

/**
 * Comparación profunda inline (sin dependencias externas), siguiendo el
 * patrón de `fast-deep-equal`: primitivos por `===`, fechas por timestamp,
 * arrays y objetos planos por comparación recursiva de claves.
 *
 * Descompuesta en helpers para mantener baja la complejidad ciclomática
 * (regla `complexity` de ESLint del repo).
 */

const isNaNValue = (value) => Number.isNaN(value);

const isObjectLike = (value) => typeof value === 'object' && value !== null;

const compareDates = (a, b) =>
  a instanceof Date && b instanceof Date && a.getTime() === b.getTime();

const compareArrays = (a, b) =>
  a.length === b.length && a.every((item, i) => deepEqual(item, b[i]));

const comparePlainObjects = (a, b) => {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  return (
    keysA.length === keysB.length &&
    keysA.every((key) => Object.hasOwn(b, key) && deepEqual(a[key], b[key]))
  );
};

const compareObjectLike = (a, b) => {
  if (Array.isArray(a) || Array.isArray(b)) {
    return Array.isArray(a) && Array.isArray(b) && compareArrays(a, b);
  }
  return comparePlainObjects(a, b);
};

/**
 * Comparación profunda de dos valores.
 *
 * @param {*} a - Primer valor.
 * @param {*} b - Segundo valor.
 * @returns {boolean} true si los valores son profundamente iguales.
 */
export const deepEqual = (a, b) => {
  if (a === b) return true;
  if (!isObjectLike(a) || !isObjectLike(b)) {
    // NaN === NaN es false; para diffs de formularios NaN se considera igual a NaN.
    return isNaNValue(a) && isNaNValue(b);
  }
  if (a instanceof Date || b instanceof Date) return compareDates(a, b);
  return compareObjectLike(a, b);
};

/**
 * useChangedFields — estado de formulario con detección de campos cambiados.
 *
 * Mantiene los valores actuales del form y calcula, frente a los valores
 * iniciales (registro cargado), un objeto `changedFields` con solo las claves
 * modificadas — el payload ideal para enviar en un `PATCH`.
 *
 * @param {Object} initialValues - Valores originales del registro (se copyan;
 *   mutarlos externamente no afecta al hook).
 * @returns {Object} API del hook.
 * @returns {Object} returns.values - Valores actuales del formulario.
 * @returns {Function} returns.setField - setField(name, value): actualiza un campo.
 * @returns {Function} returns.setValues - setValues(next): reemplaza el estado completo.
 * @returns {Function} returns.reset - reset(next?): re-siembra los valores iniciales.
 * @returns {Object} returns.changedFields - Objeto con solo los campos cambiados (diff profundo).
 * @returns {Array<string>} returns.changedKeys - Claves cambiadas.
 * @returns {boolean} returns.hasChanges - true si hay al menos un campo cambiado.
 *
 * @example
 * const { values, setField, changedFields, hasChanges } = useChangedFields(event);
 * const handleSave = () => hasChanges && patchEvent({ id, data: changedFields });
 */
export const useChangedFields = (initialValues = {}) => {
  const [seed] = useState(() => initialValues ?? {});
  const [values, setValues] = useState(() => ({ ...(initialValues ?? {}) }));

  const setField = useCallback((name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const reset = useCallback(
    (next) => {
      const source = next ?? seed;
      setValues({ ...(source ?? {}) });
    },
    [seed]
  );

  const changedFields = useMemo(() => {
    const diff = {};
    for (const key of Object.keys(values)) {
      if (!deepEqual(values[key], seed[key])) diff[key] = values[key];
    }
    return diff;
  }, [values, seed]);

  const changedKeys = useMemo(
    () => Object.keys(changedFields),
    [changedFields]
  );

  const hasChanges = useMemo(() => changedKeys.length > 0, [changedKeys]);

  return {
    values,
    setField,
    setValues,
    reset,
    changedFields,
    changedKeys,
    hasChanges,
  };
};

export default useChangedFields;
