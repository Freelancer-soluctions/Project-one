import { Router } from 'express';
import {
  EventsCreateUpdate,
  EventsFilters,
} from '../../utils/joiSchemas/joi.js';
import * as eventsController from './controller.js';
import {
  validateQueryParams,
  validateSchema,
  verifyToken,
  checkRoleAuthOrPermisssion,
  validatePathParam,
} from '../../middleware/index.js';
import { ROLESCODES, PERMISSIONCODES } from '../../utils/constants/enums.js';

const router = Router();
// uso global de middleware
router.use(verifyToken);

/**
 * @openapi
 * /api/v1/events:
 *   post:
 *     tags:
 *       - Events
 *     security:
 *       - bearerAuth: []
 *     summary: "Crea un provider"
 *     description: "Este endpoint requiere autenticación. El userId se extrae automáticamente del token JWT."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/BodyEventCreateUpdate"
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
 *                   $ref: "#/components/schemas/ResponseEventCreateUpdate"
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

router.post(
  '/',
  checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER, ROLESCODES.USER],
    permissions: [PERMISSIONCODES.canCreateEvents],
  }),
  validateSchema(EventsCreateUpdate),
  eventsController.createEvent
);

/**
 * @openapi
 * /api/v1/events/eventTypes:
 *   get:
 *     summary: "Obtener event types"
 *     description: "Obtiene la lista de eventos disponibles."
 *     tags:
 *       - Events
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
 *                     $ref: "#/components/schemas/GetEventsTypes"
 *       5XX:
 *         description: "Error inesperado"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */

router.get(
  '/eventTypes',
  checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER, ROLESCODES.USER],
    permissions: [PERMISSIONCODES.canViewEvents],
  }),
  eventsController.getAllEventTypes
);

/**
 * @openapi
 * /api/v1/events:
 *   get:
 *     tags:
 *       - Events
 *     security:
 *       - bearerAuth: []
 *     summary: "Obtener eventos"
 *     description: "Obtiene la lista de eventos junto con la información del tipo de evento. Se puede filtrar usando 'searchQuery'."
 *     parameters:
 *       - in: query
 *         name: searchQuery
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 30
 *         required: false
 *         description: "Texto para buscar en el título o descripción del evento. Puede estar vacío."
 *         example: "Tech Conference 2025"
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
 *                     $ref: "#/components/schemas/ResponseGetEvents"
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

router.get(
  '/',
  checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER, ROLESCODES.USER],
    permissions: [PERMISSIONCODES.canViewEvents],
  }),
  validateQueryParams(EventsFilters),
  eventsController.getAllEvents
);

/**
 * @openapi
 * /api/v1/events/{id}:
 *   put:
 *     tags:
 *       - Events
 *     security:
 *       - bearerAuth: []
 *     summary: "Actualiza un evento"
 *     description: "Este endpoint requiere autenticación. El userId se extrae automáticamente del token JWT."
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: "ID del evento a actualizar."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/BodyEventCreateUpdate"
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
 *                   $ref: "#/components/schemas/ResponseEventCreateUpdate"
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
router.put(
  '/:id',
  checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER, ROLESCODES.USER],
    permissions: [PERMISSIONCODES.canEditEvents],
  }),
  validatePathParam,
  validateSchema(EventsCreateUpdate),
  eventsController.updateEventById
);

/**
 * @openapi
 * /api/v1/events/{id}:
 *   delete:
 *     tags:
 *       - Events
 *     security:
 *       - bearerAuth: []
 *     summary: "Elimina un evento"
 *     description: "Este endpoint requiere autenticación. El userId se extrae automáticamente del token JWT."
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: "ID del evento a eliminar."
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

router.delete(
  '/:id',
  checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER, ROLESCODES.USER],
    permissions: [PERMISSIONCODES.canDeleteEvents],
  }),
  validatePathParam,
  eventsController.deleteEventById
);

export default router;
