import { Router } from 'express'
import { News, NewsUpdate, NewsFilters } from '../../utils/joiSchemas/joi.js'
import * as newsController from './controller.js'
import upload from '../../utils/multer/multer.js'
import validateQueryParams from '../../middleware/validateQueryParams.js'
import validateSchema from '../../middleware/validateSchema.js'
import verifyToken from '../../middleware/verifyToken.js'

const router = Router()

/**
 * @openapi
 * /api/v1/news:
 *   get:
 *     tags:
 *       - News
 *     security:
 *       - bearerAuth: []
 *     summary: "Obtener news"
 *     description: "Obtiene la lista de eventos junto con la información del tipo de evento. Se puede filtrar usando 'searchQuery'."
 *     parameters:
 *       - in: query
 *         name: filters
 *         schema:
 *           $ref: "#/components/schemas/NewsFilters"
 *         required: false
 *         description: "Filtros opcionales para buscar estados de noticias."
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
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "Some success message"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: "#/components/schemas/ResponseGetNews"
 *       401:
 *         description: "Unauthorized"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Unauthorized"
 *       5XX:
 *         description: "Error inesperado"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */

router.get('/', verifyToken, validateQueryParams(NewsFilters), newsController.getAllNews)

/**
 * @openapi
 * /api/v1/news/status:
 *   get:
 *     summary: "Obtener estado de noticias"
 *     description: "Obtiene la lista de estados de noticias disponibles."
 *     tags:
 *       - News
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
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "Some success message"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: "#/components/schemas/NewsStatus"
 *       5XX:
 *         description: "Error inesperado"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */

router.get('/status', newsController.getAllNewsStatus)
/**
 * @openapi
 * /api/v1/news:
 *   post:
 *     tags:
 *       - News
 *     security:
 *       - bearerAuth: []
 *     summary: "Crea una noticia"
 *     description: "Este endpoint requiere autenticación. El userId se extrae automáticamente del token JWT."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/BodyNewsCreate"
 *     responses:
 *       201:
 *         description: Created
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
 *                 message:
 *                   type: string
 *                   example: "Some success message"
 *                 data:
 *                   $ref: "#/components/schemas/ResponseNewsCreateUpdate"

 *       401:
 *         description: "Unauthorized"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Unauthorized"
 *       5XX:
 *         description: FAILED
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */

router.post('/', verifyToken, validateSchema(News), upload.single('document'), newsController.createNew)

/**
 * @openapi
 * /api/v1/news/{id}:
 *   put:
 *     tags:
 *       - News
 *     security:
 *       - bearerAuth: []
 *     summary: "Actualiza una noticia"
 *     description: "Este endpoint requiere autenticación. El userId se extrae automáticamente del token JWT."
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: "ID de la noticia a actualizar."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/NewsUpdate"
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
 *                 statusCode:
 *                   type: int
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "Some success message"
 *                 data:
 *                   $ref: "#/components/schemas/ResponseNewsCreateUpdate"
 *       401:
 *         description: "Unauthorized"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Unauthorized"
 *       5XX:
 *         description: FAILED
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *
 */

router.put('/:id', verifyToken, validateSchema(NewsUpdate), upload.single('document'), newsController.updateById)

/**
 * @openapi
 * /api/v1/news/{id}:
 *   delete:
 *     tags:
 *       - News
 *     security:
 *       - bearerAuth: []
 *     summary: "Elimina una noticia"
 *     description: "Este endpoint requiere autenticación. El userId se extrae automáticamente del token JWT."
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: "ID de la noticia a eliminar."
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Delete"
 *       401:
 *         description: "Unauthorized"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Unauthorized"
 *       5XX:
 *         description: FAILED
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
router.delete('/:id', verifyToken, newsController.deleteById)

export default router

// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzQxNjU4MDk0LCJleHAiOjE3NDE3NDQ0OTR9.gCvtnnndKLvGt0X9VKjo1gtjMkKtuK12syLFg7BNDLo
