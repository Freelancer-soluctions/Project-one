import express from 'express'
import {
  getAllClients,
  createClient,
  updateClientById,
  deleteClientById
} from './controller.js'
import verifyToken from '../../middleware/verifyToken.js'
import validateSchema from '../../middleware/validateSchema.js'
import validateQueryParams from '../../middleware/validateQueryParams.js'
import { clientFiltersSchema, clientCreateUpdateSchema } from '../../utils/joiSchemas/joi.js'

const router = express.Router()

/**
 * @openapi
 * /v1/clients:
 *   get:
 *     tags:
 *       - Clients
 *     summary: Get all clients with optional filters
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: Filter by client name
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *           format: email
 *         description: Filter by client email
 *       - in: query
 *         name: phone
 *         schema:
 *           type: string
 *           maxLength: 15
 *         description: Filter by client phone
 *     responses:
 *       200:
 *         description: List of clients retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                   example: false
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ResponseGetClient'
 *       401:
 *         $ref: '#/components/schemas/Unauthorized'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.get(
  '/',
  verifyToken,
  validateQueryParams(clientFiltersSchema),
  getAllClients
)

/**
 * @openapi
 * /v1/clients:
 *   post:
 *     tags:
 *       - Clients
 *     summary: Create a new client
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BodyClientCreate'
 *     responses:
 *       201:
 *         description: Client created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                   example: false
 *                 statusCode:
 *                   type: integer
 *                   example: 201
 *                 data:
 *                   $ref: '#/components/schemas/ResponseClientCreate'
 *       401:
 *         $ref: '#/components/schemas/Unauthorized'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.post(
  '/',
  verifyToken,
  validateSchema(clientCreateUpdateSchema),
  createClient
)

/**
 * @openapi
 * /v1/clients/{id}:
 *   put:
 *     tags:
 *       - Clients
 *     summary: Update a client by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Client ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BodyClientUpdate'
 *     responses:
 *       200:
 *         description: Client updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                   example: false
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   $ref: '#/components/schemas/ResponseClientUpdate'
 *       401:
 *         $ref: '#/components/schemas/Unauthorized'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.put(
  '/:id',
  verifyToken,
  validateSchema(clientCreateUpdateSchema),
  updateClientById
)

/**
 * @openapi
 * /v1/clients/{id}:
 *   delete:
 *     tags:
 *       - Clients
 *     summary: Delete a client by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Client ID
 *     responses:
 *       200:
 *         $ref: '#/components/schemas/Delete'
 *       401:
 *         $ref: '#/components/schemas/Unauthorized'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.delete(
  '/:id',
  verifyToken,
  deleteClientById
)

export default router
