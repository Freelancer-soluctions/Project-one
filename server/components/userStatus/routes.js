import { Router } from 'express'
import { UserStatus } from '../../libs/joi.js'
import { validateSchema } from '../../middleware/validateSchema.js'
import {
    createRow,
    deleteRowById,
    getAllRows,
    updateRowById
} from './controller.js'

const router = Router()

/**
@openapi
 * /api/v1/userStatus:
 *   get:
 *     tags:
 *       - userStatus
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         schema:
 *          type: string
 *         required: true
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: "#/components/schemas/userStatus"
 *       5XX:
 *         description: FAILED
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Some error message"
 *
 *
 */

router.get('/', getAllRows)


/**
 * @openapi
 * /api/v1/userStatus:
 *   post:
 *     tags:
 *       - userStatus
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         schema:
 *          type: string
 *         required: true
 *     requestBody:
 *         content:
 *          application/json:
 *           schema:
 *            $ref: "#/components/schemas/StatusBody"
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Item created successfully"
 *       5XX:
 *         description: FAILED
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Some error message"
 *
 *
 */

router.post('/', validateSchema(UserStatus), createRow)

/**
 * @openapi
 * /api/v1/userStatus/{id}:
 *   put:
 *     tags:
 *       - userStatus
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: int
 *         description: The userStatus identifier
 *       - in: header
 *         name: x-access-token
 *         schema:
 *          type: string
 *         required: true
 *     requestBody:
 *         content:
 *          application/json:
 *           schema:
 *            $ref: "#/components/schemas/StatusBody"
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Item updated successfully"
 *       5XX:
 *         description: FAILED
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Some error message"
 *
 *
 */

router.put('/:id', validateSchema(UserStatus), updateRowById)

/**
 * @openapi
 * /api/v1/userStatus/{id}:
 *   delete:
 *     tags:
 *       - userStatus
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: int
 *         description: The userStatus identifier
 *       - in: header
 *         name: x-access-token
 *         schema:
 *          type: string
 *         required: true
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Item deleted successfully"
 *       5XX:
 *         description: FAILED
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Some error message"
 */

router.delete('/:id', deleteRowById)

export default router
