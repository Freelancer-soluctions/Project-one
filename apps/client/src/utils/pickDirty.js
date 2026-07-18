/**
 * pickDirty — Extrae solo los campos modificados por el usuario
 * usando dirtyFields de react-hook-form.
 *
 * Categoría: Pure utility function (sin hooks, sin estado, sin efectos).
 * No es un hook porque no usa React APIs — solo transforma datos.
 * No es un componente — es una función de utilería reutilizable.
 *
 * @param {Object} data        — Valores completos del formulario (form.handleSubmit)
 * @param {Object} dirtyFields — formState.dirtyFields de react-hook-form
 * @returns {Object}           — Solo los campos que el usuario tocó/modificó
 *
 * @example
 *   const { formState: { dirtyFields } } = form;
 *   const onSubmit = (data) => {
 *     const changes = pickDirty(data, dirtyFields);
 *     await api.patch(id, changes);
 *   };
 *
 *   // dirtyFields: { title: true, status: { id: true } }
 *   // data: { title: 'Nuevo', content: '...', status: { id: 2, code: 'TODO' } }
 *   // Returns: { title: 'Nuevo', status: { id: 2 } }
 */
export function pickDirty(data, dirtyFields) {
  if (!dirtyFields || typeof dirtyFields !== 'object') return {};

  return Object.keys(dirtyFields).reduce((acc, key) => {
    const dirtyVal = dirtyFields[key];

    if (Array.isArray(dirtyVal)) {
      // Field array (ej: field array de react-hook-form)
      acc[key] = data[key];
    } else if (isObject(dirtyVal)) {
      // Objeto anidado — recursión para campos como address.street
      const nested = pickDirty(data[key], dirtyVal);
      if (Object.keys(nested).length > 0) {
        acc[key] = nested;
      }
    } else if (dirtyVal === true) {
      // Campo plano/primitivo
      acc[key] = data[key];
    }

    return acc;
  }, {});
}

function isObject(val) {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
}
