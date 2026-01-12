const objectToFormData = data => {
  const formData = new FormData()
  Object.keys(data).forEach(key => {
    if (Array.isArray(data[key])) {
      formData.append(key, JSON.stringify(data[key]))
    } else {
      formData.append(key, data[key] || '')
    }
  })
  return formData
}

export default objectToFormData
