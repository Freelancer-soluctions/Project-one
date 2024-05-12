const validateSchema = (schema) => {
  return (req, res, next) => {
    const { body } = req
    const { error } = schema.validate(body, { abortEarly: false })
    if (error) {
      const { details } = error
      const messages = details?.map((errorDetail) => errorDetail.message)
      return res.status(422).json({ error: messages })
    }
    next()
  }
}

export default validateSchema
