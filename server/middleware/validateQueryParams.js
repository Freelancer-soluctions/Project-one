const validateQueryParams = (schema) => {
  return (req, res, next) => {
    const { query } = req
    // console.log('pruebas', schema, query)
    const { error } = schema.validate(query, { abortEarly: false })
    if (error) {
      const { details } = error
      const messages = details?.map((errorDetail) => errorDetail.message)
      return res.status(400).json({ error: messages })
    }
    next()
  }
}

export default validateQueryParams
