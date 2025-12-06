import express from 'express'
import { cspReportHandler } from '../../middleware'
import logger from '../../logger/index.js'

const router = express.Router()

// --------------------------------------------------------------
// Ruta para recibir reportes automáticos de CSP
// --------------------------------------------------------------
router.post('/csp-report', cspReportHandler(logger))

export default router
