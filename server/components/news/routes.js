import { Router } from 'express'
import { News, NewsUpdate, NewsFilters } from '../../utils/joiSchemas/joi.js'
import * as newsController from './controller.js'
import upload from '../../utils/multer/multer.js'
import validateQueryParams from '../../middleware/validateQueryParams.js'
import validateSchema from '../../middleware/validateSchema.js'
import verifyToken from '../../middleware/verifyToken.js'

const router = Router()

/**
@openapi
 * /api/v1/news:
 *   get:
 *     tags:
 *       - News
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
 *                     $ref: "#/components/schemas/News"
 *       5XX:
 *         description: FAILED
 *         content:
 *           application/json:
 *             schema:
 *              $ref: "#/components/schemas/Error"
 *
 */

router.get('/', verifyToken, validateQueryParams(NewsFilters), newsController.getAll)

/**
@openapi
 * /api/v1/news/{id}:
 *   get:
 *     tags:
 *       - News
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: int
 *         description: The News identifier
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
 *                  $ref: "#/components/schemas/News"
 *       5XX:
 *         description: FAILED
 *         content:
 *           application/json:
 *             schema:
 *              $ref: "#/components/schemas/Error"
 *
 */

router.get('/:id', newsController.getOneById)

/**
 * @openapi
 * /api/v1/news:
 *   post:
 *     tags:
 *       - News
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         schema:
 *          type: string
 *         required: true
 *     requestBody:
 *         content:
 *          multipart/form-data:
 *           schema:
 *            $ref: "#/components/schemas/NewsBody"
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *              $ref: "#/components/schemas/Create"
 *       5XX:
 *         description: FAILED
 *         content:
 *           application/json:
 *             schema:
 *              $ref: "#/components/schemas/Error"
 *
 */

router.post('/',
  upload.single('document'),
  validateSchema(News),
  newsController.createOne)

/**
 * @openapi
 * /api/v1/news/{id}:
 *   put:
 *     tags:
 *       - News
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: int
 *         description: The news identifier
 *       - in: header
 *         name: x-access-token
 *         schema:
 *          type: string
 *         required: true
 *     requestBody:
 *         content:
 *          multipart/form-data:
 *           schema:
 *            $ref: "#/components/schemas/NewsBody"
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *              $ref: "#/components/schemas/Update"
 *       5XX:
 *         description: FAILED
 *         content:
 *           application/json:
 *             schema:
 *              $ref: "#/components/schemas/Error"
 *
 */

router.put('/:id',
  upload.single('document'),
  validateSchema(NewsUpdate),
  newsController.updateById)

/**
 * @openapi
 * /api/v1/news/{id}:
 *   delete:
 *     tags:
 *       - News
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: int
 *         description: The news identifier
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
 *              $ref: "#/components/schemas/Delete"
 *       5XX:
 *         description: FAILED
 *         content:
 *           application/json:
 *             schema:
 *              $ref: "#/components/schemas/Error"
 */

router.delete('deleteNews/:id', newsController.deleteById)

export default router
