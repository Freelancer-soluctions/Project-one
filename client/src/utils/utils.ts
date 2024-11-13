// import { toast } from 'sonner'

/**
 * Convierte una imagen a base64
 * @param {File} file imagen a ser convertida
 * @returns {string} imagen en base64
 */
// async function getImageFile (file) {
//   try {
//     return new Promise((resolve, reject) => {
//       const reader = new FileReader()

//       reader.onloadend = () => {
//         resolve(reader.result)
//       }

//       reader.onerror = () => {
//         reject(new Error('Error al leer la imagen'))
//       }

//       if (file) {
//         reader.readAsDataURL(file)
//       } else {
//         reject(new Error('Error al cargar la imagen'))
//       }
//     })
//   } catch (error) {
//     return ''
//   }
// }

/**
 * Convierte las imagenes a base64
 * aviso: esta funcion usa react hot toaster
 * @param {File} images Archivos del input
 * @param {number} amountLimit Cantidad de imagenes a subir
 * @returns {array} array de imagenes
 */

// export async function ConvertToBase64 (images, amountLimit) {
//   const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'bmp']
//   const maxSize = 5 * 1024 * 1024 // 5MB

//   const imagePromises = Array.from(images)
//     .slice(0, amountLimit || 1)
//     .map(async (file) => {
//       try {
//         const extension = file.name.split('.').pop().toLowerCase()
//         const size = file.size

//         // Validación del tamaño del archivo
//         if (size > maxSize) {
//           console.warn(`La imagen "${file.name}" excede el límite de tamaño permitido (5MB) y no será cargada.`)
//           toast.warning(`La imagen "${file.name}" excede el límite de tamaño permitido (5MB) y no será cargada.`)
//           return null
//         }

//         if (allowedExtensions.includes(extension)) {
//           return await getImageFile(file)
//         } else {
//           console.warn(`La imagen "${file.name}" no tiene una extensión permitida.`)
//           toast.warning(`La imagen "${file.name}" no tiene una extensión permitida.`)
//           return null
//         }
//       } catch (error) {
//         console.warn(`Error al cargar la imagen: ${error.message}`)
//         toast.warning('Error al cargar la imagen')
//         return null
//       }
//     })

//   if (Array.from(images).length > amountLimit) {
//     console.warn(
//       `Solo se subirán ${amountLimit} ${amountLimit > 1 ? 'imágenes' : 'imagen'}.`
//     )
//     toast.warning(`Solo se subirán ${amountLimit} ${amountLimit > 1 ? 'imágenes' : 'imagen'}.`)
//   }

//   const imageResults = await Promise.allSettled(imagePromises)

//   const previewImages = imageResults
//     .filter((result) => result.status === 'fulfilled')
//     .map((result) => result.value)
//     .filter((image) => image !== null)

//   if (!amountLimit) {
//     return previewImages[0]
//   }

//   return previewImages
// }

/**
 *
 * @param {string} value valor numerico en string
 * @returns {object} value numerico, formated valor con puntos de separación
 */

export function ParseNumber (value: string) {
  return {
    value: Number(value.replace(/\D/g, '')),
    formated: value.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }
}

/**
 *
 * @param {Array} data array de strings
 * @returns {Array} objeto con propiedades id y label
 */

export function ConvertToList (data: any[]) {
  return [
    ...data.map((e) => {
      return {
        id: e
          .replace(/ /g, '-')
          .toUpperCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, ''),
        label: e
      }
    })
  ]
}

/**
 *
 * @param {Key} token header
 * @returns {item} token en formato json
 */
export const getLocalStorage = (key: string) => {
  const item = localStorage.getItem(key)

  if (!item) return
  try {
    return JSON.parse(item)
  } catch (error) {
    console.log(error)
    localStorage.removeItem(key)
  }
  return item
}

/**
 * Obtiene las queries de la url actual del navegador y filtra por las declaras dentro de la funcion
 * @param {string} property indica la propiedad a cambiar de las queries disponibles
 * @param {any} value valor a asignar en la propiedad elegida
 * @returns {string} las queries filtradas y actualizadas
 */

export function getURLQueries(property: string, value: string | number | null): string | null {
  const url = new URLSearchParams(window.location.search);
  const values: Record<string, string | null> = {
    search: url.get('search'),
    page: url.get('page'),
    limit: url.get('limit'),
    discount: url.get('discount'),
  };

  if (property) {
    values[property] = value?.toString() ?? null;
  }

  for (const key in values) {
    if (values[key] === null) {
      delete values[key];
    }
  }

  const queryString = new URLSearchParams(values as Record<string, string>).toString();
  return queryString ? '?' + queryString : null;
}

export function getSpecificQuery (property: string) {
  const url = new URLSearchParams(window.location.search)
  const value = url.get(property) || ''

  return value
}
