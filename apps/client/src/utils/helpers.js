export const generateCode = async (providers) => {
  let index = 1; // Inicia el contador desde 1

  // Extrae los códigos existentes en un array de strings
  const existingCodeValues = providers.map((item) => item.code);

  let newCode = `C${String(index).padStart(2, '0')}`; // Formatea el número como "C01"

  // Mientras el código generado ya exista en la lista, sigue incrementando el índice
  while (existingCodeValues.includes(newCode)) {
    index++; // Aumenta el índice
    newCode = `C${String(index).padStart(2, '0')}`; // Genera el nuevo código formateado
  }

  return newCode; // Retorna el primer código disponible que no esté en la lista
};
